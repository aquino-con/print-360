use std::collections::HashSet;

use rusqlite::Connection;

use crate::erro::AppResult;

use super::conexao::configurar;

/// Aplica, em ordem e dentro de transação, apenas as migrations ainda não registradas.
pub fn aplicar_migrations(conexao: &Connection) -> AppResult<()> {
    configurar(conexao)?;

    conexao.execute_batch(
        "CREATE TABLE IF NOT EXISTS schema_migrations (
             versao      TEXT PRIMARY KEY,
             aplicada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
         );",
    )?;

    let mut aplicadas = HashSet::new();
    {
        let mut stmt = conexao.prepare("SELECT versao FROM schema_migrations")?;
        let linhas = stmt.query_map([], |linha| linha.get::<_, String>(0))?;
        for linha in linhas {
            aplicadas.insert(linha?);
        }
    }

    const MIGRATIONS: [(&str, &str); 6] = [
        ("0001_inicial", include_str!("../../migrations/0001_inicial.sql")),
        (
            "0002_integracao_spooler",
            include_str!("../../migrations/0002_integracao_spooler.sql"),
        ),
        (
            "0003_suprimentos_custos",
            include_str!("../../migrations/0003_suprimentos_custos.sql"),
        ),
        ("0004_predicao", include_str!("../../migrations/0004_predicao.sql")),
        ("0005_roteamento", include_str!("../../migrations/0005_roteamento.sql")),
        ("0006_sincronizacao", include_str!("../../migrations/0006_sincronizacao.sql")),
    ];

    for (versao, sql) in MIGRATIONS {
        if aplicadas.contains(versao) {
            continue;
        }
        let transacao = conexao.unchecked_transaction()?;
        transacao.execute_batch(sql)?;
        transacao.execute(
            "INSERT INTO schema_migrations (versao) VALUES (?1)",
            [versao],
        )?;
        transacao.commit()?;
    }

    Ok(())
}

#[cfg(test)]
mod testes {
    use super::*;

    #[test]
    fn aplica_migration_em_banco_vazio() {
        let conexao = Connection::open_in_memory().unwrap();
        aplicar_migrations(&conexao).unwrap();

        let total: i64 = conexao
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
                [],
                |linha| linha.get(0),
            )
            .unwrap();
        assert!(total >= 13, "esperava ao menos 13 tabelas, encontrei {}", total);

        let versoes: i64 = conexao
            .query_row("SELECT COUNT(*) FROM schema_migrations", [], |linha| linha.get(0))
            .unwrap();
        assert_eq!(versoes, 6);
    }

    #[test]
    fn migration_e_idempotente() {
        let conexao = Connection::open_in_memory().unwrap();
        aplicar_migrations(&conexao).unwrap();
        aplicar_migrations(&conexao).unwrap();

        let total: i64 = conexao
            .query_row("SELECT COUNT(*) FROM schema_migrations", [], |linha| linha.get(0))
            .unwrap();
        assert_eq!(total, 6);
    }
}
