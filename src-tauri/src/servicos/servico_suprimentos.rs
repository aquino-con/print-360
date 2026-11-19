use std::collections::HashMap;

use rusqlite::{params, Connection};

use crate::{
    erro::AppResult,
    modelos::{GrupoSuprimento, Suprimento},
};

const VIDA_UTIL_PAGINAS: f64 = 3000.0;

fn rotulo(tipo: &str) -> &'static str {
    match tipo {
        "toner_preto" => "Toner preto",
        "toner_ciano" => "Toner ciano",
        "toner_magenta" => "Toner magenta",
        "toner_amarelo" => "Toner amarelo",
        "tambor" => "Tambor",
        "papel" => "Papel",
        "grampo" => "Grampos",
        _ => "Suprimento",
    }
}

fn previsao_dias(conexao: &Connection, impressora_id: i64, nivel: i64) -> AppResult<Option<i64>> {
    let medio: f64 = conexao.query_row(
        "SELECT COALESCE(AVG(paginas_preto + paginas_cor), 0)
         FROM metricas_diarias
         WHERE impressora_id = ?1 AND data >= date('now', '-30 days')",
        params![impressora_id],
        |linha| linha.get(0),
    )?;

    if medio <= 0.0 {
        return Ok(None);
    }
    Ok(Some(((nivel as f64 / 100.0 * VIDA_UTIL_PAGINAS) / medio).round() as i64))
}

/// Lista suprimentos agrupados por impressora, com previsão de esgotamento (RF-011).
pub fn listar_grupos(conexao: &Connection) -> AppResult<Vec<GrupoSuprimento>> {
    let mut declaracao = conexao.prepare(
        "SELECT i.id, i.nome, i.status, s.id, s.tipo, s.nivel, s.capacidade, s.ultima_troca
         FROM impressoras i
         LEFT JOIN suprimentos s ON s.impressora_id = i.id
         ORDER BY i.nome, s.tipo",
    )?;

    let linhas = declaracao.query_map([], |linha| {
        Ok((
            linha.get::<_, i64>(0)?,
            linha.get::<_, String>(1)?,
            linha.get::<_, String>(2)?,
            linha.get::<_, Option<i64>>(3)?,
            linha.get::<_, Option<String>>(4)?,
            linha.get::<_, Option<i64>>(5)?,
            linha.get::<_, Option<i64>>(6)?,
            linha.get::<_, Option<String>>(7)?,
        ))
    })?;

    let mut grupos: Vec<GrupoSuprimento> = Vec::new();
    let mut indice: HashMap<i64, usize> = HashMap::new();

    for linha in linhas {
        let (id, nome, status, item_id, tipo, nivel, capacidade, troca) = linha?;
        let posicao = *indice.entry(id).or_insert_with(|| {
            grupos.push(GrupoSuprimento {
                impressora_id: id,
                impressora: nome.clone(),
                status: status.clone(),
                itens: Vec::new(),
            });
            grupos.len() - 1
        });

        if let (Some(item_id), Some(tipo)) = (item_id, tipo) {
            let nivel = nivel.unwrap_or(0);
            grupos[posicao].itens.push(Suprimento {
                id: item_id,
                impressora_id: id,
                impressora: nome.clone(),
                tipo: tipo.clone(),
                tipo_rotulo: rotulo(&tipo).to_string(),
                nivel,
                capacidade,
                previsao_dias: previsao_dias(conexao, id, nivel)?,
                ultima_troca: troca,
            });
        }
    }

    Ok(grupos)
}

/// Registra a troca de um suprimento e zera o nível para 100% (RF-013).
pub fn registrar_troca(
    conexao: &mut Connection,
    impressora_id: i64,
    tipo: &str,
    responsavel: &str,
) -> AppResult<()> {
    let transacao = conexao.transaction()?;
    transacao.execute(
        "UPDATE suprimentos SET nivel = 100, ultima_troca = CURRENT_TIMESTAMP,
                                atualizado_em = CURRENT_TIMESTAMP
         WHERE impressora_id = ?1 AND tipo = ?2",
        params![impressora_id, tipo],
    )?;
    transacao.execute(
        "INSERT INTO manutencoes (impressora_id, tipo, descricao, responsavel)
         VALUES (?1, 'troca_suprimento', ?2, ?3)",
        params![impressora_id, rotulo(tipo), responsavel],
    )?;
    transacao.execute(
        "UPDATE alertas SET resolvido = 1, resolvido_em = CURRENT_TIMESTAMP
         WHERE tipo = 'suprimento_baixo' AND resolvido = 0 AND titulo LIKE ?1",
        params![format!("%{}%", rotulo(tipo))],
    )?;
    transacao.commit()?;
    Ok(())
}

/// Cria ou resolve alertas de nível baixo conforme o limite configurado (RF-012).
pub fn verificar_niveis(conexao: &Connection) -> AppResult<usize> {
    let limite: i64 = conexao
        .query_row(
            "SELECT CAST(valor AS INTEGER) FROM configuracoes WHERE chave = 'limite_nivel_baixo'",
            [],
            |linha| linha.get(0),
        )
        .unwrap_or(20);
    let habilitado: String = conexao
        .query_row(
            "SELECT valor FROM configuracoes WHERE chave = 'alertas_suprimento'",
            [],
            |linha| linha.get(0),
        )
        .unwrap_or_else(|_| "true".to_string());
    if habilitado != "true" {
        return Ok(0);
    }

    let mut declaracao = conexao.prepare(
        "SELECT s.nivel, s.tipo, i.nome FROM suprimentos s
         JOIN impressoras i ON i.id = s.impressora_id",
    )?;
    let itens: Vec<(i64, String, String)> = declaracao
        .query_map([], |linha| {
            Ok((linha.get(0)?, linha.get(1)?, linha.get(2)?))
        })?
        .collect::<Result<_, _>>()?;
    drop(declaracao);

    let mut criados = 0;
    for (nivel, tipo, impressora) in itens {
        let titulo = format!("Nível baixo — {} ({})", rotulo(&tipo), impressora);
        let existente: i64 = conexao.query_row(
            "SELECT COUNT(*) FROM alertas WHERE titulo = ?1 AND resolvido = 0",
            params![titulo],
            |linha| linha.get(0),
        )?;

        if nivel < limite && existente == 0 {
            let severidade = if nivel < 10 { "critico" } else { "aviso" };
            conexao.execute(
                "INSERT INTO alertas (tipo, severidade, titulo, mensagem)
                 VALUES ('suprimento_baixo', ?1, ?2, ?3)",
                params![
                    severidade,
                    titulo,
                    format!("Nível atual: {}%. Limite configurado: {}%.", nivel, limite)
                ],
            )?;
            criados += 1;
        } else if nivel >= limite && existente > 0 {
            conexao.execute(
                "UPDATE alertas SET resolvido = 1, resolvido_em = CURRENT_TIMESTAMP
                 WHERE titulo = ?1 AND resolvido = 0",
                params![titulo],
            )?;
        }
    }
    Ok(criados)
}

#[cfg(test)]
mod testes {
    use super::*;
    use crate::repositorio::migrations::aplicar_migrations;

    #[test]
    fn cria_e_resolve_alerta_de_nivel_baixo() {
        let conexao = Connection::open_in_memory().unwrap();
        aplicar_migrations(&conexao).unwrap();
        conexao.execute(
            "INSERT INTO impressoras (nome, status) VALUES ('Epson Teste', 'pronta')",
            [],
        ).unwrap();
        conexao.execute(
            "INSERT INTO suprimentos (impressora_id, tipo, nivel) VALUES (1, 'toner_preto', 10)",
            [],
        ).unwrap();

        assert_eq!(verificar_niveis(&conexao).unwrap(), 1);

        conexao.execute("UPDATE suprimentos SET nivel = 100", []).unwrap();
        verificar_niveis(&conexao).unwrap();

        let pendentes: i64 = conexao.query_row(
            "SELECT COUNT(*) FROM alertas WHERE tipo = 'suprimento_baixo' AND resolvido = 0",
            [],
            |linha| linha.get(0),
        ).unwrap();
        assert_eq!(pendentes, 0);
    }
}
