use std::sync::Arc;

use tauri::State;

use crate::{
    erro::{AppError, AppResult},
    estado::AppState,
    modelos::{OrdemServico, PrevisaoItem, SaudeImpressora},
    predicao::servico,
};

#[tauri::command]
pub fn obter_saude_frota(state: State<'_, Arc<AppState>>) -> AppResult<Vec<SaudeImpressora>> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    servico::avaliar_frota(&conexao, &*state.modelo)
}

#[tauri::command]
pub fn obter_previsoes(state: State<'_, Arc<AppState>>) -> AppResult<Vec<PrevisaoItem>> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    servico::listar_previsoes(&conexao)
}

#[tauri::command]
pub fn listar_ordens_servico(state: State<'_, Arc<AppState>>) -> AppResult<Vec<OrdemServico>> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    servico::listar_ordens(&conexao)
}

#[allow(clippy::too_many_arguments)]
#[tauri::command]
pub fn criar_ordem_servico(
    state: State<'_, Arc<AppState>>,
    previsao_id: i64,
    titulo: String,
    prioridade: String,
    responsavel: Option<String>,
    data_prevista: Option<String>,
    custo_estimado: Option<f64>,
) -> AppResult<i64> {
    let mut conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    servico::criar_ordem(
        &mut conexao,
        previsao_id,
        titulo,
        prioridade,
        responsavel,
        data_prevista,
        custo_estimado,
    )
}

#[tauri::command]
pub fn recalcular_predicoes(state: State<'_, Arc<AppState>>) -> AppResult<bool> {
    let mut conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    servico::recalcular(&mut conexao, &*state.modelo)
}
