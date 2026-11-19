use serde::Serialize;

use crate::erro::AppResult;

#[cfg(target_os = "windows")]
use super::spooler_windows::SpoolerWindows;
#[cfg(not(target_os = "windows"))]
use super::spooler_cups::SpoolerCups;

use std::sync::Arc;

/// Impressora conforme reportada pelo sistema operacional.
#[derive(Debug, Clone, Serialize)]
pub struct ImpressoraSistema {
    pub nome: String,
    pub modelo: Option<String>,
    pub endereco: Option<String>,
    pub status: String,
    pub compartilhada: bool,
}

/// Trabalho conforme reportado pelo spooler do sistema operacional.
#[derive(Debug, Clone, Serialize)]
pub struct TrabalhoSistema {
    pub id_sistema: String,
    pub documento: String,
    pub impressora: String,
    pub usuario: Option<String>,
    pub paginas: i64,
    pub status: String,
    pub progresso: i64,
    pub tamanho_bytes: Option<i64>,
}

/// Abstração sobre o spooler do sistema operacional (RF-032).
///
/// A implementaçãoWindows usa os cmdlets do módulo `PrintManagement`;
/// a implementação CUPS usa `lpstat`, `lp`, `cancel`, `cupsenable` e `cupsdisable`.
pub trait Spooler: Send + Sync {
    fn listar_impressoras(&self) -> AppResult<Vec<ImpressoraSistema>>;
    fn listar_trabalhos(&self, impressora: Option<&str>) -> AppResult<Vec<TrabalhoSistema>>;
    fn pausar_trabalho(&self, impressora: &str, id: &str) -> AppResult<()>;
    fn retomar_trabalho(&self, impressora: &str, id: &str) -> AppResult<()>;
    fn cancelar_trabalho(&self, impressora: &str, id: &str) -> AppResult<()>;
    fn reiniciar_trabalho(&self, impressora: &str, id: &str) -> AppResult<()>;
    fn limpar_fila(&self, impressora: &str) -> AppResult<()>;
    fn pausar_impressora(&self, nome: &str) -> AppResult<()>;
    fn retomar_impressora(&self, nome: &str) -> AppResult<()>;
}

/// Fábrica do adaptador adequado ao sistema operacional atual.
pub fn criar_spooler() -> Arc<dyn Spooler> {
    #[cfg(target_os = "windows")]
    {
        Arc::new(SpoolerWindows)
    }
    #[cfg(not(target_os = "windows"))]
    {
        Arc::new(SpoolerCups)
    }
}
