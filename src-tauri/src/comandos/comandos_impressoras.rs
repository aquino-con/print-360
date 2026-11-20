use std::sync::Arc;

use rusqlite::params;
use tauri::State;

use crate::{
    erro::{AppError, AppResult},
    estado::AppState,
    modelos::{DetalhesImpressora, Impressora, ResultadoDescoberta},
    util::validacao::nao_vazio,
};

/// Lista as impressoras cadastradas (RF-001 / RF-003).
#[tauri::command]
pub fn listar_impressoras(state: State<'_, Arc<AppState>>) -> AppResult<Vec<Impressora>> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;

    let mut declaracao = conexao.prepare(
        "SELECT i.id, i.nome, i.modelo, i.endereco, i.status, s.nome AS setor,
                i.origem, i.ultima_vista
         FROM impressoras i
         LEFT JOIN setores s ON s.id = i.setor_id
         ORDER BY i.nome",
    )?;

    let linhas = declaracao.query_map([], |linha| {
        Ok(Impressora {
            id: linha.get(0)?,
            nome: linha.get(1)?,
            modelo: linha.get(2)?,
            endereco: linha.get(3)?,
            status: linha.get(4)?,
            setor: linha.get(5)?,
            origem: linha.get(6)?,
            ultima_vista: linha.get(7)?,
        })
    })?;

    linhas.map(|linha| linha.map_err(AppError::from)).collect()
}

/// Descoberta manual: spooler local + rede configurada (RF-001).
#[tauri::command]
pub fn descobrir_impressoras(
    state: State<'_, Arc<AppState>>,
) -> AppResult<ResultadoDescoberta> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    let resultado = crate::servicos::servico_descoberta::descobrir(&conexao, &*state.spooler)?;
    crate::servicos::servico_auditoria::registrar(
        &conexao,
        "descobrir_impressoras",
        "impressora",
        None,
        Some(&format!(
            "{} encontrada(s), {} nova(s), {} atualizada(s)",
            resultado.encontradas, resultado.novas, resultado.atualizadas
        )),
    )?;
    Ok(resultado)
}

/// Ficha técnica completa de uma impressora (RF-004).
#[tauri::command]
pub fn obter_detalhes_impressora(
    state: State<'_, Arc<AppState>>,
    id: i64,
) -> AppResult<DetalhesImpressora> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    crate::servicos::servico_impressoras::obter_detalhes(&conexao, id)
}

/// Cadastra manualmente uma impressora (RF-002).
#[tauri::command]
pub fn adicionar_impressora(
    state: State<'_, Arc<AppState>>,
    nome: String,
    endereco: Option<String>,
    setor: Option<String>,
) -> AppResult<i64> {
    nao_vazio(&nome, "nome")?;
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;

    conexao.execute(
        "INSERT INTO impressoras (nome, endereco, status, origem, setor_id)
         VALUES (?1, ?2, 'desconhecido', 'manual',
                 (SELECT id FROM setores WHERE nome = ?3))",
        params![nome.trim(), endereco, setor],
    )?;
    let id = conexao.last_insert_rowid();
    crate::servicos::servico_auditoria::registrar(
        &conexao, "cadastrar_impressora", "impressora", Some(id), Some(nome.trim()),
    )?;
    Ok(id)
}

/// Pausa uma impressora no spooler (RF-005).
#[tauri::command]
pub fn pausar_impressora(state: State<'_, Arc<AppState>>, nome: String) -> AppResult<()> {
    state.spooler.pausar_impressora(&nome)?;
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    conexao.execute(
        "UPDATE impressoras SET status = 'pausada' WHERE nome = ?1",
        params![nome],
    )?;
    crate::servicos::servico_auditoria::registrar(
        &conexao, "pausar_impressora", "impressora", None, Some(&nome),
    )?;
    Ok(())
}

/// Retoma uma impressora no spooler (RF-005).
#[tauri::command]
pub fn retomar_impressora(state: State<'_, Arc<AppState>>, nome: String) -> AppResult<()> {
    state.spooler.retomar_impressora(&nome)?;
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    conexao.execute(
        "UPDATE impressoras SET status = 'pronta' WHERE nome = ?1",
        params![nome],
    )?;
    crate::servicos::servico_auditoria::registrar(
        &conexao, "retomar_impressora", "impressora", None, Some(&nome),
    )?;
    Ok(())
}

/// Limpa a fila de uma impressora (RF-005).
#[tauri::command]
pub fn limpar_fila_impressora(
    state: State<'_, Arc<AppState>>,
    nome: String,
) -> AppResult<()> {
    state.spooler.limpar_fila(&nome)?;
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    conexao.execute(
        "UPDATE fila_impressao SET status = 'cancelado', concluido_em = CURRENT_TIMESTAMP
         WHERE impressora_id = (SELECT id FROM impressoras WHERE nome = ?1)
           AND status IN ('pendente', 'processando', 'pausado')",
        params![nome],
    )?;
    crate::servicos::servico_auditoria::registrar(
        &conexao, "limpar_fila", "impressora", None, Some(&nome),
    )?;
    Ok(())
}
