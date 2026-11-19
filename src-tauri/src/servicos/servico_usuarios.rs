use rusqlite::{params, Connection};

use crate::{
    erro::{AppError, AppResult},
    modelos::{Setor, UsuarioResumo},
    util::validacao::nao_vazio,
};

/// Lista usuários com consumo, cota e status calculados (RF-015 / RF-017 / RF-018).
pub fn listar(conexao: &Connection) -> AppResult<Vec<UsuarioResumo>> {
    let mut declaracao = conexao.prepare(
        "SELECT u.id, u.nome, u.email, COALESCE(s.nome, 'Não informado'), u.perfil,
                COALESCE(c.limite_paginas, 0),
                COALESCE(c.consumido,
                    (SELECT COALESCE(SUM(paginas), 0) FROM fila_impressao f
                     WHERE f.usuario_id = u.id AND f.status = 'concluido'))
         FROM usuarios u
         LEFT JOIN setores s ON s.id = u.setor_id
         LEFT JOIN cotas c ON c.usuario_id = u.id
         ORDER BY u.nome",
    )?;

    let linhas = declaracao.query_map([], |linha| {
        Ok((
            linha.get::<_, i64>(0)?,
            linha.get::<_, String>(1)?,
            linha.get::<_, Option<String>>(2)?,
            linha.get::<_, String>(3)?,
            linha.get::<_, String>(4)?,
            linha.get::<_, i64>(5)?,
            linha.get::<_, i64>(6)?,
        ))
    })?;

    let mut usuarios = Vec::new();
    for linha in linhas {
        let (id, nome, email, setor, perfil, limite, consumo) = linha?;
        let percentual = if limite > 0 {
            (consumo * 100 / limite) as i64
        } else {
            0
        };
        let status = if limite == 0 {
            "sem_cota"
        } else if percentual > 100 {
            "acima_cota"
        } else if percentual >= 90 {
            "atencao"
        } else {
            "dentro_cota"
        };
        usuarios.push(UsuarioResumo {
            id, nome, email, setor: Some(setor), perfil, consumo, limite, percentual,
            status: status.into(),
        });
    }
    Ok(usuarios)
}

/// Lista setores cadastrados.
pub fn listar_setores(conexao: &Connection) -> AppResult<Vec<Setor>> {
    let mut declaracao = conexao.prepare("SELECT id, nome FROM setores ORDER BY nome")?;
    let linhas = declaracao.query_map([], |linha| {
        Ok(Setor { id: linha.get(0)?, nome: linha.get(1)? })
    })?;
    linhas.collect::<Result<Vec<_>, _>>().map_err(Into::into)
}

/// Cadastra um usuário (RF-015).
pub fn adicionar(
    conexao: &Connection,
    nome: &str,
    login: &str,
    email: Option<&str>,
    setor: Option<&str>,
    perfil: &str,
) -> AppResult<i64> {
    nao_vazio(nome, "nome")?;
    nao_vazio(login, "login")?;
    if !matches!(perfil, "administrador" | "gestor" | "usuario") {
        return Err(AppError::Validacao("perfil inválido".into()));
    }
    conexao.execute(
        "INSERT INTO usuarios (nome, login, email, setor_id, perfil)
         VALUES (?1, ?2, ?3, (SELECT id FROM setores WHERE nome = ?4), ?5)",
        params![nome.trim(), login.trim(), email, setor, perfil],
    )?;
    Ok(conexao.last_insert_rowid())
}

/// Cria ou atualiza a cota de um usuário (RF-017).
pub fn salvar_cota(
    conexao: &Connection,
    usuario_id: i64,
    limite_paginas: i64,
    bloquear_excesso: bool,
) -> AppResult<()> {
    if limite_paginas < 0 {
        return Err(AppError::Validacao("limite não pode ser negativo".into()));
    }
    conexao.execute(
        "INSERT INTO cotas (usuario_id, limite_paginas, consumido, periodo, inicio_periodo, bloquear_excesso)
         VALUES (?1, ?2, 0, 'mensal', date('now', 'start of month'), ?3)
         ON CONFLICT(usuario_id) DO UPDATE SET
             limite_paginas = excluded.limite_paginas,
             bloquear_excesso = excluded.bloquear_excesso
         WHERE cotas.limite_paginas <> excluded.limite_paginas
            OR cotas.bloquear_excesso <> excluded.bloquear_excesso",
        params![usuario_id, limite_paginas, bloquear_excesso],
    )?;
    Ok(())
}

/// Cria alertas para cotas excedidas (RF-026).
pub fn verificar_cotas(conexao: &Connection) -> AppResult<usize> {
    let habilitado: String = conexao
        .query_row(
            "SELECT valor FROM configuracoes WHERE chave = 'alertas_cota'",
            [],
            |linha| linha.get(0),
        )
        .unwrap_or_else(|_| "true".to_string());
    if habilitado != "true" {
        return Ok(0);
    }

    let mut declaracao = conexao.prepare(
        "SELECT u.nome, c.consumido, c.limite_paginas FROM cotas c
         JOIN usuarios u ON u.id = c.usuario_id
         WHERE c.consumido > c.limite_paginas",
    )?;
    let excedidas: Vec<(String, i64, i64)> = declaracao
        .query_map([], |linha| {
            Ok((linha.get(0)?, linha.get(1)?, linha.get(2)?))
        })?
        .collect::<Result<_, _>>()?;
    drop(declaracao);

    let mut criados = 0;
    for (nome, consumido, limite) in excedidas {
        let titulo = format!("Cota excedida — {}", nome);
        let existente: i64 = conexao.query_row(
            "SELECT COUNT(*) FROM alertas WHERE titulo = ?1 AND resolvido = 0",
            params![titulo],
            |linha| linha.get(0),
        )?;
        if existente == 0 {
            conexao.execute(
                "INSERT INTO alertas (tipo, severidade, titulo, mensagem)
                 VALUES ('cota_excedida', 'aviso', ?1, ?2)",
                params![titulo, format!("Consumo: {} páginas. Limite: {} páginas.", consumido, limite)],
            )?;
            criados += 1;
        }
    }
    Ok(criados)
}
