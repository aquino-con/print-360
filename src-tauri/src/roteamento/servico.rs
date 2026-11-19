use rusqlite::{params, Connection};

use crate::{
    erro::{AppError, AppResult},
    modelos::{ExecucaoRoteamento, Simulacao},
    servicos::servico_auditoria,
};

use super::{
    motor,
    regra::{Acao, Candidato, Condicao, Contexto, Decisao, Regra},
};

fn parse_json<T: serde::de::DeserializeOwned>(valor: &str, campo: &str) -> AppResult<T> {
    serde_json::from_str(valor)
        .map_err(|erro| AppError::Validacao(format!("{} inválido: {}", campo, erro)))
}

/// Lista regras ordenadas por prioridade (RF2-009).
pub fn listar_regras(conexao: &Connection) -> AppResult<Vec<Regra>> {
    let mut declaracao = conexao.prepare(
        "SELECT id, nome, prioridade, condicoes_json, acao_json, ativa, criada_em
         FROM regras_roteamento ORDER BY prioridade, id",
    )?;
    let linhas = declaracao.query_map([], |linha| {
        let condicoes_json: String = linha.get(3)?;
        let acao_json: String = linha.get(4)?;
        Ok((
            linha.get::<_, i64>(0)?,
            linha.get::<_, String>(1)?,
            linha.get::<_, i64>(2)?,
            condicoes_json,
            acao_json,
            linha.get::<_, i64>(5)?,
            linha.get::<_, String>(6)?,
        ))
    })?;

    let mut regras = Vec::new();
    for linha in linhas {
        let (id, nome, prioridade, condicoes_json, acao_json, ativa, criada_em) = linha?;
        regras.push(Regra {
            id,
            nome,
            prioridade,
            condicoes: parse_json(&condicoes_json, "condições")?,
            acao: parse_json(&acao_json, "ação")?,
            ativa: ativa != 0,
            criada_em,
        });
    }
    Ok(regras)
}

/// Cria ou atualiza uma regra, validando o JSON de condições e ação.
pub fn salvar_regra(
    conexao: &Connection,
    id: Option<i64>,
    nome: &str,
    prioridade: i64,
    condicoes: &[Condicao],
    acao: &Acao,
    ativa: bool,
) -> AppResult<i64> {
    if nome.trim().is_empty() {
        return Err(AppError::Validacao("nome da regra é obrigatório".into()));
    }
    let condicoes_json = serde_json::to_string(condicoes).map_err(|e| AppError::Validacao(e.to_string()))?;
    let acao_json = serde_json::to_string(acao).map_err(|e| AppError::Validacao(e.to_string()))?;

    let regra_id = match id {
        Some(id) => {
            conexao.execute(
                "UPDATE regras_roteamento SET nome = ?2, prioridade = ?3, condicoes_json = ?4,
                                             acao_json = ?5, ativa = ?6 WHERE id = ?1",
                params![id, nome.trim(), prioridade, condicoes_json, acao_json, ativa],
            )?;
            id
        }
        None => {
            conexao.execute(
                "INSERT INTO regras_roteamento (nome, prioridade, condicoes_json, acao_json, ativa)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
                params![nome.trim(), prioridade, condicoes_json, acao_json, ativa],
            )?;
            conexao.last_insert_rowid()
        }
    };

    servico_auditoria::registrar(
        conexao,
        if id.is_some() { "alterar_regra" } else { "cadastrar_regra" },
        "regra_roteamento",
        Some(regra_id),
        Some(nome.trim()),
    )?;

    let payload = serde_json::json!({
        "id": regra_id,
        "nome": nome.trim(),
        "prioridade": prioridade,
        "condicoes": condicoes,
        "acao": acao,
        "ativa": ativa,
    }).to_string();
    crate::sincronizacao::outbox::registrar(
        conexao,
        "regras_roteamento",
        regra_id,
        if id.is_some() { "update" } else { "insert" },
        &payload,
    )?;
    Ok(regra_id)
}

pub fn alternar_regra(conexao: &Connection, id: i64) -> AppResult<()> {
    conexao.execute(
        "UPDATE regras_roteamento SET ativa = CASE ativa WHEN 1 THEN 0 ELSE 1 END WHERE id = ?1",
        params![id],
    )?;
    Ok(())
}

pub fn excluir_regra(conexao: &Connection, id: i64) -> AppResult<()> {
    conexao.execute("DELETE FROM regras_roteamento WHERE id = ?1", params![id])?;
    servico_auditoria::registrar(conexao, "excluir_regra", "regra_roteamento", Some(id), None)?;
    Ok(())
}

/// Monta a lista de impressoras candidatas com carga, custo e suprimento (RF2-008).
pub fn candidatos(conexao: &Connection) -> AppResult<Vec<Candidato>> {
    let mut declaracao = conexao.prepare(
        "SELECT i.nome, s.nome, i.status,
                (SELECT COUNT(*) FROM fila_impressao f
                 WHERE f.impressora_id = i.id AND f.status IN ('pendente','processando')) AS carga,
                COALESCE((SELECT custo_pagina_preto FROM parametros_custo WHERE id = 1), 0.25),
                COALESCE((SELECT MIN(nivel) FROM suprimentos WHERE impressora_id = i.id), 100)
         FROM impressoras i LEFT JOIN setores s ON s.id = i.setor_id
         ORDER BY i.nome",
    )?;
    let linhas = declaracao.query_map([], |linha| {
        Ok(Candidato {
            nome: linha.get(0)?,
            setor: linha.get(1)?,
            status: linha.get(2)?,
            carga: linha.get(3)?,
            custo_pagina: linha.get(4)?,
            nivel_suprimento: linha.get(5)?,
        })
    })?;
    linhas.collect::<Result<Vec<_>, _>>().map_err(Into::into)
}

/// Simula o roteamento sem registrar nada (RF2-010).
pub fn simular(conexao: &Connection, contexto: &Contexto) -> AppResult<Simulacao> {
    let regras = listar_regras(conexao)?;
    let candidatos = candidatos(conexao)?;
    let decisao = motor::selecionar(&regras, &candidatos, contexto)?;
    Ok(Simulacao {
        documento: contexto.documento.clone(),
        destino: decisao.impressora,
        regra_aplicada: decisao.regra_nome,
        justificativa: decisao.justificativa,
        criterio: decisao.criterio,
        candidatos_avaliados: decisao.candidatos_avaliados,
        fallback_usado: decisao.fallback_usado,
    })
}

/// Registra a justificativa de uma decisão real (RF2-011).
pub fn registrar_decisao(
    conexao: &Connection,
    trabalho_id: i64,
    decisao: &Decisao,
) -> AppResult<()> {
    let impressora_id: i64 = conexao.query_row(
        "SELECT id FROM impressoras WHERE nome = ?1",
        params![decisao.impressora],
        |linha| linha.get(0),
    )?;
    let justificativa = serde_json::to_string(&decisao.justificativa)
        .unwrap_or_else(|_| "[]".to_string());
    conexao.execute(
        "INSERT INTO execucoes_roteamento (trabalho_id, regra_id, impressora_destino, justificativa_json)
         VALUES (?1, ?2, ?3, ?4)",
        params![trabalho_id, decisao.regra_id, impressora_id, justificativa],
    )?;
    Ok(())
}

/// Lista decisões recentes para a tela.
pub fn listar_execucoes(conexao: &Connection) -> AppResult<Vec<ExecucaoRoteamento>> {
    let mut declaracao = conexao.prepare(
        "SELECT e.id, e.trabalho_id, e.regra_id, r.nome, i.nome, e.justificativa_json, e.decidido_em
         FROM execucoes_roteamento e
         LEFT JOIN regras_roteamento r ON r.id = e.regra_id
         JOIN impressoras i ON i.id = e.impressora_destino
         ORDER BY e.decidido_em DESC LIMIT 50",
    )?;
    let linhas = declaracao.query_map([], |linha| {
        let json: String = linha.get(5)?;
        let justificativa: Vec<String> = serde_json::from_str(&json).unwrap_or_default();
        Ok(ExecucaoRoteamento {
            id: linha.get(0)?,
            trabalho_id: linha.get(1)?,
            regra_id: linha.get(2)?,
            regra_nome: linha.get(3)?,
            impressora: linha.get(4)?,
            justificativa,
            decidido_em: linha.get(6)?,
        })
    })?;
    linhas.collect::<Result<Vec<_>, _>>().map_err(Into::into)
}

/// Registra decisões para trabalhos novos quando a feature flag está ativa (RF2-011).
///
/// A decisão é auditável; a aplicação no spooler depende do adaptador de envio,
/// evoluído em marco posterior. A impressora de destino no banco não é alterada.
pub fn aplicar_a_novos_trabalhos(conexao: &Connection) -> AppResult<usize> {
    let ativo: String = conexao
        .query_row(
            "SELECT valor FROM configuracoes WHERE chave = 'f2_roteamento_ativo'",
            [],
            |linha| linha.get(0),
        )
        .unwrap_or_else(|_| "false".to_string());
    if ativo != "true" {
        return Ok(0);
    }

    let regras = listar_regras(conexao)?;
    let candidatos = candidatos(conexao)?;
    if candidatos.is_empty() {
        return Ok(0);
    }

    let mut declaracao = conexao.prepare(
        "SELECT f.id, f.documento, f.paginas, f.colorida, f.tamanho_bytes,
                COALESCE(s.nome, '')
         FROM fila_impressao f
         LEFT JOIN usuarios u ON u.id = f.usuario_id
         LEFT JOIN setores s ON s.id = u.setor_id
         WHERE f.status = 'pendente'
           AND NOT EXISTS (SELECT 1 FROM execucoes_roteamento e WHERE e.trabalho_id = f.id)",
    )?;
    let trabalhos: Vec<(i64, String, i64, i64, Option<i64>, String)> = declaracao
        .query_map([], |linha| {
            Ok((linha.get(0)?, linha.get(1)?, linha.get(2)?, linha.get(3)?, linha.get(4)?, linha.get(5)?))
        })?
        .collect::<Result<_, _>>()?;
    drop(declaracao);

    let mut registrados = 0;
    for (id, documento, paginas, colorida, tamanho, setor) in trabalhos {
        let contexto = Contexto {
            documento,
            setor: if setor.is_empty() { None } else { Some(setor) },
            paginas,
            cor: if colorida != 0 { "cor".into() } else { "pb".into() },
            urgencia: "normal".into(),
            tamanho_bytes: tamanho,
        };
        if let Ok(decisao) = motor::selecionar(&regras, &candidatos, &contexto) {
            registrar_decisao(conexao, id, &decisao)?;
            registrados += 1;
        }
    }
    Ok(registrados)
}

#[cfg(test)]
mod testes {
    use super::*;
    use crate::repositorio::migrations::aplicar_migrations;

    #[test]
    fn salvar_listar_e_simular() {
        let conexao = Connection::open_in_memory().unwrap();
        aplicar_migrations(&conexao).unwrap();
        conexao.execute(
            "INSERT INTO impressoras (nome, status) VALUES ('HP M404', 'pronta')",
            [],
        ).unwrap();

        let condicoes = vec![Condicao {
            campo: "setor".into(), operador: "igual".into(), valor: "Financeiro".into(),
        }];
        let acao = Acao {
            impressora: Some("HP M404".into()), grupo: vec![], criterio: "disponibilidade".into(), fallback: None,
        };
        let id = salvar_regra(&conexao, None, "Regra Financeiro", 1, &condicoes, &acao, true).unwrap();
        assert!(id > 0);

        let regras = listar_regras(&conexao).unwrap();
        assert_eq!(regras.len(), 1);
        assert_eq!(regras[0].condicoes.len(), 1);

        let contexto = Contexto {
            setor: Some("Financeiro".into()), documento: "relatorio.pdf".into(), ..Default::default()
        };
        let simulacao = simular(&conexao, &contexto).unwrap();
        assert_eq!(simulacao.destino, "HP M404");
        assert_eq!(simulacao.regra_aplicada.as_deref(), Some("Regra Financeiro"));

        alternar_regra(&conexao, id).unwrap();
        assert!(!listar_regras(&conexao).unwrap()[0].ativa);
    }
}
