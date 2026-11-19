use std::sync::Arc;

use tauri::State;

use crate::{
    erro::{AppError, AppResult},
    estado::AppState,
    modelos::GrupoSuprimento,
    servicos::servico_suprimentos,
};

#[tauri::command]
pub fn listar_suprimentos(state: State<'_, Arc<AppState>>) -> AppResult<Vec<GrupoSuprimento>> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    servico_suprimentos::listar_grupos(&conexao)
}

#[tauri::command]
pub fn registrar_troca_suprimento(
    state: State<'_, Arc<AppState>>,
    impressora_id: i64,
    tipo: String,
    responsavel: String,
) -> AppResult<()> {
    let mut conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    servico_suprimentos::registrar_troca(&mut conexao, impressora_id, &tipo, &responsavel)?;
    crate::servicos::servico_auditoria::registrar(
        &conexao,
        "registrar_troca",
        "suprimento",
        Some(impressora_id),
        Some(&format!("{} por {}", tipo, responsavel)),
    )?;
    Ok(())
}
