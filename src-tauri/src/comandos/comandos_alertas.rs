use std::sync::Arc;

use tauri::State;

use crate::{
    erro::{AppError, AppResult},
    estado::AppState,
    modelos::Alerta,
    servicos::servico_alertas,
};

#[tauri::command]
pub fn listar_alertas(
    state: State<'_, Arc<AppState>>,
    so_pendentes: Option<bool>,
) -> AppResult<Vec<Alerta>> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    servico_alertas::listar(&conexao, so_pendentes.unwrap_or(true))
}

#[tauri::command]
pub fn resolver_alerta(state: State<'_, Arc<AppState>>, id: i64) -> AppResult<()> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    servico_alertas::resolver(&conexao, id)?;
    crate::servicos::servico_auditoria::registrar(
        &conexao, "resolver_alerta", "alerta", Some(id), None,
    )?;
    Ok(())
}
