use crate::erro::{AppError, AppResult};

/// Valida que um campo obrigatório não está vazio (RNF-008).
pub fn nao_vazio(valor: &str, campo: &str) -> AppResult<()> {
    if valor.trim().is_empty() {
        Err(AppError::Validacao(format!("{} é obrigatório", campo)))
    } else {
        Ok(())
    }
}

/// Limita o tamanho de uma listagem retornada ao frontend.
pub fn limite_paginacao(valor: usize, maximo: usize) -> AppResult<usize> {
    if valor == 0 || valor > maximo {
        Err(AppError::Validacao(format!(
            "limite deve estar entre 1 e {}",
            maximo
        )))
    } else {
        Ok(valor)
    }
}
