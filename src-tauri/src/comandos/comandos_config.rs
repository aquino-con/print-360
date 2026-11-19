use std::{collections::HashMap, sync::Arc};

use tauri::State;

use crate::{
    erro::{AppError, AppResult},
    estado::AppState,
};

/// Lê todas as preferências salvas (RF-027).
#[tauri::command]
pub fn obter_configuracoes(state: State<'_, Arc<AppState>>) -> AppResult<HashMap<String, String>> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;

    let mut declaracao = conexao.prepare("SELECT chave, valor FROM configuracoes")?;
    let linhas = declaracao.query_map([], |linha| {
        Ok((linha.get::<_, String>(0)?, linha.get::<_, String>(1)?))
    })?;

    linhas.map(|linha| linha.map_err(AppError::from)).collect()
}

/// Salva (ou atualiza) preferências em uma única transação (RF-027).
#[tauri::command]
pub fn salvar_configuracoes(
    state: State<'_, Arc<AppState>>,
    valores: HashMap<String, String>,
) -> AppResult<()> {
    let mut conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;

    let transacao = conexao.transaction()?;
    {
        let mut declaracao = transacao.prepare(
            "INSERT INTO configuracoes (chave, valor) VALUES (?1, ?2)
             ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor",
        )?;
        for (chave, valor) in &valores {
            declaracao.execute([chave, valor])?;
        }
    }
    transacao.commit()?;
    crate::servicos::servico_auditoria::registrar(
        &conexao, "alterar_configuracoes", "configuracao", None,
        Some(&format!("{} chaves alteradas", valores.len())),
    )?;
    Ok(())
}

/// Atualiza os parâmetros de custo por página (RF-028).
#[tauri::command]
pub fn salvar_parametros_custo(
    state: State<'_, Arc<AppState>>,
    preto: f64,
    cor: f64,
) -> AppResult<()> {
    if preto < 0.0 || cor < 0.0 {
        return Err(AppError::Validacao("custos não podem ser negativos".into()));
    }
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    crate::servicos::servico_custos::salvar_parametros(&conexao, preto, cor)
}
