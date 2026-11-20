/** Tipos compartilhados entre o frontend e os comandos Rust. */

export interface Impressora {
  id: number;
  nome: string;
  modelo: string | null;
  endereco: string | null;
  status: string;
  setor: string | null;
}

export interface Trabalho {
  id: number;
  documento: string;
  usuario: string | null;
  impressora: string;
  paginas: number;
  status: string;
  progresso: number;
  criado_em: string;
}

export interface ResumoDashboard {
  paginas_hoje: number;
  custo_mes: number;
  impressoras_ativas: number;
  alertas_pendentes: number;
}

export interface Suprimento {
  id: number;
  impressora_id: number;
  impressora: string;
  tipo: string;
  tipo_rotulo: string;
  nivel: number;
  capacidade: number | null;
  previsao_dias: number | null;
  ultima_troca: string | null;
}

export interface GrupoSuprimento {
  impressora_id: number;
  impressora: string;
  status: string;
  itens: Suprimento[];
}

export interface UsuarioResumo {
  id: number;
  nome: string;
  email: string | null;
  setor: string;
  perfil: string;
  consumo: number;
  limite: number;
  percentual: number;
  status: string;
}

export interface Setor {
  id: number;
  nome: string;
}

export interface Alerta {
  id: number;
  tipo: string;
  severidade: string;
  titulo: string;
  mensagem: string | null;
  impressora: string | null;
  resolvido: boolean;
  criado_em: string;
}

export interface Ponto {
  nome: string;
  valor: number;
}

export interface LinhaCusto {
  nome: string;
  setor: string;
  paginas: number;
  custo: number;
  variacao: number;
  participacao: number;
}

export interface Relatorio {
  custo_total: number;
  paginas: number;
  custo_por_pagina: number;
  economia_percentual: number;
  evolucao: Ponto[];
  setores: Ponto[];
  impressoras: LinhaCusto[];
}

export interface RegistroAuditoria {
  id: number;
  usuario: string;
  acao: string;
  entidade: string;
  entidade_id: number | null;
  detalhe: string | null;
  registro_em: string;
}

export interface TrabalhoResumo {
  id: number;
  documento: string;
  usuario: string;
  paginas: number;
  status: string;
  criado_em: string;
}

export interface ManutencaoResumo {
  id: number;
  titulo: string;
  tipo: string;
  responsavel: string;
  data_prevista: string;
  status: string;
  custo_estimado: number;
}

export interface DetalhesImpressora {
  impressora_id: number;
  nome: string;
  modelo: string | null;
  numero_serie: string | null;
  firmware: string | null;
  endereco: string | null;
  localizacao: string | null;
  setor: string | null;
  status: string;
  origem: string;
  ultima_vista: string | null;
  trabalhos: TrabalhoResumo[];
  alertas: Alerta[];
  manutencoes: ManutencaoResumo[];
  suprimentos: Suprimento[];
}

export interface AtividadeItem {
  tipo: string;
  titulo: string;
  detalhe: string;
  ocorrido_em: string;
}

export interface MudancaOutbox {
  id: number;
  instalacao_origem: string;
  entidade: string;
  entidade_id: number;
  versao: number;
  operacao: string;
  payload_json: string;
  processado: boolean;
  criado_em: string;
}

export interface Sinal {
  nome: string;
  valor: number;
  peso: number;
  contribuicao: number;
  descricao: string;
}

export interface SaudeImpressora {
  impressora_id: number;
  nome: string;
  status: string;
  pontuacao: number;
  classificacao: string;
  confianca: number;
  fatores: Sinal[];
  calculado_em: string;
}

export interface PrevisaoItem {
  id: number;
  impressora_id: number;
  impressora: string;
  componente: string;
  dias_previstos: number;
  probabilidade: number;
  confianca: string;
  fatores: string[];
  resolvida: boolean;
}

export interface OrdemServico {
  id: number;
  impressora_id: number;
  impressora: string;
  titulo: string;
  prioridade: string;
  status: string;
  responsavel: string | null;
  data_prevista: string | null;
  custo_estimado: number | null;
  criada_em: string;
}

export interface Condicao {
  campo: string;
  operador: string;
  valor: string;
}

export interface AcaoRegra {
  impressora?: string | null;
  grupo: string[];
  criterio: string;
  fallback?: string | null;
}

export interface RegraRoteamento {
  id: number;
  nome: string;
  prioridade: number;
  condicoes: Condicao[];
  acao: AcaoRegra;
  ativa: boolean;
  criada_em: string;
}

export interface ContextoSimulacao {
  documento: string;
  setor?: string | null;
  paginas: number;
  cor: string;
  urgencia: string;
  tamanho_bytes?: number | null;
}

export interface Simulacao {
  documento: string;
  destino: string;
  regra_aplicada: string | null;
  justificativa: string[];
  criterio: string;
  candidatos_avaliados: number;
  fallback_usado: boolean;
}

export interface ExecucaoRoteamento {
  id: number;
  trabalho_id: number;
  regra_id: number | null;
  regra_nome: string | null;
  impressora: string;
  justificativa: string[];
  decidido_em: string;
}

export interface Instalacao {
  id: string;
  nome: string;
  site: string | null;
  status: string;
  ultima_sincronizacao: string | null;
  criada_em: string;
}

export interface CicloSync {
  id: number;
  instalacao_id: string;
  direcao: string;
  itens: number;
  duracao_ms: number;
  status: string;
  detalhe: string | null;
  realizada_em: string;
}

export interface Conflito {
  id: number;
  entidade: string;
  entidade_id: number;
  versao_local_json: string;
  versao_remota_json: string;
  estado: string;
  detectado_em: string;
}

export interface ResultadoSync {
  enviados: number;
  recebidos: number;
  conflitos: number;
  duracao_ms: number;
  transporte: string;
}

export interface StatusSync {
  ativa: boolean;
  instalacao_id: string;
  instalacoes: Instalacao[];
  pendencias: number;
  conflitos_pendentes: number;
  ciclos: CicloSync[];
  conflitos: Conflito[];
}

export type Tela =
  | "visao-geral"
  | "fila"
  | "impressoras"
  | "suprimentos"
  | "relatorios"
  | "usuarios"
  | "configuracoes"
  | "manutencao"
  | "saude-dispositivo"
  | "roteamento"
  | "sincronizacao"
  | "config-avancada";
