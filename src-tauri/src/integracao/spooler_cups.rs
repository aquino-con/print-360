//! Adaptador CUPS (Linux/macOS) usando `lpstat`, `lp`, `cancel`, `cupsenable` e `cupsdisable`.

use std::collections::HashMap;

use crate::erro::{AppError, AppResult};

use super::{
    spooler::{ImpressoraSistema, Spooler, TrabalhoSistema},
    util::{executar, status_impressora},
};

pub struct SpoolerCups;

fn validar_token(valor: &str) -> AppResult<&str> {
    if valor.is_empty()
        || valor.chars().any(|caractere| {
            caractere.is_whitespace() || matches!(caractere, '\'' | '"' | ';' | '&' | '|' | '$' | '`')
        })
    {
        return Err(AppError::Integracao(format!("identificador inválido: {}", valor)));
    }
    Ok(valor)
}

fn status_cups(detalhes: &str) -> String {
    let texto = detalhes.to_lowercase();
    if texto.contains("disabled") {
        return "pausada".into();
    }
    if texto.contains("offline") || texto.contains("error") {
        return "erro".into();
    }
    if texto.contains("printing") || texto.contains("print") {
        return "ocupada".into();
    }
    status_impressora("idle")
}

fn dispositivos() -> HashMap<String, String> {
    let Ok(saida) = executar("lpstat", &["-v"]) else {
        return HashMap::new();
    };
    saida
        .lines()
        .filter_map(|linha| {
            let (inicio, fim) = (linha.find("device for ")? + 11, linha.find(':')?);
            let nome = linha[inicio..fim].trim().to_string();
            let endereco = linha[fim + 1..].trim().to_string();
            Some((nome, endereco))
        })
        .collect()
}

impl Spooler for SpoolerCups {
    fn listar_impressoras(&self) -> AppResult<Vec<ImpressoraSistema>> {
        let saida = executar("lpstat", &["-p"])?;
        let enderecos = dispositivos();

        Ok(saida
            .lines()
            .filter_map(|linha| {
                let resto = linha.strip_prefix("printer ")?;
                let nome = resto.split_whitespace().next()?.to_string();
                let detalhes = resto[nome.len()..].to_string();
                Some(ImpressoraSistema {
                    modelo: None,
                    endereco: enderecos.get(&nome).cloned(),
                    nome,
                    status: status_cups(&detalhes),
                    compartilhada: false,
                })
            })
            .collect())
    }

    fn listar_trabalhos(&self, impressora: Option<&str>) -> AppResult<Vec<TrabalhoSistema>> {
        let saida = executar("lpstat", &["-W", "not-completed", "-o"])?;

        Ok(saida
            .lines()
            .filter_map(|linha| {
                let partes: Vec<&str> = linha.split_whitespace().collect();
                if partes.len() < 3 {
                    return None;
                }
                let referencia = partes[0];
                let (nome_impressora, id) = referencia.rsplit_once('-')?;
                if let Some(filtro) = impressora {
                    if !nome_impressora.eq_ignore_ascii_case(filtro) {
                        return None;
                    }
                }
                let tamanho = partes[2].parse::<i64>().ok();
                Some(TrabalhoSistema {
                    id_sistema: referencia.to_string(),
                    documento: format!("Trabalho {}", id),
                    impressora: nome_impressora.to_string(),
                    usuario: Some(partes[1].to_string()),
                    paginas: 0,
                    status: "pendente".into(),
                    progresso: 0,
                    tamanho_bytes: tamanho,
                })
            })
            .collect())
    }

    fn pausar_trabalho(&self, _impressora: &str, id: &str) -> AppResult<()> {
        let id = validar_token(id)?;
        executar("lp", &["-i", id, "-H", "hold"])?;
        Ok(())
    }

    fn retomar_trabalho(&self, _impressora: &str, id: &str) -> AppResult<()> {
        let id = validar_token(id)?;
        executar("lp", &["-i", id, "-H", "resume"])?;
        Ok(())
    }

    fn cancelar_trabalho(&self, _impressora: &str, id: &str) -> AppResult<()> {
        let id = validar_token(id)?;
        executar("cancel", &[id])?;
        Ok(())
    }

    fn reiniciar_trabalho(&self, _impressora: &str, id: &str) -> AppResult<()> {
        let id = validar_token(id)?;
        executar("lp", &["-i", id, "-H", "restart"])?;
        Ok(())
    }

    fn limpar_fila(&self, impressora: &str) -> AppResult<()> {
        let nome = validar_token(impressora)?;
        executar("cancel", &["-a", nome])?;
        Ok(())
    }

    fn pausar_impressora(&self, nome: &str) -> AppResult<()> {
        let nome = validar_token(nome)?;
        executar("cupsdisable", &[nome])?;
        Ok(())
    }

    fn retomar_impressora(&self, nome: &str) -> AppResult<()> {
        let nome = validar_token(nome)?;
        executar("cupsenable", &[nome])?;
        Ok(())
    }
}
