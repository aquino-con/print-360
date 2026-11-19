use rusqlite::Connection;

use crate::{erro::AppResult, modelos::ResumoDashboard};

/// Agrega os indicadores exibidos no dashboard (RF-023).
pub fn obter_resumo(conexao: &Connection) -> AppResult<ResumoDashboard> {
    let paginas_hoje: i64 = conexao.query_row(
        "SELECT COALESCE(SUM(paginas), 0) FROM fila_impressao
         WHERE date(criado_em) = date('now') AND status = 'concluido'",
        [],
        |linha| linha.get(0),
    )?;

    let custo_mes: f64 = conexao.query_row(
        "SELECT COALESCE(SUM(custo_estimado), 0) FROM fila_impressao
         WHERE strftime('%Y-%m', criado_em) = strftime('%Y-%m', 'now')",
        [],
        |linha| linha.get(0),
    )?;

    let impressoras_ativas: i64 = conexao.query_row(
        "SELECT COUNT(*) FROM impressoras WHERE status IN ('pronta', 'ocupada')",
        [],
        |linha| linha.get(0),
    )?;

    let alertas_pendentes: i64 = conexao.query_row(
        "SELECT COUNT(*) FROM alertas WHERE resolvido = 0",
        [],
        |linha| linha.get(0),
    )?;

    Ok(ResumoDashboard {
        paginas_hoje,
        custo_mes,
        impressoras_ativas,
        alertas_pendentes,
    })
}
