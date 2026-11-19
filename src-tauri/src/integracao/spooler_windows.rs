//! Adaptador Windows para o Print Spooler, via módulo PowerShell `PrintManagement`.
//!
//! Optou-se pelos cmdlets oficiais em vez de FFI direta para reduzir risco de
//! quebra entre versões do Windows. O trait `Spooler` permite trocar por uma
//! implementação FFI no futuro sem afetar o restante da aplicação.

use serde_json::Value;

use crate::erro::{AppError, AppResult};

use super::{
    spooler::{ImpressoraSistema, Spooler, TrabalhoSistema},
    util::{como_lista, escapar_ps, executar, inteiro, powershell, status_impressora, status_trabalho, texto},
};

pub struct SpoolerWindows;

fn parse_json(saida: &str) -> AppResult<Value> {
    let limpo = saida.trim();
    if limpo.is_empty() {
        return Ok(Value::Array(Vec::new()));
    }
    serde_json::from_str(limpo).map_err(|erro| AppError::Integracao(format!("JSON inválido do spooler: {}", erro)))
}

fn validar_id(id: &str) -> AppResult<i64> {
    id.parse::<i64>()
        .map_err(|_| AppError::Integracao(format!("identificador de trabalho inválido: {}", id)))
}

impl Spooler for SpoolerWindows {
    fn listar_impressoras(&self) -> AppResult<Vec<ImpressoraSistema>> {
        const SCRIPT: &str = r#"$itens = @(Get-Printer | ForEach-Object { [PSCustomObject]@{ nome = [string]$_.Name; modelo = [string]$_.DriverName; endereco = [string]$_.PortName; compartilhada = [bool]$_.Shared; status = [string]$_.PrinterStatus } }); $itens | ConvertTo-Json -Compress -Depth 4"#;
        let json = parse_json(&powershell(SCRIPT)?)?;

        Ok(como_lista(&json)
            .into_iter()
            .filter_map(|item| {
                let nome = texto(item, "nome")?;
                Some(ImpressoraSistema {
                    nome,
                    modelo: texto(item, "modelo"),
                    endereco: texto(item, "endereco"),
                    status: status_impressora(&texto(item, "status").unwrap_or_default()),
                    compartilhada: item.get("compartilhada").and_then(Value::as_bool).unwrap_or(false),
                })
            })
            .collect())
    }

    fn listar_trabalhos(&self, impressora: Option<&str>) -> AppResult<Vec<TrabalhoSistema>> {
        const SCRIPT: &str = r#"$itens = @(Get-Printer | ForEach-Object { Get-PrintJob -PrinterName $_.Name -ErrorAction SilentlyContinue } | ForEach-Object { [PSCustomObject]@{ id = [string]$_.ID; documento = [string]$_.DocumentName; usuario = [string]$_.UserName; paginas = [int]$_.PageCount; tamanho = [long]$_.Size; status = [string]$_.JobStatus.ToString(); impressora = [string]$_.PrinterName } }); $itens | ConvertTo-Json -Compress -Depth 4"#;
        let json = parse_json(&powershell(SCRIPT)?)?;

        Ok(como_lista(&json)
            .into_iter()
            .filter_map(|item| {
                let id = texto(item, "id")?;
                let nome_impressora = texto(item, "impressora")?;
                if let Some(filtro) = impressora {
                    if !nome_impressora.eq_ignore_ascii_case(filtro) {
                        return None;
                    }
                }
                let status = status_trabalho(&texto(item, "status").unwrap_or_default());
                let progresso = match status.as_str() {
                    "concluido" => 100,
                    "processando" => 50,
                    _ => 0,
                };
                Some(TrabalhoSistema {
                    id_sistema: format!("{}:{}", nome_impressora, id),
                    documento: texto(item, "documento").unwrap_or_else(|| format!("Trabalho {}", id)),
                    impressora: nome_impressora,
                    usuario: texto(item, "usuario"),
                    paginas: inteiro(item, "paginas"),
                    status,
                    progresso,
                    tamanho_bytes: match item.get("tamanho").and_then(Value::as_i64) {
                        Some(valor) if valor > 0 => Some(valor),
                        _ => None,
                    },
                })
            })
            .collect())
    }

    fn pausar_trabalho(&self, impressora: &str, id: &str) -> AppResult<()> {
        let identificador = validar_id(id)?;
        powershell(&format!(
            "Suspend-PrintJob -PrinterName '{}' -ID {} -ErrorAction Stop",
            escapar_ps(impressora),
            identificador
        ))?;
        Ok(())
    }

    fn retomar_trabalho(&self, impressora: &str, id: &str) -> AppResult<()> {
        let identificador = validar_id(id)?;
        powershell(&format!(
            "Resume-PrintJob -PrinterName '{}' -ID {} -ErrorAction Stop",
            escapar_ps(impressora),
            identificador
        ))?;
        Ok(())
    }

    fn cancelar_trabalho(&self, impressora: &str, id: &str) -> AppResult<()> {
        let identificador = validar_id(id)?;
        powershell(&format!(
            "Remove-PrintJob -PrinterName '{}' -ID {} -ErrorAction Stop",
            escapar_ps(impressora),
            identificador
        ))?;
        Ok(())
    }

    fn reiniciar_trabalho(&self, impressora: &str, id: &str) -> AppResult<()> {
        // O módulo PrintManagement não expõe "restart" de trabalho; suspend + resume
        // força o spooler a reiniciar o processamento do job.
        self.pausar_trabalho(impressora, id)?;
        self.retomar_trabalho(impressora, id)
    }

    fn limpar_fila(&self, impressora: &str) -> AppResult<()> {
        powershell(&format!(
            "Get-PrintJob -PrinterName '{}' -ErrorAction SilentlyContinue | Remove-PrintJob -ErrorAction Stop",
            escapar_ps(impressora)
        ))?;
        Ok(())
    }

    fn pausar_impressora(&self, nome: &str) -> AppResult<()> {
        executar("net", &["pause", nome])?;
        Ok(())
    }

    fn retomar_impressora(&self, nome: &str) -> AppResult<()> {
        executar("net", &["continue", nome])?;
        Ok(())
    }
}
