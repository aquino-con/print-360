use std::sync::Arc;

use tauri::{AppHandle, Emitter, State};

use crate::{
    erro::{AppError, AppResult},
    estado::AppState,
    sincronizacao::{
        modelo::{Mudanca, ResultadoSync, StatusSync},
        outbox, servico,
    },
};

pub const EVENTO_SYNC_INICIADA: &str = "sync_iniciada";
pub const EVENTO_SYNC_CONCLUIDA: &str = "sync_concluida";
pub const EVENTO_CONFLITO_DETECTADO: &str = "conflito_detectado";

#[tauri::command]
pub fn obter_status_sync(state: State<'_, Arc<AppState>>) -> AppResult<StatusSync> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    servico::status(&conexao)
}

/// Itens pendentes no outbox, exibidos na tela de sincronização (RF-016).
#[tauri::command]
pub fn listar_outbox(state: State<'_, Arc<AppState>>) -> AppResult<Vec<Mudanca>> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    outbox::pendentes(&conexao, 20)
}

#[tauri::command]
pub async fn sincronizar_agora(
    app: AppHandle,
    state: State<'_, Arc<AppState>>,
) -> AppResult<ResultadoSync> {
    let _ = app.emit(EVENTO_SYNC_INICIADA, ());

    let resultado = {
        let mut conexao = state
            .db
            .lock()
            .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
        servico::sincronizar(&mut conexao, &*state.transporte)?
    };

    let _ = app.emit(EVENTO_SYNC_CONCLUIDA, &resultado);
    if resultado.conflitos > 0 {
        let _ = app.emit(EVENTO_CONFLITO_DETECTADO, resultado.conflitos);
    }
    Ok(resultado)
}

#[tauri::command]
pub fn cadastrar_instalacao(
    state: State<'_, Arc<AppState>>,
    id: String,
    nome: String,
    site: Option<String>,
) -> AppResult<()> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    servico::cadastrar_instalacao(&conexao, &id, &nome, site.as_deref())
}

#[tauri::command]
pub fn resolver_conflito_sync(
    state: State<'_, Arc<AppState>>,
    id: i64,
    vencedor: String,
) -> AppResult<()> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    servico::resolver_conflito(&conexao, id, &vencedor)
}
