use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize)]
pub struct Instalacao {
    pub id: String,
    pub nome: String,
    pub site: Option<String>,
    pub status: String,
    pub ultima_sincronizacao: Option<String>,
    pub criada_em: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Mudanca {
    pub id: i64,
    pub instalacao_origem: String,
    pub entidade: String,
    pub entidade_id: i64,
    pub versao: i64,
    pub operacao: String,
    pub payload_json: String,
    pub processado: bool,
    pub criado_em: String,
}

/// Mudança recebida de outra instalação (sem id local).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MudancaRemota {
    pub instalacao_origem: String,
    pub entidade: String,
    pub entidade_id: i64,
    pub versao: i64,
    pub operacao: String,
    pub payload_json: String,
    pub criado_em: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct CicloSync {
    pub id: i64,
    pub instalacao_id: String,
    pub direcao: String,
    pub itens: i64,
    pub duracao_ms: i64,
    pub status: String,
    pub detalhe: Option<String>,
    pub realizada_em: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct Conflito {
    pub id: i64,
    pub entidade: String,
    pub entidade_id: i64,
    pub versao_local_json: String,
    pub versao_remota_json: String,
    pub estado: String,
    pub detectado_em: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct ResultadoSync {
    pub enviados: usize,
    pub recebidos: usize,
    pub conflitos: usize,
    pub duracao_ms: i64,
    pub transporte: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct StatusSync {
    pub ativa: bool,
    pub instalacao_id: String,
    pub instalacoes: Vec<Instalacao>,
    pub pendencias: usize,
    pub conflitos_pendentes: usize,
    pub ciclos: Vec<CicloSync>,
    pub conflitos: Vec<Conflito>,
}
