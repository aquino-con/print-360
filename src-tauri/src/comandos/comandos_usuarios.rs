use std::sync::Arc;

use tauri::State;

use crate::{
    erro::{AppError, AppResult},
    estado::AppState,
    modelos::{Setor, UsuarioResumo},
    servicos::servico_usuarios,
};

#[tauri::command]
pub fn listar_usuarios(state: State<'_, Arc<AppState>>) -> AppResult<Vec<UsuarioResumo>> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    servico_usuarios::listar(&conexao)
}

#[tauri::command]
pub fn listar_setores(state: State<'_, Arc<AppState>>) -> AppResult<Vec<Setor>> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    servico_usuarios::listar_setores(&conexao)
}

#[tauri::command]
pub fn adicionar_usuario(
    state: State<'_, Arc<AppState>>,
    nome: String,
    login: String,
    email: Option<String>,
    setor: Option<String>,
    perfil: String,
) -> AppResult<i64> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    let id = servico_usuarios::adicionar(
        &conexao,
        &nome,
        &login,
        email.as_deref(),
        setor.as_deref(),
        &perfil,
    )?;
    crate::servicos::servico_auditoria::registrar(
        &conexao, "cadastrar_usuario", "usuario", Some(id), Some(&nome),
    )?;
    Ok(id)
}

#[tauri::command]
pub fn salvar_cota(
    state: State<'_, Arc<AppState>>,
    usuario_id: i64,
    limite_paginas: i64,
    bloquear_excesso: bool,
) -> AppResult<()> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    servico_usuarios::salvar_cota(&conexao, usuario_id, limite_paginas, bloquear_excesso)?;
    let payload = serde_json::json!({
        "usuario_id": usuario_id,
        "limite_paginas": limite_paginas,
        "bloquear_excesso": bloquear_excesso,
    }).to_string();
    crate::sincronizacao::outbox::registrar(
        &conexao, "cotas", usuario_id, "update", &payload,
    )?;
    crate::servicos::servico_auditoria::registrar(
        &conexao,
        "alterar_cota",
        "usuario",
        Some(usuario_id),
        Some(&format!("Limite: {}", limite_paginas)),
    )?;
    Ok(())
}
