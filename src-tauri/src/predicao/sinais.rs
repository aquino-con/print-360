use rusqlite::{params, Connection};

use crate::erro::AppResult;

/// Sinais brutos coletados do banco para alimentar o modelo preditivo.
#[derive(Debug, Clone, Default)]
pub struct Sinais {
    pub erros_7d: i64,
    pub erros_30d: i64,
    pub volume_30d: i64,
    pub nivel_suprimento_min: i64,
    pub nivel_papel: i64,
    pub desgaste_tambor: i64,
    pub idade_anos: i64,
    pub dias_desde_manutencao: i64,
    pub alertas_nao_resolvidos: i64,
    /// Quantidade de fontes efetivamente disponíveis (para cálculo de confiança).
    pub fontes_disponiveis: usize,
}

/// Coleta os sinais disponíveis para uma impressora.
pub fn coletar(conexao: &Connection, impressora_id: i64) -> AppResult<Sinais> {
    let mut sinais = Sinais {
        fontes_disponiveis: 1, // a própria impressora sempre está disponível
        ..Default::default()
    };

    sinais.erros_7d = conexao.query_row(
        "SELECT COUNT(*) FROM eventos_fila e
         JOIN fila_impressao f ON f.id = e.trabalho_id
         WHERE f.impressora_id = ?1 AND e.acao = 'erro'
           AND e.registro_em >= datetime('now', '-7 days')",
        params![impressora_id],
        |linha| linha.get(0),
    )?;

    sinais.erros_30d = conexao.query_row(
        "SELECT COUNT(*) FROM eventos_fila e
         JOIN fila_impressao f ON f.id = e.trabalho_id
         WHERE f.impressora_id = ?1 AND e.acao = 'erro'
           AND e.registro_em >= datetime('now', '-30 days')",
        params![impressora_id],
        |linha| linha.get(0),
    )?;

    let volume: Option<i64> = conexao
        .query_row(
            "SELECT SUM(paginas_preto + paginas_cor) FROM metricas_diarias
             WHERE impressora_id = ?1 AND data >= date('now', '-30 days')",
            params![impressora_id],
            |linha| linha.get(0),
        )
        .ok();
    if let Some(valor) = volume {
        sinais.volume_30d = valor;
        sinais.fontes_disponiveis += 1;
    }

    let suprimentos: Vec<(String, i64)> = {
        let mut declaracao = conexao.prepare(
            "SELECT tipo, nivel FROM suprimentos WHERE impressora_id = ?1",
        )?;
        let itens = declaracao
            .query_map(params![impressora_id], |linha| {
                Ok((linha.get(0)?, linha.get(1)?))
            })?
            .collect::<Result<Vec<_>, _>>()?;
        itens
    };
    if !suprimentos.is_empty() {
        sinais.fontes_disponiveis += 1;
        sinais.nivel_suprimento_min = suprimentos.iter().map(|(_, nivel)| *nivel).min().unwrap_or(100);
        sinais.nivel_papel = suprimentos
            .iter()
            .find(|(tipo, _)| tipo == "papel")
            .map(|(_, nivel)| *nivel)
            .unwrap_or(100);
        sinais.desgaste_tambor = suprimentos
            .iter()
            .find(|(tipo, _)| tipo == "tambor")
            .map(|(_, nivel)| 100 - nivel)
            .unwrap_or(0);
    }

    let idade: Option<i64> = conexao
        .query_row(
            "SELECT CAST((julianday('now') - julianday(criado_em)) / 365 AS INTEGER)
             FROM impressoras WHERE id = ?1",
            params![impressora_id],
            |linha| linha.get(0),
        )
        .ok();
    if let Some(valor) = idade {
        sinais.idade_anos = valor.max(0);
        sinais.fontes_disponiveis += 1;
    }

    sinais.dias_desde_manutencao = conexao
        .query_row(
            "SELECT COALESCE(CAST(julianday('now') - julianday(MAX(realizada_em)) AS INTEGER), 0)
             FROM manutencoes WHERE impressora_id = ?1",
            params![impressora_id],
            |linha| linha.get(0),
        )
        .unwrap_or(0);

    sinais.alertas_nao_resolvidos = conexao.query_row(
        "SELECT COUNT(*) FROM alertas WHERE resolvido = 0 AND impressora_id = ?1",
        params![impressora_id],
        |linha| linha.get(0),
    )?;

    Ok(sinais)
}
