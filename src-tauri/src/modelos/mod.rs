use serde::Serialize;

use crate::predicao::modelo::Sinal;
use crate::roteamento::regra::Regra;

/// DTO de impressora enviado ao frontend.
#[derive(Debug, Clone, Serialize)]
pub struct Impressora {
    pub id: i64,
    pub nome: String,
    pub modelo: Option<String>,
    pub endereco: Option<String>,
    pub status: String,
    pub setor: Option<String>,
}

/// DTO de trabalho da fila enviado ao frontend.
#[derive(Debug, Clone, Serialize)]
pub struct Trabalho {
    pub id: i64,
    pub documento: String,
    pub usuario: Option<String>,
    pub impressora: String,
    pub paginas: i64,
    pub status: String,
    pub progresso: i64,
    pub criado_em: String,
}

/// Indicadores do dashboard.
#[derive(Debug, Clone, Serialize)]
pub struct ResumoDashboard {
    pub paginas_hoje: i64,
    pub custo_mes: f64,
    pub impressoras_ativas: i64,
    pub alertas_pendentes: i64,
}

/// Um item de suprimento com previsão calculada.
#[derive(Debug, Clone, Serialize)]
pub struct Suprimento {
    pub id: i64,
    pub impressora_id: i64,
    pub impressora: String,
    pub tipo: String,
    pub tipo_rotulo: String,
    pub nivel: i64,
    pub capacidade: Option<i64>,
    pub previsao_dias: Option<i64>,
    pub ultima_troca: Option<String>,
}

/// Suprimentos agrupados por impressora.
#[derive(Debug, Clone, Serialize)]
pub struct GrupoSuprimento {
    pub impressora_id: i64,
    pub impressora: String,
    pub status: String,
    pub itens: Vec<Suprimento>,
}

/// Resumo de usuário com uso de cota.
#[derive(Debug, Clone, Serialize)]
pub struct UsuarioResumo {
    pub id: i64,
    pub nome: String,
    pub email: Option<String>,
    pub setor: Option<String>,
    pub perfil: String,
    pub consumo: i64,
    pub limite: i64,
    pub percentual: i64,
    pub status: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct Setor {
    pub id: i64,
    pub nome: String,
}

/// Alerta da central.
#[derive(Debug, Clone, Serialize)]
pub struct Alerta {
    pub id: i64,
    pub tipo: String,
    pub severidade: String,
    pub titulo: String,
    pub mensagem: Option<String>,
    pub impressora: Option<String>,
    pub resolvido: bool,
    pub criado_em: String,
}

/// Resumo de trabalho para a ficha da impressora.
#[derive(Debug, Clone, Serialize)]
pub struct TrabalhoResumo {
    pub id: i64,
    pub documento: String,
    pub usuario: String,
    pub paginas: i64,
    pub status: String,
    pub criado_em: String,
}

/// Resumo de manutenção para a ficha da impressora.
#[derive(Debug, Clone, Serialize)]
pub struct ManutencaoResumo {
    pub id: i64,
    pub titulo: String,
    pub tipo: String,
    pub responsavel: String,
    pub data_prevista: String,
    pub status: String,
    pub custo_estimado: f64,
}

/// Ficha técnica completa de uma impressora.
#[derive(Debug, Clone, Serialize)]
pub struct DetalhesImpressora {
    pub impressora_id: i64,
    pub nome: String,
    pub modelo: Option<String>,
    pub numero_serie: Option<String>,
    pub firmware: Option<String>,
    pub endereco: Option<String>,
    pub localizacao: Option<String>,
    pub setor: Option<String>,
    pub status: String,
    pub origem: String,
    pub ultima_vista: Option<String>,
    pub trabalhos: Vec<TrabalhoResumo>,
    pub alertas: Vec<Alerta>,
    pub manutencoes: Vec<ManutencaoResumo>,
    pub suprimentos: Vec<Suprimento>,
}

/// Item do feed de atividade recente.
#[derive(Debug, Clone, Serialize)]
pub struct AtividadeItem {
    pub tipo: String,
    pub titulo: String,
    pub detalhe: String,
    pub ocorrido_em: String,
}

/// Saúde de uma impressora, pronta para o frontend.
#[derive(Debug, Clone, Serialize)]
pub struct SaudeImpressora {
    pub impressora_id: i64,
    pub nome: String,
    pub status: String,
    pub pontuacao: i64,
    pub classificacao: String,
    pub confianca: f64,
    pub fatores: Vec<Sinal>,
    pub calculado_em: String,
}

/// Previsão de falha persistida, pronta para o frontend.
#[derive(Debug, Clone, Serialize)]
pub struct PrevisaoItem {
    pub id: i64,
    pub impressora_id: i64,
    pub impressora: String,
    pub componente: String,
    pub dias_previstos: i64,
    pub probabilidade: f64,
    pub confianca: String,
    pub fatores: Vec<String>,
    pub resolvida: bool,
}

/// Resultado de uma simulação de roteamento (dry-run).
#[derive(Debug, Clone, Serialize)]
pub struct Simulacao {
    pub documento: String,
    pub destino: String,
    pub regra_aplicada: Option<String>,
    pub justificativa: Vec<String>,
    pub criterio: String,
    pub candidatos_avaliados: usize,
    pub fallback_usado: bool,
}

/// Decisão de roteamento registrada para um trabalho.
#[derive(Debug, Clone, Serialize)]
pub struct ExecucaoRoteamento {
    pub id: i64,
    pub trabalho_id: i64,
    pub regra_id: Option<i64>,
    pub regra_nome: Option<String>,
    pub impressora: String,
    pub justificativa: Vec<String>,
    pub decidido_em: String,
}

/// Regras exportadas para o frontend (alias legível).
pub type RegraRoteamento = Regra;

/// Ordem de serviço gerada a partir de uma previsão.
#[derive(Debug, Clone, Serialize)]
pub struct OrdemServico {
    pub id: i64,
    pub impressora_id: i64,
    pub impressora: String,
    pub titulo: String,
    pub prioridade: String,
    pub status: String,
    pub responsavel: Option<String>,
    pub data_prevista: Option<String>,
    pub custo_estimado: Option<f64>,
    pub criada_em: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct RegistroAuditoria {
    pub id: i64,
    pub usuario: String,
    pub acao: String,
    pub entidade: String,
    pub entidade_id: Option<i64>,
    pub detalhe: Option<String>,
    pub registro_em: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct Ponto {
    pub nome: String,
    pub valor: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct LinhaCusto {
    pub nome: String,
    pub setor: String,
    pub paginas: i64,
    pub custo: f64,
    pub variacao: f64,
    pub participacao: i64,
}

/// Dados completos do relatório gerencial.
#[derive(Debug, Clone, Serialize)]
pub struct Relatorio {
    pub custo_total: f64,
    pub paginas: i64,
    pub custo_por_pagina: f64,
    pub economia_percentual: f64,
    pub evolucao: Vec<Ponto>,
    pub setores: Vec<Ponto>,
    pub impressoras: Vec<LinhaCusto>,
}
