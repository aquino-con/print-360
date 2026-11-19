use rusqlite::{params, Connection};

use crate::{erro::AppResult, modelos::Alerta};

/// Lista alertas da central (RF-024).
pub fn listar(conexao: &Connection, so_pendentes: bool) -> AppResult<Vec<Alerta>> {
    let sql = if so_pendentes {
        "SELECT a.id, a.tipo, a.severidade, a.titulo, a.mensagem, i.nome, a.resolvido, a.criado_em
         FROM alertas a LEFT JOIN impressoras i ON i.id = a.impressora_id
         WHERE a.resolvido = 0 ORDER BY
             CASE a.severidade WHEN 'critico' THEN 0 WHEN 'aviso' THEN 1 ELSE 2 END,
             a.criado_em DESC"
    } else {
        "SELECT a.id, a.tipo, a.severidade, a.titulo, a.mensagem, i.nome, a.resolvido, a.criado_em
         FROM alertas a LEFT JOIN impressoras i ON i.id = a.impressora_id
         ORDER BY a.criado_em DESC LIMIT 100"
    };

    let mut declaracao = conexao.prepare(sql)?;
    let linhas = declaracao.query_map([], |linha| {
        Ok(Alerta {
            id: linha.get(0)?,
            tipo: linha.get(1)?,
            severidade: linha.get(2)?,
            titulo: linha.get(3)?,
            mensagem: linha.get(4)?,
            impressora: linha.get(5)?,
            resolvido: linha.get::<_, i64>(6)? != 0,
            criado_em: linha.get(7)?,
        })
    })?;
    linhas.collect::<Result<Vec<_>, _>>().map_err(Into::into)
}

/// Marca um alerta como resolvido.
pub fn resolver(conexao: &Connection, id: i64) -> AppResult<()> {
    conexao.execute(
        "UPDATE alertas SET resolvido = 1, resolvido_em = CURRENT_TIMESTAMP WHERE id = ?1",
        params![id],
    )?;
    Ok(())
}

/// Alertas críticos pendentes, usados pelo coletor para notificações nativas.
pub fn listar_criticos_pendentes(conexao: &Connection) -> AppResult<Vec<(i64, String)>> {
    let mut declaracao = conexao.prepare(
        "SELECT id, titulo FROM alertas WHERE resolvido = 0 AND severidade = 'critico'",
    )?;
    let linhas = declaracao.query_map([], |linha| {
        Ok((linha.get::<_, i64>(0)?, linha.get::<_, String>(1)?))
    })?;
    linhas.collect::<Result<Vec<_>, _>>().map_err(Into::into)
}
