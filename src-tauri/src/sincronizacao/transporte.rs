use std::{fs, path::{Path, PathBuf}};

use crate::erro::{AppError, AppResult};

use super::modelo::{Mudanca, MudancaRemota};

/// Transporte abstrato de mudanças entre instalações (ADR F2-004).
pub trait Transporte: Send + Sync {
    fn nome(&self) -> &'static str;
    fn enviar(&self, lote: &[Mudanca]) -> AppResult<usize>;
    fn receber(&self, desde: Option<&str>) -> AppResult<Vec<MudancaRemota>>;
}

fn para_remota(mudanca: &Mudanca) -> MudancaRemota {
    MudancaRemota {
        instalacao_origem: mudanca.instalacao_origem.clone(),
        entidade: mudanca.entidade.clone(),
        entidade_id: mudanca.entidade_id,
        versao: mudanca.versao,
        operacao: mudanca.operacao.clone(),
        payload_json: mudanca.payload_json.clone(),
        criado_em: mudanca.criado_em.clone(),
    }
}

/// Transporte baseado em arquivo JSONL — funciona sem rede e é ideal para testes.
pub struct TransporteArquivo {
    pub caminho: PathBuf,
}

impl TransporteArquivo {
    pub fn novo(caminho: &Path) -> Self {
        Self { caminho: caminho.to_path_buf() }
    }

    fn ler(&self) -> AppResult<Vec<MudancaRemota>> {
        if !self.caminho.exists() {
            return Ok(Vec::new());
        }
        let conteudo = fs::read_to_string(&self.caminho)?;
        let mut itens = Vec::new();
        for (indice, linha) in conteudo.lines().enumerate() {
            if linha.trim().is_empty() {
                continue;
            }
            let mudanca: MudancaRemota = serde_json::from_str(linha).map_err(|erro| {
                AppError::Integracao(format!("linha {} do arquivo de sync inválida: {}", indice + 1, erro))
            })?;
            itens.push(mudanca);
        }
        Ok(itens)
    }
}

impl Transporte for TransporteArquivo {
    fn nome(&self) -> &'static str { "Arquivo / LAN" }

    fn enviar(&self, lote: &[Mudanca]) -> AppResult<usize> {
        let mut existentes = self.ler()?;
        let mut enviados = 0;
        for mudanca in lote {
            let remota = para_remota(mudanca);
            let duplicata = existentes.iter().any(|item| {
                item.instalacao_origem == remota.instalacao_origem
                    && item.entidade == remota.entidade
                    && item.entidade_id == remota.entidade_id
                    && item.versao == remota.versao
            });
            if !duplicata {
                existentes.push(remota);
                enviados += 1;
            }
        }
        if let Some(pai) = self.caminho.parent() {
            fs::create_dir_all(pai)?;
        }
        let conteudo = existentes
            .iter()
            .filter_map(|item| serde_json::to_string(item).ok())
            .collect::<Vec<_>>()
            .join("\n");
        fs::write(&self.caminho, if conteudo.is_empty() { String::new() } else { format!("{}\n", conteudo) })?;
        Ok(enviados)
    }

    fn receber(&self, desde: Option<&str>) -> AppResult<Vec<MudancaRemota>> {
        let itens = self.ler()?;
        Ok(match desde {
            Some(cursor) => itens.into_iter().filter(|item| item.criado_em.as_str() > cursor).collect(),
            None => itens,
        })
    }
}

/// Transporte HTTP opcional (TLS), para sincronização entre filiais pela rede.
pub struct TransporteHttp {
    pub url: String,
    pub token: String,
}

impl TransporteHttp {
    pub fn novo(url: &str, token: &str) -> Self {
        Self { url: url.trim_end_matches('/').to_string(), token: token.to_string() }
    }

    fn auth(&self) -> String {
        format!("Bearer {}", self.token)
    }
}

impl Transporte for TransporteHttp {
    fn nome(&self) -> &'static str { "HTTP (nuvem)" }

    fn enviar(&self, lote: &[Mudanca]) -> AppResult<usize> {
        let remotos: Vec<MudancaRemota> = lote.iter().map(para_remota).collect();
        let corpo = serde_json::to_string(&remotos)
            .map_err(|erro| AppError::Integracao(format!("erro ao serializar lote: {}", erro)))?;
        let resposta = ureq::post(&format!("{}/sync", self.url))
            .set("Authorization", &self.auth())
            .set("Content-Type", "application/json")
            .send_string(&corpo)
            .map_err(|erro| AppError::Integracao(format!("envio HTTP falhou: {}", erro)))?;
        let texto = resposta.into_string()
            .map_err(|erro| AppError::Integracao(format!("resposta HTTP inválida: {}", erro)))?;
        let valor: serde_json::Value = serde_json::from_str(&texto).unwrap_or(serde_json::json!({}));
        Ok(valor.get("recebidos").and_then(|v| v.as_u64()).unwrap_or(lote.len() as u64) as usize)
    }

    fn receber(&self, desde: Option<&str>) -> AppResult<Vec<MudancaRemota>> {
        let mut requisicao = ureq::get(&format!("{}/sync", self.url));
        requisicao = requisicao.set("Authorization", &self.auth());
        if let Some(cursor) = desde {
            requisicao = requisicao.query("desde", cursor);
        }
        let texto = requisicao.call()
            .map_err(|erro| AppError::Integracao(format!("recebimento HTTP falhou: {}", erro)))?
            .into_string()
            .map_err(|erro| AppError::Integracao(format!("resposta HTTP inválida: {}", erro)))?;
        serde_json::from_str(&texto)
            .map_err(|erro| AppError::Integracao(format!("JSON de mudanças inválido: {}", erro)))
    }
}

#[cfg(test)]
mod testes {
    use super::*;

    fn mudanca(versao: i64) -> Mudanca {
        Mudanca {
            id: versao, instalacao_origem: "matriz-sp".into(), entidade: "configuracoes".into(),
            entidade_id: 1, versao, operacao: "update".into(),
            payload_json: r#"{"chave":"teste"}"#.into(), processado: false,
            criado_em: format!("2026-11-19T10:0{}:00", versao),
        }
    }

    #[test]
    fn arquivo_e_idempotente() {
        let diretorio = std::env::temp_dir().join(format!("print360_transporte_{}", std::process::id()));
        fs::create_dir_all(&diretorio).unwrap();
        let caminho = diretorio.join("sync.jsonl");
        let transporte = TransporteArquivo::novo(&caminho);

        let lote = vec![mudanca(1), mudanca(2)];
        assert_eq!(transporte.enviar(&lote).unwrap(), 2);
        assert_eq!(transporte.enviar(&lote).unwrap(), 0);
        assert_eq!(transporte.receber(None).unwrap().len(), 2);
        assert_eq!(transporte.receber(Some("2026-11-19T10:01:00")).unwrap().len(), 1);

        fs::remove_dir_all(&diretorio).unwrap();
    }
}
