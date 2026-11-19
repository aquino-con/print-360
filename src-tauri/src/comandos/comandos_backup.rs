use std::{fs, path::PathBuf, sync::Arc};

use rusqlite::{params, Connection};
use tauri::State;

use crate::{
    erro::{AppError, AppResult},
    estado::{validar_backup, AppState},
    modelos::RegistroAuditoria,
    repositorio::migrations::aplicar_migrations,
    servicos::servico_auditoria,
};

/// Exporta um snapshot consistente do banco (RF-030).
#[tauri::command]
pub fn exportar_backup(state: State<'_, Arc<AppState>>, caminho: String) -> AppResult<()> {
    let destino = PathBuf::from(&caminho);
    if destino.exists() {
        fs::remove_file(&destino)?;
    }
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    // VACUUM INTO gera um arquivo íntegro sem bloquear leituras prolongadas.
    conexao.execute("VACUUM INTO ?1", params![caminho])?;
    Ok(())
}

/// Restaura um backup previamente validado (RF-030).
#[tauri::command]
pub fn importar_backup(state: State<'_, Arc<AppState>>, caminho: String) -> AppResult<()> {
    let origem = PathBuf::from(&caminho);
    validar_backup(&origem)?;

    let mut guard = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;

    // Substitui temporariamente a conexão para liberar o arquivo no Windows.
    let temporaria = Connection::open_in_memory()?;
    let anterior = std::mem::replace(&mut *guard, temporaria);
    drop(anterior);

    let sufixos = ["-wal", "-shm"];
    for sufixo in sufixos {
        let caminho_sidecar = PathBuf::from(format!("{}{}", state.caminho_db.to_string_lossy(), sufixo));
        let _ = fs::remove_file(caminho_sidecar);
    }

    fs::copy(&origem, &state.caminho_db)?;
    let restaurada = Connection::open(&state.caminho_db)?;
    aplicar_migrations(&restaurada)?;
    *guard = restaurada;

    let conexao = guard;
    servico_auditoria::registrar(
        &conexao,
        "restaurar_backup",
        "configuracao",
        None,
        Some(&format!("Backup restaurado de {}", origem.display())),
    )?;
    Ok(())
}

/// Lista a trilha de auditoria (RF-031).
#[tauri::command]
pub fn listar_auditoria(
    state: State<'_, Arc<AppState>>,
    limite: Option<i64>,
) -> AppResult<Vec<RegistroAuditoria>> {
    let conexao = state
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;
    servico_auditoria::listar(&conexao, limite.unwrap_or(100).clamp(1, 500))
}

#[cfg(test)]
mod testes {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn valida_backup_gerado_por_vacuum() {
        let selo = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos();
        let diretorio = std::env::temp_dir().join(format!("print360_backup_{}_{}", std::process::id(), selo));
        fs::create_dir_all(&diretorio).unwrap();

        let caminho_db = diretorio.join("orig.db");
        let conexao = Connection::open(&caminho_db).unwrap();
        aplicar_migrations(&conexao).unwrap();

        let backup = diretorio.join("backup.db");
        conexao
            .execute("VACUUM INTO ?1", params![backup.to_string_lossy().to_string()])
            .unwrap();

        validar_backup(&backup).unwrap();

        let invalido = diretorio.join("invalido.txt");
        fs::write(&invalido, "não é um banco").unwrap();
        assert!(validar_backup(&invalido).is_err());

        drop(conexao);
        fs::remove_dir_all(&diretorio).unwrap();
    }
}
