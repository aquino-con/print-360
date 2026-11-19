use std::{
    fs,
    path::{Path, PathBuf},
    sync::{Arc, Mutex},
};

use rusqlite::Connection;

use crate::{
    erro::{AppError, AppResult},
    integracao::spooler::{criar_spooler, Spooler},
    predicao::modelo::{ModeloHeuristico, ModeloPreditivo},
    repositorio::migrations::aplicar_migrations,
    sincronizacao::transporte::{Transporte, TransporteArquivo, TransporteHttp},
};

/// Estado compartilhado injetado nos comandos Tauri via `State<AppState>`.
pub struct AppState {
    pub db: Arc<Mutex<Connection>>,
    pub spooler: Arc<dyn Spooler>,
    /// Caminho do arquivo SQLite, necessário para backup e restauração (RF-030).
    pub caminho_db: PathBuf,
    /// Modelo preditivo plugável (ADR F2-002).
    pub modelo: Arc<dyn ModeloPreditivo>,
    /// Transporte de sincronização entre instalações (ADR F2-004).
    pub transporte: Arc<dyn Transporte>,
}

impl AppState {
    /// Abre (ou cria) o banco SQLite no diretório de dados do usuário e aplica as migrations.
    pub fn novo() -> AppResult<Self> {
        let base = dirs::data_dir().unwrap_or_else(|| PathBuf::from("."));
        let diretorio = base.join("print_360");
        fs::create_dir_all(&diretorio)?;

        let caminho = diretorio.join("print360.db");
        let conexao = Connection::open(&caminho)?;
        aplicar_migrations(&conexao)?;

        let transporte: Arc<dyn Transporte> = {
            let tipo: String = conexao
                .query_row(
                    "SELECT valor FROM configuracoes WHERE chave = 'f2_sync_transporte'",
                    [],
                    |linha| linha.get(0),
                )
                .unwrap_or_else(|_| "arquivo".to_string());
            if tipo == "http" {
                let url: String = conexao
                    .query_row("SELECT valor FROM configuracoes WHERE chave = 'f2_sync_url'", [], |l| l.get(0))
                    .unwrap_or_default();
                let token: String = conexao
                    .query_row("SELECT valor FROM configuracoes WHERE chave = 'f2_sync_token'", [], |l| l.get(0))
                    .unwrap_or_default();
                Arc::new(TransporteHttp::novo(&url, &token))
            } else {
                Arc::new(TransporteArquivo::novo(&diretorio.join("sync.jsonl")))
            }
        };

        Ok(Self {
            db: Arc::new(Mutex::new(conexao)),
            spooler: criar_spooler(),
            caminho_db: caminho,
            modelo: Arc::new(ModeloHeuristico),
            transporte,
        })
    }

}

/// Verifica se um arquivo é um banco Print 360 válido antes de restaurar.
pub fn validar_backup(caminho: &Path) -> AppResult<()> {
    if !caminho.is_file() {
        return Err(AppError::Validacao("arquivo de backup não encontrado".into()));
    }
    let conexao = Connection::open_with_flags(
        caminho,
        rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY,
    )
    .map_err(|_| AppError::Validacao("arquivo não é um banco SQLite válido".into()))?;

    let versoes: i64 = conexao
        .query_row("SELECT COUNT(*) FROM schema_migrations", [], |linha| linha.get(0))
        .map_err(|_| AppError::Validacao("backup não pertence ao Print 360".into()))?;
    if versoes == 0 {
        return Err(AppError::Validacao("backup sem migrations registradas".into()));
    }
    Ok(())
}
