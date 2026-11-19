use std::{fs, sync::Arc};

use tauri::State;

use crate::{
    erro::{AppError, AppResult},
    estado::AppState,
    modelos::{AtividadeItem, Relatorio, ResumoDashboard},
    servicos::{servico_atividade, servico_custos, servico_relatorios},
};

/// Retorna os KPIs do dashboard (RF-023).
#[tauri::command]
pub fn obter_resumo_dashboard(state: State<'_, Arc<AppState>>) -> AppResult<ResumoDashboard> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    servico_relatorios::obter_resumo(&conexao)
}

/// Feed de atividade recente derivado de trabalhos, alertas e ordens (RF-023).
#[tauri::command]
pub fn obter_atividade_recente(
    state: State<'_, Arc<AppState>>,
    limite: Option<i64>,
) -> AppResult<Vec<AtividadeItem>> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    servico_atividade::listar(&conexao, limite.unwrap_or(8).clamp(1, 50))
}

/// Gera os dados do relatório gerencial (RF-020 / RF-021).
#[tauri::command]
pub fn obter_relatorio(
    state: State<'_, Arc<AppState>>,
    meses: Option<i64>,
    setor: Option<String>,
) -> AppResult<Relatorio> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    servico_custos::obter_relatorio(&conexao, meses.unwrap_or(12), setor.as_deref())
}

/// Exporta o relatório em CSV no caminho escolhido pelo usuário (RF-022).
#[tauri::command]
pub fn exportar_relatorio_csv(
    state: State<'_, Arc<AppState>>,
    caminho: String,
    meses: Option<i64>,
    setor: Option<String>,
) -> AppResult<()> {
    let relatorio = {
        let conexao = state
            .db
            .lock()
            .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
        servico_custos::obter_relatorio(&conexao, meses.unwrap_or(12), setor.as_deref())?
    };
    let csv = servico_custos::exportar_csv(&relatorio);
    fs::write(&caminho, csv)?;
    Ok(())
}
