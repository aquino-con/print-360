use std::sync::Arc;

use tauri::State;

use crate::{
    erro::{AppError, AppResult},
    estado::AppState,
    modelos::{ExecucaoRoteamento, RegraRoteamento, Simulacao},
    roteamento::regra::{Acao, Condicao, Contexto},
    roteamento::servico,
};

#[tauri::command]
pub fn listar_regras(state: State<'_, Arc<AppState>>) -> AppResult<Vec<RegraRoteamento>> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    servico::listar_regras(&conexao)
}

#[allow(clippy::too_many_arguments)]
#[tauri::command]
pub fn salvar_regra(
    state: State<'_, Arc<AppState>>,
    id: Option<i64>,
    nome: String,
    prioridade: i64,
    condicoes: Vec<Condicao>,
    acao: Acao,
    ativa: bool,
) -> AppResult<i64> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    servico::salvar_regra(&conexao, id, &nome, prioridade, &condicoes, &acao, ativa)
}

#[tauri::command]
pub fn alternar_regra(state: State<'_, Arc<AppState>>, id: i64) -> AppResult<()> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    servico::alternar_regra(&conexao, id)
}

#[tauri::command]
pub fn excluir_regra(state: State<'_, Arc<AppState>>, id: i64) -> AppResult<()> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    servico::excluir_regra(&conexao, id)
}

#[tauri::command]
pub fn simular_roteamento(
    state: State<'_, Arc<AppState>>,
    contexto: Contexto,
) -> AppResult<Simulacao> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    servico::simular(&conexao, &contexto)
}

#[tauri::command]
pub fn listar_decisoes_roteamento(
    state: State<'_, Arc<AppState>>,
) -> AppResult<Vec<ExecucaoRoteamento>> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    servico::listar_execucoes(&conexao)
}
