use rusqlite::{params, Connection};

use crate::{
    erro::AppResult,
    modelos::{OrdemServico, PrevisaoItem, SaudeImpressora},
    servicos::servico_auditoria,
    util::datas::agora_iso,
};

use super::{
    modelo::{ModeloPreditivo, PrevisaoComponente},
    sinais,
};

fn classificacao_para_prioridade(classificacao: &str) -> &'static str {
    match classificacao {
        "critico" => "critica",
        "atencao" => "alta",
        _ => "media",
    }
}

/// Avalia a saúde de todas as impressoras usando o modelo informado (RF2-001/RF2-006).
pub fn avaliar_frota(conexao: &Connection, modelo: &dyn ModeloPreditivo) -> AppResult<Vec<SaudeImpressora>> {
    let impressoras: Vec<(i64, String, String)> = {
        let mut declaracao = conexao.prepare("SELECT id, nome, status FROM impressoras ORDER BY nome")?;
        let itens = declaracao
            .query_map([], |linha| Ok((linha.get(0)?, linha.get(1)?, linha.get(2)?)))?
            .collect::<Result<_, _>>()?;
        itens
    };

    let agora = agora_iso();
    let mut resultado = Vec::with_capacity(impressoras.len());
    for (id, nome, status) in impressoras {
        let sinais = sinais::coletar(conexao, id)?;
        let avaliacao = modelo.calcular_saude(&sinais)?;
        resultado.push(SaudeImpressora {
            impressora_id: id,
            nome,
            status,
            pontuacao: avaliacao.pontuacao,
            classificacao: avaliacao.classificacao,
            confianca: avaliacao.confianca,
            fatores: avaliacao.fatores,
            calculado_em: agora.clone(),
        });
    }
    Ok(resultado)
}

/// Recalcula e persiste saúde e previsões em uma transação (RF2-001/RF2-002).
pub fn recalcular(conexao: &mut Connection, modelo: &dyn ModeloPreditivo) -> AppResult<bool> {
    let avaliacoes = avaliar_frota(conexao, modelo)?;
    let transacao = conexao.transaction()?;

    for avaliacao in &avaliacoes {
        let fatores = serde_json::to_string(&avaliacao.fatores).unwrap_or_else(|_| "[]".into());
        transacao.execute(
            "INSERT INTO saude_dispositivo (impressora_id, pontuacao, classificacao, confianca, fatores_json)
             VALUES (?1, ?2, ?3, ?4, ?5)
             ON CONFLICT(impressora_id) DO UPDATE SET
                 pontuacao = excluded.pontuacao,
                 classificacao = excluded.classificacao,
                 confianca = excluded.confianca,
                 fatores_json = excluded.fatores_json,
                 calculado_em = CURRENT_TIMESTAMP
             WHERE saude_dispositivo.pontuacao <> excluded.pontuacao
                OR saude_dispositivo.classificacao <> excluded.classificacao",
            params![
                avaliacao.impressora_id,
                avaliacao.pontuacao,
                avaliacao.classificacao,
                avaliacao.confianca,
                fatores
            ],
        )?;

        let sinais = sinais::coletar(&transacao, avaliacao.impressora_id)?;
        let previsoes: Vec<PrevisaoComponente> = modelo.prever(&sinais)?;

        // Substitui as previsões não resolvidas desta impressora.
        transacao.execute(
            "DELETE FROM previsoes_falha WHERE impressora_id = ?1 AND resolvida = 0",
            params![avaliacao.impressora_id],
        )?;
        for previsao in previsoes {
            let fatores = serde_json::to_string(&previsao.fatores).unwrap_or_else(|_| "[]".into());
            transacao.execute(
                "INSERT INTO previsoes_falha
                    (impressora_id, componente, dias_previstos, probabilidade, confianca, fatores_json)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![
                    avaliacao.impressora_id,
                    previsao.componente,
                    previsao.dias_previstos,
                    previsao.probabilidade,
                    previsao.confianca,
                    fatores
                ],
            )?;
        }
    }

    let alterou = transacao.execute(
        "INSERT OR IGNORE INTO configuracoes (chave, valor) VALUES ('f2_ultima_avaliacao', datetime('now'))",
        [],
    )? > 0;
    transacao.commit()?;
    Ok(alterou)
}

/// Lista as previsões persistidas (RF2-002).
pub fn listar_previsoes(conexao: &Connection) -> AppResult<Vec<PrevisaoItem>> {
    let mut declaracao = conexao.prepare(
        "SELECT p.id, p.impressora_id, i.nome, p.componente, p.dias_previstos,
                p.probabilidade, p.confianca, p.fatores_json, p.resolvida
         FROM previsoes_falha p JOIN impressoras i ON i.id = p.impressora_id
         ORDER BY p.dias_previstos ASC, p.probabilidade DESC",
    )?;
    let linhas = declaracao.query_map([], |linha| {
        let fatores_json: String = linha.get(7)?;
        let fatores: Vec<String> = serde_json::from_str(&fatores_json).unwrap_or_default();
        let confianca: String = linha.get(6)?;
        let confianca = if confianca == "media" { "média".to_string() } else { confianca };
        Ok(PrevisaoItem {
            id: linha.get(0)?,
            impressora_id: linha.get(1)?,
            impressora: linha.get(2)?,
            componente: linha.get(3)?,
            dias_previstos: linha.get(4)?,
            probabilidade: linha.get(5)?,
            confianca,
            fatores,
            resolvida: linha.get::<_, i64>(8)? != 0,
        })
    })?;
    linhas.collect::<Result<Vec<_>, _>>().map_err(Into::into)
}

/// Cria uma ordem de serviço a partir de uma previsão (RF2-004).
#[allow(clippy::too_many_arguments)]
pub fn criar_ordem(
    conexao: &mut Connection,
    previsao_id: i64,
    titulo: String,
    prioridade: String,
    responsavel: Option<String>,
    data_prevista: Option<String>,
    custo_estimado: Option<f64>,
) -> AppResult<i64> {
    let (impressora_id, componente, classificacao): (i64, String, String) = conexao.query_row(
        "SELECT p.impressora_id, p.componente, COALESCE(s.classificacao, 'atencao')
         FROM previsoes_falha p
         LEFT JOIN saude_dispositivo s ON s.impressora_id = p.impressora_id
         WHERE p.id = ?1",
        params![previsao_id],
        |linha| Ok((linha.get(0)?, linha.get(1)?, linha.get(2)?)),
    )?;

    let titulo = if titulo.trim().is_empty() {
        format!("Manutenção preventiva — {}", componente)
    } else {
        titulo.trim().to_string()
    };
    let prioridade = if prioridade.is_empty() {
        classificacao_para_prioridade(&classificacao).to_string()
    } else {
        prioridade
    };

    let transacao = conexao.transaction()?;
    transacao.execute(
        "INSERT INTO ordens_servico (impressora_id, previsao_id, titulo, prioridade,
                                     responsavel, data_prevista, custo_estimado)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![impressora_id, previsao_id, titulo, prioridade, responsavel, data_prevista, custo_estimado],
    )?;
    let id = transacao.last_insert_rowid();
    transacao.execute(
        "UPDATE previsoes_falha SET resolvida = 1 WHERE id = ?1",
        params![previsao_id],
    )?;
    transacao.commit()?;

    servico_auditoria::registrar(
        conexao,
        "criar_ordem_servico",
        "ordem_servico",
        Some(id),
        Some(&titulo),
    )?;
    Ok(id)
}

/// Lista as ordens de serviço (RF2-005).
pub fn listar_ordens(conexao: &Connection) -> AppResult<Vec<OrdemServico>> {
    let mut declaracao = conexao.prepare(
        "SELECT o.id, o.impressora_id, i.nome, o.titulo, o.prioridade, o.status,
                o.responsavel, o.data_prevista, o.custo_estimado, o.criada_em
         FROM ordens_servico o JOIN impressoras i ON i.id = o.impressora_id
         ORDER BY o.criada_em DESC LIMIT 100",
    )?;
    let linhas = declaracao.query_map([], |linha| {
        Ok(OrdemServico {
            id: linha.get(0)?,
            impressora_id: linha.get(1)?,
            impressora: linha.get(2)?,
            titulo: linha.get(3)?,
            prioridade: linha.get(4)?,
            status: linha.get(5)?,
            responsavel: linha.get(6)?,
            data_prevista: linha.get(7)?,
            custo_estimado: linha.get(8)?,
            criada_em: linha.get(9)?,
        })
    })?;
    linhas.collect::<Result<Vec<_>, _>>().map_err(Into::into)
}

#[cfg(test)]
mod testes {
    use super::*;
    use crate::repositorio::migrations::aplicar_migrations;
    use crate::predicao::modelo::ModeloHeuristico;

    #[test]
    fn recalcular_e_listar_previsoes() {
        let mut conexao = Connection::open_in_memory().unwrap();
        aplicar_migrations(&conexao).unwrap();
        conexao.execute(
            "INSERT INTO impressoras (nome, status) VALUES ('HP Teste', 'pronta')",
            [],
        ).unwrap();
        conexao.execute(
            "INSERT INTO suprimentos (impressora_id, tipo, nivel) VALUES (1, 'toner_preto', 18)",
            [],
        ).unwrap();

        let modelo = ModeloHeuristico;
        assert!(recalcular(&mut conexao, &modelo).unwrap());

        let saude: Vec<SaudeImpressora> = avaliar_frota(&conexao, &modelo).unwrap();
        assert_eq!(saude.len(), 1);
        assert_eq!(saude[0].impressora_id, 1);
        assert!(!saude[0].fatores.is_empty());

        let previsoes = listar_previsoes(&conexao).unwrap();
        assert!(!previsoes.is_empty());
        assert!(previsoes.iter().any(|p| p.componente == "Tambor"));
    }
}
