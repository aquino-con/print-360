use rusqlite::{params, Connection};

use crate::erro::{AppResult, AppError};

use super::modelo::{Mudanca, MudancaRemota};

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ResultadoAplicacao {
    Aplicada,
    Ignorada,
    Conflito,
}

fn config(conexao: &Connection, chave: &str, padrao: &str) -> String {
    conexao
        .query_row("SELECT valor FROM configuracoes WHERE chave = ?1", params![chave], |linha| linha.get(0))
        .unwrap_or_else(|_| padrao.to_string())
}

fn origem_local(conexao: &Connection) -> String {
    config(conexao, "f2_instalacao_id", "matriz-sp")
}

/// Registra uma alteração local no outbox com versão monotônica por entidade (RF2-016).
pub fn registrar(
    conexao: &Connection,
    entidade: &str,
    entidade_id: i64,
    operacao: &str,
    payload: &str,
) -> AppResult<()> {
    let origem = origem_local(conexao);
    let versao: i64 = conexao.query_row(
        "SELECT COALESCE(MAX(versao), 0) + 1 FROM versoes_entidade
         WHERE entidade = ?1 AND entidade_id = ?2",
        params![entidade, entidade_id],
        |linha| linha.get(0),
    )?;

    conexao.execute(
        "INSERT INTO versoes_entidade (entidade, entidade_id, versao, origem, payload)
         VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT(entidade, entidade_id) DO UPDATE SET
             versao = excluded.versao, origem = excluded.origem,
             payload = excluded.payload, atualizada_em = CURRENT_TIMESTAMP",
        params![entidade, entidade_id, versao, origem, payload],
    )?;

    conexao.execute(
        "INSERT OR IGNORE INTO outbox
            (instalacao_origem, entidade, entidade_id, versao, operacao, payload_json)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![origem, entidade, entidade_id, versao, operacao, payload],
    )?;
    Ok(())
}

/// Lista mudanças pendentes de envio.
pub fn pendentes(conexao: &Connection, limite: i64) -> AppResult<Vec<Mudanca>> {
    let mut declaracao = conexao.prepare(
        "SELECT id, instalacao_origem, entidade, entidade_id, versao, operacao,
                payload_json, processado, criado_em
         FROM outbox WHERE processado = 0 ORDER BY criado_em, id LIMIT ?1",
    )?;
    let linhas = declaracao.query_map(params![limite], |linha| {
        Ok(Mudanca {
            id: linha.get(0)?,
            instalacao_origem: linha.get(1)?,
            entidade: linha.get(2)?,
            entidade_id: linha.get(3)?,
            versao: linha.get(4)?,
            operacao: linha.get(5)?,
            payload_json: linha.get(6)?,
            processado: linha.get::<_, i64>(7)? != 0,
            criado_em: linha.get(8)?,
        })
    })?;
    linhas.collect::<Result<Vec<_>, _>>().map_err(Into::into)
}

pub fn marcar_processados(conexao: &Connection, ids: &[i64]) -> AppResult<()> {
    for id in ids {
        conexao.execute(
            "UPDATE outbox SET processado = 1 WHERE id = ?1",
            params![id],
        )?;
    }
    Ok(())
}

/// Aplica o payload de uma mudança remota nas tabelas suportadas.
fn aplicar_payload(conexao: &Connection, entidade: &str, payload: &str) -> AppResult<()> {
    let valor: serde_json::Value = serde_json::from_str(payload)
        .map_err(|erro| AppError::Integracao(format!("payload inválido: {}", erro)))?;

    match entidade {
        "configuracoes" => {
            let chave = valor.get("chave").and_then(|v| v.as_str()).unwrap_or("");
            let texto = valor.get("valor").and_then(|v| v.as_str()).unwrap_or("");
            if chave.is_empty() {
                return Ok(());
            }
            conexao.execute(
                "INSERT INTO configuracoes (chave, valor) VALUES (?1, ?2)
                 ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor",
                params![chave, texto],
            )?;
        }
        "regras_roteamento" => {
            let nome = valor.get("nome").and_then(|v| v.as_str()).unwrap_or("Regra sincronizada");
            let prioridade = valor.get("prioridade").and_then(|v| v.as_i64()).unwrap_or(100);
            let condicoes = valor.get("condicoes").map(|v| v.to_string()).unwrap_or_else(|| "[]".into());
            let acao = valor.get("acao").map(|v| v.to_string()).unwrap_or_else(|| "{}".into());
            let ativa = valor.get("ativa").and_then(|v| v.as_bool()).unwrap_or(false);
            conexao.execute(
                "INSERT INTO regras_roteamento (id, nome, prioridade, condicoes_json, acao_json, ativa)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)
                 ON CONFLICT(id) DO UPDATE SET nome = excluded.nome, prioridade = excluded.prioridade,
                     condicoes_json = excluded.condicoes_json, acao_json = excluded.acao_json,
                     ativa = excluded.ativa",
                params![0i64, nome, prioridade, condicoes, acao, ativa],
            )?;
        }
        "cotas" => {
            let usuario_id = valor.get("usuario_id").and_then(|v| v.as_i64()).unwrap_or(0);
            let limite = valor.get("limite_paginas").and_then(|v| v.as_i64()).unwrap_or(0);
            if usuario_id == 0 {
                return Ok(());
            }
            conexao.execute(
                "INSERT INTO cotas (usuario_id, limite_paginas, consumido, periodo, inicio_periodo)
                 VALUES (?1, ?2, 0, 'mensal', date('now','start of month'))
                 ON CONFLICT(usuario_id) DO UPDATE SET limite_paginas = excluded.limite_paginas",
                params![usuario_id, limite],
            )?;
        }
        _ => {}
    }
    Ok(())
}

/// Aplica uma mudança remota com controle de versão e política de conflito (RF2-018).
pub fn aplicar_remota(conexao: &Connection, remota: &MudancaRemota) -> AppResult<ResultadoAplicacao> {
    let local: Option<(i64, String, String)> = conexao.query_row(
        "SELECT versao, origem, payload FROM versoes_entidade WHERE entidade = ?1 AND entidade_id = ?2",
        params![remota.entidade, remota.entidade_id],
        |linha| Ok((linha.get(0)?, linha.get(1)?, linha.get(2)?)),
    ).ok();

    let Some((versao_local, origem_local, payload_local)) = local else {
        aplicar_payload(conexao, &remota.entidade, &remota.payload_json)?;
        conexao.execute(
            "INSERT INTO versoes_entidade (entidade, entidade_id, versao, origem, payload)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![remota.entidade, remota.entidade_id, remota.versao, remota.instalacao_origem, remota.payload_json],
        )?;
        return Ok(ResultadoAplicacao::Aplicada);
    };

    // Idempotência: versão já aplicada (RF2-012/RNF2-012).
    if versao_local >= remota.versao {
        return Ok(ResultadoAplicacao::Ignorada);
    }

    let politica = config(conexao, "f2_sync_conflito_policy", "manual");
    let conflito = origem_local != remota.instalacao_origem;

    if conflito && politica == "manual" {
        conexao.execute(
            "INSERT OR IGNORE INTO conflitos_sincronizacao
                (entidade, entidade_id, versao_remota, versao_local_json, versao_remota_json)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                remota.entidade, remota.entidade_id, remota.versao,
                format!(r#"{{"versao":{},"origem":"{}","payload":{}}}"#, versao_local, origem_local, payload_local),
                format!(r#"{{"versao":{},"origem":"{}","payload":{}}}"#, remota.versao, remota.instalacao_origem, remota.payload_json),
            ],
        )?;
        return Ok(ResultadoAplicacao::Conflito);
    }

    if conflito && politica == "origem" && origem_local < remota.instalacao_origem {
        return Ok(ResultadoAplicacao::Ignorada);
    }

    aplicar_payload(conexao, &remota.entidade, &remota.payload_json)?;
    conexao.execute(
        "UPDATE versoes_entidade SET versao = ?3, origem = ?4, payload = ?5,
                                     atualizada_em = CURRENT_TIMESTAMP
         WHERE entidade = ?1 AND entidade_id = ?2",
        params![remota.entidade, remota.entidade_id, remota.versao, remota.instalacao_origem, remota.payload_json],
    )?;
    Ok(ResultadoAplicacao::Aplicada)
}

#[cfg(test)]
mod testes {
    use super::*;
    use crate::repositorio::migrations::aplicar_migrations;

    #[test]
    fn registra_e_aplica_com_idempotencia_e_conflito() {
        let conexao = Connection::open_in_memory().unwrap();
        aplicar_migrations(&conexao).unwrap();
        conexao.execute(
            "INSERT INTO usuarios (nome, login, perfil) VALUES ('Ana','ana','administrador')",
            [],
        ).unwrap();

        registrar(&conexao, "cotas", 1, "update", r#"{"usuario_id":1,"limite_paginas":3000}"#).unwrap();
        let pendentes = pendentes(&conexao, 10).unwrap();
        assert_eq!(pendentes.len(), 1);
        assert_eq!(pendentes[0].versao, 1);

        let remota = MudancaRemota {
            instalacao_origem: "filial-rj".into(), entidade: "cotas".into(), entidade_id: 1,
            versao: 2, operacao: "update".into(),
            payload_json: r#"{"usuario_id":1,"limite_paginas":2500}"#.into(),
            criado_em: "2026-11-19T11:00:00".into(),
        };
        // Política manual gera conflito (origens diferentes).
        assert_eq!(aplicar_remota(&conexao, &remota).unwrap(), ResultadoAplicacao::Conflito);
        let conflitos: i64 = conexao.query_row(
            "SELECT COUNT(*) FROM conflitos_sincronizacao", [], |linha| linha.get(0)
        ).unwrap();
        assert_eq!(conflitos, 1);

        // Reenviar a mesma versão não duplica o conflito (idempotência).
        assert_eq!(aplicar_remota(&conexao, &remota).unwrap(), ResultadoAplicacao::Conflito);
        let conflitos: i64 = conexao.query_row(
            "SELECT COUNT(*) FROM conflitos_sincronizacao", [], |linha| linha.get(0)
        ).unwrap();
        assert_eq!(conflitos, 1);

        // Com política 'recente', a mudança remota vence.
        conexao.execute(
            "UPDATE configuracoes SET valor = 'recente' WHERE chave = 'f2_sync_conflito_policy'",
            [],
        ).unwrap();
        assert_eq!(aplicar_remota(&conexao, &remota).unwrap(), ResultadoAplicacao::Aplicada);
    }
}
