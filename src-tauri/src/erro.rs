use serde::Serialize;

/// Erros uniformes da aplicação, serializados como texto para o frontend.
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Erro de banco de dados: {0}")]
    Banco(#[from] rusqlite::Error),

    #[error("Erro de entrada/saída: {0}")]
    Io(#[from] std::io::Error),

    #[error("Entrada inválida: {0}")]
    Validacao(String),

    #[error("Não encontrado: {0}")]
    NaoEncontrado(String),

    #[error("Falha na integração com o spooler: {0}")]
    Integracao(String),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;
