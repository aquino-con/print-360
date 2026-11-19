use serde::{Deserialize, Serialize};

/// Condição de uma regra de roteamento (RF2-007).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Condicao {
    pub campo: String,
    pub operador: String,
    pub valor: String,
}

/// Ação de uma regra: destino, critério de escolha e fallback (RF2-007/RF2-012).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Acao {
    #[serde(default)]
    pub impressora: Option<String>,
    #[serde(default)]
    pub grupo: Vec<String>,
    #[serde(default = "criterio_padrao")]
    pub criterio: String,
    #[serde(default)]
    pub fallback: Option<String>,
}

fn criterio_padrao() -> String {
    "disponibilidade".to_string()
}

/// Regra persistida.
#[derive(Debug, Clone, Serialize)]
pub struct Regra {
    pub id: i64,
    pub nome: String,
    pub prioridade: i64,
    pub condicoes: Vec<Condicao>,
    pub acao: Acao,
    pub ativa: bool,
    pub criada_em: String,
}

/// Contexto de um trabalho a ser roteado.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Contexto {
    #[serde(default)]
    pub documento: String,
    #[serde(default)]
    pub setor: Option<String>,
    #[serde(default)]
    pub paginas: i64,
    #[serde(default = "cor_padrao")]
    pub cor: String,
    #[serde(default = "urgencia_padrao")]
    pub urgencia: String,
    #[serde(default)]
    pub tamanho_bytes: Option<i64>,
}

fn cor_padrao() -> String { "pb".to_string() }
fn urgencia_padrao() -> String { "normal".to_string() }

/// Impressora candidata com dados para aplicar os critérios de escolha.
#[derive(Debug, Clone, Serialize)]
pub struct Candidato {
    pub nome: String,
    pub setor: Option<String>,
    pub status: String,
    pub carga: i64,
    pub custo_pagina: f64,
    pub nivel_suprimento: i64,
}

impl Candidato {
    /// Impressoras em estado operacional podem receber trabalhos.
    pub fn disponivel(&self) -> bool {
        matches!(self.status.as_str(), "pronta" | "ocupada")
    }
}

/// Decisão tomada pelo motor, sempre acompanhada de justificativa (RF2-011).
#[derive(Debug, Clone, Serialize)]
pub struct Decisao {
    pub regra_id: Option<i64>,
    pub regra_nome: Option<String>,
    pub impressora: String,
    pub criterio: String,
    pub justificativa: Vec<String>,
    pub fallback_usado: bool,
    pub candidatos_avaliados: usize,
}
