use rusqlite::Connection;

use crate::erro::AppResult;

/// Aplica as configurações padrão de cada conexão SQLite.
pub fn configurar(conexao: &Connection) -> AppResult<()> {
    conexao.execute_batch(
        "PRAGMA journal_mode = WAL;
         PRAGMA synchronous = NORMAL;
         PRAGMA foreign_keys = ON;
         PRAGMA busy_timeout = 5000;",
    )?;
    Ok(())
}
