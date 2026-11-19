use std::time::Instant;

use rusqlite::{params, Connection};

use crate::erro::AppResult;

use super::{modelo::{CicloSync, Conflito, Instalacao, ResultadoSync, StatusSync}, outbox, transporte::Transporte};

fn config(conexao: &Connection, chave: &str, padrao: &str) -> String {
    conexao
        .query_row("SELECT valor FROM configuracoes WHERE chave = ?1", params![chave], |linha| linha.get(0))
        .unwrap_or_else(|_| padrao.to_string())
}

/// Status completo exibido na tela de sincronização (RF2-015).
pub fn status(conexao: &Connection) -> AppResult<StatusSync> {
    let mut declaracao = conexao.prepare(
        "SELECT id, nome, site, status, ultima_sincronizacao, criada_em
         FROM instalacoes ORDER BY nome",
    )?;
    let instalacoes = declaracao.query_map([], |linha| {
        Ok(Instalacao {
            id: linha.get(0)?, nome: linha.get(1)?, site: linha.get(2)?,
            status: linha.get(3)?, ultima_sincronizacao: linha.get(4)?, criada_em: linha.get(5)?,
        })
    })?.collect::<Result<Vec<_>, _>>()?;
    drop(declaracao);

    let pendencias: i64 = conexao.query_row("SELECT COUNT(*) FROM outbox WHERE processado = 0", [], |l| l.get(0))?;
    let conflitos_pendentes: i64 = conexao.query_row(
        "SELECT COUNT(*) FROM conflitos_sincronizacao WHERE estado = 'pendente'", [], |l| l.get(0)
    )?;

    let mut declaracao = conexao.prepare(
        "SELECT id, instalacao_id, direcao, itens, duracao_ms, status, detalhe, realizada_em
         FROM sincronizacoes ORDER BY realizada_em DESC LIMIT 10",
    )?;
    let ciclos = declaracao.query_map([], |linha| {
        Ok(CicloSync {
            id: linha.get(0)?, instalacao_id: linha.get(1)?, direcao: linha.get(2)?,
            itens: linha.get(3)?, duracao_ms: linha.get(4)?, status: linha.get(5)?,
            detalhe: linha.get(6)?, realizada_em: linha.get(7)?,
        })
    })?.collect::<Result<Vec<_>, _>>()?;
    drop(declaracao);

    let mut declaracao = conexao.prepare(
        "SELECT id, entidade, entidade_id, versao_local_json, versao_remota_json, estado, detectado_em
         FROM conflitos_sincronizacao WHERE estado = 'pendente' ORDER BY detectado_em DESC",
    )?;
    let conflitos = declaracao.query_map([], |linha| {
        Ok(Conflito {
            id: linha.get(0)?, entidade: linha.get(1)?, entidade_id: linha.get(2)?,
            versao_local_json: linha.get(3)?, versao_remota_json: linha.get(4)?,
            estado: linha.get(5)?, detectado_em: linha.get(6)?,
        })
    })?.collect::<Result<Vec<_>, _>>()?;

    Ok(StatusSync {
        ativa: config(conexao, "f2_sync_ativa", "false") == "true",
        instalacao_id: config(conexao, "f2_instalacao_id", "matriz-sp"),
        instalacoes,
        pendencias: pendencias as usize,
        conflitos_pendentes: conflitos_pendentes as usize,
        ciclos,
        conflitos,
    })
}

/// Executa um ciclo completo de sincronização (RF2-017/RF2-020).
pub fn sincronizar(conexao: &mut Connection, transporte: &dyn Transporte) -> AppResult<ResultadoSync> {
    let inicio = Instant::now();
    let origem = config(conexao, "f2_instalacao_id", "matriz-sp");
    // Reatribui a configuração do cursor ao final do ciclo.
    let cursor: Option<String> = conexao
        .query_row("SELECT valor FROM configuracoes WHERE chave = 'f2_sync_cursor'", [], |l| l.get(0))
        .ok();
    let cursor = cursor.filter(|texto| !texto.is_empty());

    let lote = outbox::pendentes(conexao, 500)?;
    let enviados = transporte.enviar(&lote)?;
    let ids: Vec<i64> = lote.iter().map(|mudanca| mudanca.id).collect();
    outbox::marcar_processados(conexao, &ids)?;

    let recebidas = transporte.receber(cursor.as_deref())?;
    let transacao = conexao.transaction()?;
    let mut aplicadas = 0usize;
    let mut ignoradas = 0usize;
    let mut conflitos = 0usize;
    for remota in &recebidas {
        match outbox::aplicar_remota(&transacao, remota)? {
            outbox::ResultadoAplicacao::Aplicada => aplicadas += 1,
            outbox::ResultadoAplicacao::Ignorada => ignoradas += 1,
            outbox::ResultadoAplicacao::Conflito => conflitos += 1,
        }
    }
    transacao.commit()?;

    let duracao_ms = inicio.elapsed().as_millis() as i64;
    let agora = chrono::Local::now().to_rfc3339();
    conexao.execute(
        "INSERT INTO sincronizacoes (instalacao_id, direcao, itens, duracao_ms, status, detalhe)
         VALUES (?1, 'envio', ?2, ?3, 'sucesso', ?4)",
        params![origem, enviados as i64, duracao_ms, format!("{} enviados", enviados)],
    )?;
    conexao.execute(
        "INSERT INTO sincronizacoes (instalacao_id, direcao, itens, duracao_ms, status, detalhe)
         VALUES (?1, 'recebimento', ?2, ?3, 'sucesso', ?4)",
        params![origem, recebidas.len() as i64, duracao_ms, format!("{} aplicadas, {} ignoradas, {} conflitos", aplicadas, ignoradas, conflitos)],
    )?;
    conexao.execute(
        "UPDATE instalacoes SET ultima_sincronizacao = ?2 WHERE id = ?1",
        params![origem, agora],
    )?;
    conexao.execute(
        "INSERT INTO configuracoes (chave, valor) VALUES ('f2_sync_cursor', ?1)
         ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor",
        params![agora],
    )?;

    Ok(ResultadoSync {
        enviados,
        recebidos: aplicadas,
        conflitos,
        duracao_ms,
        transporte: transporte.nome().to_string(),
    })
}

pub fn cadastrar_instalacao(conexao: &Connection, id: &str, nome: &str, site: Option<&str>) -> AppResult<()> {
    conexao.execute(
        "INSERT INTO instalacoes (id, nome, site) VALUES (?1, ?2, ?3)
         ON CONFLICT(id) DO UPDATE SET nome = excluded.nome, site = excluded.site",
        params![id, nome, site],
    )?;
    Ok(())
}

pub fn resolver_conflito(conexao: &Connection, id: i64, vencedor: &str) -> AppResult<()> {
    let estado = if vencedor == "local" { "resolvido_local" } else { "resolvido_remoto" };
    conexao.execute(
        "UPDATE conflitos_sincronizacao SET estado = ?2 WHERE id = ?1",
        params![id, estado],
    )?;
    Ok(())
}

#[cfg(test)]
mod testes {
    use super::*;
    use crate::repositorio::migrations::aplicar_migrations;
    use crate::sincronizacao::outbox;
    use crate::sincronizacao::transporte::TransporteArquivo;
    use std::fs;

    #[test]
    fn ciclo_completo_e_idempotente() {
        let diretorio = std::env::temp_dir().join(format!("print360_sync_{}", std::process::id()));
        fs::create_dir_all(&diretorio).unwrap();
        let caminho = diretorio.join("sync.jsonl");
        let transporte = TransporteArquivo::novo(&caminho);

        let mut conexao = Connection::open_in_memory().unwrap();
        aplicar_migrations(&conexao).unwrap();
        conexao.execute("INSERT INTO usuarios (nome, login, perfil) VALUES ('Ana','ana','administrador')", []).unwrap();
        outbox::registrar(&conexao, "configuracoes", 0, "update", r#"{"chave":"moeda","valor":"BRL"}"#).unwrap();

        let primeiro = sincronizar(&mut conexao, &transporte).unwrap();
        assert_eq!(primeiro.enviados, 1);

        // Segundo ciclo não reenvia a mesma mudança (idempotência).
        let segundo = sincronizar(&mut conexao, &transporte).unwrap();
        assert_eq!(segundo.enviados, 0);

        let status = status(&conexao).unwrap();
        assert_eq!(status.ciclos.len(), 4);
        assert_eq!(status.pendencias, 0);

        drop(conexao);
        fs::remove_dir_all(&diretorio).unwrap();
    }
}
