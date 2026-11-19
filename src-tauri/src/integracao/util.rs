use std::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

use serde_json::Value;

use crate::erro::{AppError, AppResult};

/// Evita que o Windows abra uma janela de console visível para cada comando externo.
#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

/// Executa um comando externo e devolve a saída padrão.
pub fn executar(programa: &str, argumentos: &[&str]) -> AppResult<String> {
    let mut comando = Command::new(programa);
    comando.args(argumentos);

    // Sem esta flag, cada chamada ao PowerShell pisca uma janela na área de trabalho.
    #[cfg(target_os = "windows")]
    comando.creation_flags(CREATE_NO_WINDOW);

    let saida = comando
        .output()
        .map_err(|erro| AppError::Integracao(format!("{}: {}", programa, erro)))?;

    if !saida.status.success() {
        let detalhe = String::from_utf8_lossy(&saida.stderr).trim().to_string();
        return Err(AppError::Integracao(format!(
            "{} falhou: {}",
            programa,
            if detalhe.is_empty() { "erro desconhecido" } else { &detalhe }
        )));
    }

    Ok(String::from_utf8_lossy(&saida.stdout).to_string())
}

/// Executa um script PowerShell e devolve a saída padrão.
pub fn powershell(script: &str) -> AppResult<String> {
    executar("powershell.exe", &["-NoProfile", "-NonInteractive", "-Command", script])
}

/// Normaliza respostas JSON que podem vir como objeto único, array ou vazias.
pub fn como_lista(valor: &Value) -> Vec<&Value> {
    match valor {
        Value::Array(itens) => itens.iter().collect(),
        Value::Null => Vec::new(),
        outro => vec![outro],
    }
}

pub fn texto(valor: &Value, chave: &str) -> Option<String> {
    valor
        .get(chave)
        .and_then(Value::as_str)
        .map(str::to_string)
        .filter(|texto| !texto.is_empty())
}

pub fn inteiro(valor: &Value, chave: &str) -> i64 {
    match valor.get(chave) {
        Some(Value::Number(numero)) => numero.as_i64().unwrap_or(0),
        Some(Value::String(texto)) => texto.parse().unwrap_or(0),
        _ => 0,
    }
}

/// Escapa aspas simples para interpolação segura em scripts PowerShell.
pub fn escapar_ps(valor: &str) -> String {
    valor.replace('\'', "''")
}

/// Mapeia o status reportado pelo SO para o vocabulário do Print 360.
pub fn status_impressora(valor: &str) -> String {
    let texto = valor.to_lowercase();
    match texto.as_str() {
        "3" | "idle" | "normal" | "ready" | "waiting" => "pronta".into(),
        "4" | "5" | "6" | "10" | "12" | "13" | "14" | "printing" | "busy" | "processing" | "warmup" => "ocupada".into(),
        "7" | "offline" | "notavailable" | "not available" => "offline".into(),
        "8" | "paused" | "stopped" | "stoppedprinting" => "pausada".into(),
        "9" | "error" => "erro".into(),
        "15" | "powersave" => "pronta".into(),
        _ => "desconhecido".into(),
    }
}

/// Mapeia o status do trabalho para o vocabulário do Print 360.
pub fn status_trabalho(valor: &str) -> String {
    let texto = valor.to_lowercase();
    if texto.contains("error") || texto.contains("9") {
        return "erro".into();
    }
    if texto.contains("paus") || texto.contains("held") {
        return "pausado".into();
    }
    if texto.contains("cancel") || texto.contains("delet") {
        return "cancelado".into();
    }
    if texto.contains("complete") || texto.contains("retained") {
        return "concluido".into();
    }
    if texto.contains("print") || texto.contains("progress") || texto.contains("restart") {
        return "processando".into();
    }
    "pendente".into()
}

#[cfg(test)]
mod testes {
    use super::*;

    #[test]
    fn mapeia_status_de_impressoras() {
        assert_eq!(status_impressora("3"), "pronta");
        assert_eq!(status_impressora("Printing"), "ocupada");
        assert_eq!(status_impressora("9"), "erro");
        assert_eq!(status_impressora("8"), "pausada");
        assert_eq!(status_impressora("7"), "offline");
        assert_eq!(status_impressora("estranho"), "desconhecido");
    }

    #[test]
    fn mapeia_status_de_trabalhos() {
        assert_eq!(status_trabalho("Printing"), "processando");
        assert_eq!(status_trabalho("Paused"), "pausado");
        assert_eq!(status_trabalho("Error"), "erro");
        assert_eq!(status_trabalho("Complete"), "concluido");
        assert_eq!(status_trabalho("Queued"), "pendente");
    }

    #[test]
    fn normaliza_json_de_um_ou_varios_itens() {
        let unico: Value = serde_json::from_str(r#"{"nome":"HP"}"#).unwrap();
        assert_eq!(como_lista(&unico).len(), 1);

        let vazio: Value = serde_json::from_str("[]").unwrap();
        assert!(como_lista(&vazio).is_empty());
    }
}
