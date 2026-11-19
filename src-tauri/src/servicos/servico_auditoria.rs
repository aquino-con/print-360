use rusqlite::params;

use crate::{
    erro::AppResult,
    modelos::RegistroAuditoria,
};

/// Registra uma ação administrativa (RF-031).
pub fn registrar(
    conexao: &rusqlite::Connection,
    acao: &str,
    entidade: &str,
    entidade_id: Option<i64>,
    detalhe: Option<&str>,
) -> AppResult<()> {
    conexao.execute(
        "INSERT INTO auditoria (usuario_id, acao, entidade, entidade_id, detalhe)
         VALUES ((SELECT id FROM usuarios WHERE perfil = 'administrador' AND ativo = 1 LIMIT 1),
                 ?1, ?2, ?3, ?4)",
        params![acao, entidade, entidade_id, detalhe],
    )?;
    Ok(())
}

/// Lista os últimos registros de auditoria.
pub fn listar(conexao: &rusqlite::Connection, limite: i64) -> AppResult<Vec<RegistroAuditoria>> {
    let mut declaracao = conexao.prepare(
        "SELECT a.id, COALESCE(u.nome, 'Sistema'), a.acao, a.entidade, a.entidade_id,
                a.detalhe, a.registro_em
         FROM auditoria a LEFT JOIN usuarios u ON u.id = a.usuario_id
         ORDER BY a.registro_em DESC, a.id DESC
         LIMIT ?1",
    )?;
    let linhas = declaracao.query_map(params![limite], |linha| {
        Ok(RegistroAuditoria {
            id: linha.get(0)?,
            usuario: linha.get(1)?,
            acao: linha.get(2)?,
            entidade: linha.get(3)?,
            entidade_id: linha.get(4)?,
            detalhe: linha.get(5)?,
            registro_em: linha.get(6)?,
        })
    })?;
    linhas.collect::<Result<Vec<_>, _>>().map_err(Into::into)
}

#[cfg(test)]
mod testes {
    use super::*;
    use crate::repositorio::migrations::aplicar_migrations;
    use rusqlite::Connection;

    #[test]
    fn registra_e_lista_auditoria() {
        let conexao = Connection::open_in_memory().unwrap();
        aplicar_migrations(&conexao).unwrap();
        conexao.execute(
            "INSERT INTO usuarios (nome, login, perfil) VALUES ('Admin', 'admin', 'administrador')",
            [],
        ).unwrap();

        registrar(&conexao, "cadastrar_impressora", "impressora", Some(7), Some("HP Teste")).unwrap();
        let registros = listar(&conexao, 10).unwrap();

        assert_eq!(registros.len(), 1);
        assert_eq!(registros[0].acao, "cadastrar_impressora");
        assert_eq!(registros[0].usuario, "Admin");
        assert_eq!(registros[0].entidade_id, Some(7));
    }
}
