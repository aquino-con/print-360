use std::sync::Arc;

use rusqlite::params;
use tauri::State;

use crate::{
    erro::{AppError, AppResult},
    estado::AppState,
    modelos::Trabalho,
};

/// Lista os trabalhos recentes da fila (RF-006 / RF-010).
#[tauri::command]
pub fn listar_trabalhos(state: State<'_, Arc<AppState>>) -> AppResult<Vec<Trabalho>> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;

    let mut declaracao = conexao.prepare(
        "SELECT f.id, f.documento, u.nome AS usuario, i.nome AS impressora,
                f.paginas, f.status, f.progresso, f.criado_em
         FROM fila_impressao f
         JOIN impressoras i ON i.id = f.impressora_id
         LEFT JOIN usuarios u ON u.id = f.usuario_id
         ORDER BY f.criado_em DESC
         LIMIT 200",
    )?;

    let linhas = declaracao.query_map([], |linha| {
        Ok(Trabalho {
            id: linha.get(0)?,
            documento: linha.get(1)?,
            usuario: linha.get(2)?,
            impressora: linha.get(3)?,
            paginas: linha.get(4)?,
            status: linha.get(5)?,
            progresso: linha.get(6)?,
            criado_em: linha.get(7)?,
        })
    })?;

    linhas.map(|linha| linha.map_err(AppError::from)).collect()
}

/// Extrai o identificador do trabalho no spooler a partir do `id_sistema`.
fn id_no_spooler(id_sistema: &str) -> String {
    id_sistema
        .rsplit_once(':')
        .or_else(|| id_sistema.rsplit_once('-'))
        .map(|(_, id)| id)
        .unwrap_or(id_sistema)
        .to_string()
}

struct Alvo {
    impressora: String,
    id_sistema: String,
}

fn localizar(state: &Arc<AppState>, trabalho_id: i64) -> AppResult<Alvo> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    let resultado = conexao.query_row(
        "SELECT i.nome, f.id_sistema
         FROM fila_impressao f JOIN impressoras i ON i.id = f.impressora_id
         WHERE f.id = ?1",
        params![trabalho_id],
        |linha| {
            Ok((
                linha.get::<_, String>(0)?,
                linha.get::<_, Option<String>>(1)?.unwrap_or_default(),
            ))
        },
    );

    let (impressora, id_sistema) = resultado.map_err(|_| {
        AppError::NaoEncontrado(format!("trabalho {} não encontrado", trabalho_id))
    })?;
    if id_sistema.is_empty() {
        return Err(AppError::Integracao(
            "trabalho não possui identificador no spooler".into(),
        ));
    }
    Ok(Alvo {
        impressora,
        id_sistema,
    })
}

fn registrar_evento(state: &Arc<AppState>, trabalho_id: i64, acao: &str) -> AppResult<()> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    conexao.execute(
        "INSERT INTO eventos_fila (trabalho_id, acao) VALUES (?1, ?2)",
        params![trabalho_id, acao],
    )?;
    Ok(())
}

fn aplicar_acao(
    state: &Arc<AppState>,
    trabalho_id: i64,
    acao: &str,
    status_final: &str,
) -> AppResult<()> {
    let alvo = localizar(state, trabalho_id)?;
    let id = id_no_spooler(&alvo.id_sistema);

    match acao {
        "pausar" => state.spooler.pausar_trabalho(&alvo.impressora, &id)?,
        "retomar" => state.spooler.retomar_trabalho(&alvo.impressora, &id)?,
        "cancelar" => state.spooler.cancelar_trabalho(&alvo.impressora, &id)?,
        "reiniciar" => state.spooler.reiniciar_trabalho(&alvo.impressora, &id)?,
        _ => return Err(AppError::Validacao("ação desconhecida".into())),
    }

    {
        let conexao = state
            .db
            .lock()
            .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
        conexao.execute(
            "UPDATE fila_impressao SET status = ?2,
                 progresso = CASE WHEN ?2 = 'concluido' THEN 100 ELSE progresso END,
                 concluido_em = CASE WHEN ?2 IN ('cancelado', 'concluido') THEN CURRENT_TIMESTAMP ELSE concluido_em END
             WHERE id = ?1",
            params![trabalho_id, status_final],
        )?;
    }
    registrar_evento(state, trabalho_id, acao)?;
    {
        let conexao = state
            .db
            .lock()
            .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
        crate::servicos::servico_auditoria::registrar(
            &conexao,
            &format!("{}_trabalho", acao),
            "trabalho",
            Some(trabalho_id),
            Some(&alvo.impressora),
        )?;
    }
    Ok(())
}

#[tauri::command]
pub fn pausar_trabalho(state: State<'_, Arc<AppState>>, id: i64) -> AppResult<()> {
    aplicar_acao(&state, id, "pausar", "pausado")
}

#[tauri::command]
pub fn retomar_trabalho(state: State<'_, Arc<AppState>>, id: i64) -> AppResult<()> {
    aplicar_acao(&state, id, "retomar", "processando")
}

#[tauri::command]
pub fn cancelar_trabalho(state: State<'_, Arc<AppState>>, id: i64) -> AppResult<()> {
    aplicar_acao(&state, id, "cancelar", "cancelado")
}

#[tauri::command]
pub fn reiniciar_trabalho(state: State<'_, Arc<AppState>>, id: i64) -> AppResult<()> {
    aplicar_acao(&state, id, "reiniciar", "processando")
}
