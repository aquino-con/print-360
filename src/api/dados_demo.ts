/** Dados de demonstração usados quando o app roda no navegador (npm run dev). */
import type {
  Alerta,
  GrupoSuprimento,
  Impressora,
  AtividadeItem,
  ExecucaoRoteamento,
  OrdemServico,
  PrevisaoItem,
  RegraRoteamento,
  RegistroAuditoria,
  MudancaOutbox,
  StatusSync,
  Relatorio,
  SaudeImpressora,
  ResumoDashboard,
  Setor,
  Trabalho,
  UsuarioResumo,
} from "../tipos";

export const resumoDemo: ResumoDashboard = {
  paginas_hoje: 12480,
  custo_mes: 3842.7,
  impressoras_ativas: 18,
  alertas_pendentes: 5,
};

export const impressorasDemo: Impressora[] = [
  { id: 1, nome: "Impressora 01", modelo: "Laser", endereco: "192.0.2.10", status: "pronta", setor: "Tecnologia" , origem: "spooler", ultima_vista: new Date().toISOString() },
  { id: 2, nome: "Impressora 02", modelo: "Multifuncional", endereco: "192.0.2.11", status: "pronta", setor: "Financeiro" , origem: "spooler", ultima_vista: new Date().toISOString() },
  { id: 3, nome: "Impressora 03", modelo: "Jato de tinta", endereco: "192.0.2.12", status: "ocupada", setor: "Marketing" , origem: "spooler", ultima_vista: new Date().toISOString() },
  { id: 4, nome: "Impressora 04", modelo: "Multifuncional", endereco: "192.0.2.13", status: "erro", setor: "Recursos Humanos" , origem: "spooler", ultima_vista: new Date().toISOString() },
  { id: 5, nome: "Impressora 05", modelo: "Laser colorida", endereco: "192.0.2.14", status: "manutencao", setor: "Diretoria" , origem: "spooler", ultima_vista: new Date().toISOString() },
  { id: 6, nome: "Impressora 06", modelo: "Plotter", endereco: "192.0.2.15", status: "offline", setor: "Engenharia" , origem: "spooler", ultima_vista: new Date().toISOString() },
];

export const trabalhosDemo: Trabalho[] = [
  { id: 1, documento: "Relatorio_vendas.pdf", usuario: "Ana Souza", impressora: "Impressora 01", paginas: 12, status: "processando", progresso: 65, criado_em: "2026-11-19T10:12:00" },
  { id: 2, documento: "Contrato_2026.docx", usuario: "Carlos Lima", impressora: "Impressora 02", paginas: 6, status: "concluido", progresso: 100, criado_em: "2026-11-19T10:05:00" },
  { id: 3, documento: "Planilha_estoque.xlsx", usuario: "Juliana Rocha", impressora: "Impressora 03", paginas: 24, status: "processando", progresso: 30, criado_em: "2026-11-19T09:58:00" },
  { id: 4, documento: "Etiquetas_produto.pdf", usuario: "Ricardo Alves", impressora: "Impressora 04", paginas: 48, status: "pausado", progresso: 0, criado_em: "2026-11-19T09:44:00" },
  { id: 5, documento: "Apresentacao_Q4.pptx", usuario: "Marina Costa", impressora: "Impressora 05", paginas: 18, status: "pendente", progresso: 0, criado_em: "2026-11-19T09:40:00" },
  { id: 6, documento: "Fatura_1178.pdf", usuario: "Paulo Mendes", impressora: "Impressora 01", paginas: 3, status: "concluido", progresso: 100, criado_em: "2026-11-19T09:31:00" },
];

const item = (
  id: number,
  impressora_id: number,
  impressora: string,
  tipo: string,
  tipo_rotulo: string,
  nivel: number,
  previsao: number | null
) => ({
  id, impressora_id, impressora, tipo, tipo_rotulo, nivel,
  capacidade: 3000, previsao_dias: previsao, ultima_troca: null,
});

export const gruposSuprimentoDemo: GrupoSuprimento[] = [
  {
    impressora_id: 1, impressora: "Impressora 01", status: "pronta",
    itens: [
      item(1, 1, "Impressora 01", "toner_preto", "Toner preto", 72, 34),
      item(2, 1, "Impressora 01", "papel", "Papel", 85, 12),
    ],
  },
  {
    impressora_id: 3, impressora: "Impressora 03", status: "ocupada",
    itens: [
      item(3, 3, "Impressora 03", "toner_preto", "Toner preto", 18, 3),
      item(4, 3, "Impressora 03", "toner_magenta", "Toner magenta", 42, 11),
      item(5, 3, "Impressora 03", "papel", "Papel", 92, 18),
    ],
  },
  {
    impressora_id: 4, impressora: "Impressora 04", status: "erro",
    itens: [
      item(6, 4, "Impressora 04", "toner_preto", "Toner preto", 9, 1),
      item(7, 4, "Impressora 04", "tambor", "Tambor", 35, 20),
      item(8, 4, "Impressora 04", "papel", "Papel", 0, 0),
    ],
  },
];

export const setoresDemo: Setor[] = [
  { id: 1, nome: "Tecnologia" }, { id: 2, nome: "Financeiro" },
  { id: 3, nome: "Marketing" }, { id: 4, nome: "Recursos Humanos" },
  { id: 5, nome: "Diretoria" }, { id: 6, nome: "Engenharia" },
];

export const usuariosDemo: UsuarioResumo[] = [
  { id: 1, nome: "Ana Souza", email: "ana.souza@empresa.com", setor: "Tecnologia", perfil: "administrador", consumo: 2140, limite: 3000, percentual: 71, status: "dentro_cota" },
  { id: 2, nome: "Carlos Lima", email: "carlos.lima@empresa.com", setor: "Financeiro", perfil: "gestor", consumo: 2860, limite: 3000, percentual: 95, status: "atencao" },
  { id: 3, nome: "Juliana Rocha", email: "juliana.rocha@empresa.com", setor: "Marketing", perfil: "usuario", consumo: 1420, limite: 2000, percentual: 71, status: "dentro_cota" },
  { id: 4, nome: "Ricardo Alves", email: "ricardo.alves@empresa.com", setor: "Recursos Humanos", perfil: "usuario", consumo: 2340, limite: 2000, percentual: 117, status: "acima_cota" },
  { id: 5, nome: "Marina Costa", email: "marina.costa@empresa.com", setor: "Diretoria", perfil: "gestor", consumo: 980, limite: 1500, percentual: 65, status: "dentro_cota" },
  { id: 6, nome: "Paulo Mendes", email: "paulo.mendes@empresa.com", setor: "Tecnologia", perfil: "usuario", consumo: 3120, limite: 3000, percentual: 104, status: "acima_cota" },
  { id: 7, nome: "Fernanda Dias", email: "fernanda.dias@empresa.com", setor: "Engenharia", perfil: "usuario", consumo: 1760, limite: 2500, percentual: 70, status: "dentro_cota" },
  { id: 8, nome: "Bruno Telles", email: "bruno.telles@empresa.com", setor: "Marketing", perfil: "usuario", consumo: 2180, limite: 2000, percentual: 109, status: "acima_cota" },
];

export const alertasDemo: Alerta[] = [
  { id: 1, tipo: "erro_impressora", severidade: "critico", titulo: "Erro na impressora Impressora 04", mensagem: "Bandeja 1 vazia · verifique a fila", impressora: "Impressora 04", resolvido: false, criado_em: "2026-11-19T10:20:00" },
  { id: 2, tipo: "suprimento_baixo", severidade: "critico", titulo: "Nível baixo — Papel (Impressora 04)", mensagem: "Nível atual: 0%", impressora: "Impressora 04", resolvido: false, criado_em: "2026-11-19T10:12:00" },
  { id: 3, tipo: "suprimento_baixo", severidade: "aviso", titulo: "Nível baixo — Toner preto (Impressora 03)", mensagem: "Nível atual: 18%", impressora: "Impressora 03", resolvido: false, criado_em: "2026-11-19T09:58:00" },
  { id: 4, tipo: "cota_excedida", severidade: "aviso", titulo: "Cota excedida — Ricardo Alves", mensagem: "Consumo: 2340 páginas. Limite: 2000 páginas.", impressora: null, resolvido: false, criado_em: "2026-11-19T08:30:00" },
];

export const relatorioDemo: Relatorio = {
  custo_total: 46210.8,
  paginas: 148320,
  custo_por_pagina: 0.31,
  economia_percentual: -8.4,
  evolucao: [
    { nome: "Jan", valor: 3200 }, { nome: "Fev", valor: 3600 }, { nome: "Mar", valor: 3100 },
    { nome: "Abr", valor: 4000 }, { nome: "Mai", valor: 3800 }, { nome: "Jun", valor: 4200 },
    { nome: "Jul", valor: 3900 }, { nome: "Ago", valor: 4400 }, { nome: "Set", valor: 4100 },
    { nome: "Out", valor: 3700 }, { nome: "Nov", valor: 3500 }, { nome: "Dez", valor: 3300 },
  ],
  setores: [
    { nome: "Tecnologia", valor: 15711 }, { nome: "Financeiro", valor: 11091 },
    { nome: "Marketing", valor: 8800 }, { nome: "Recursos Humanos", valor: 6007 },
    { nome: "Outros", valor: 4601 },
  ],
  impressoras: [
    { nome: "Impressora 01", setor: "Tecnologia", paginas: 42180, custo: 12480.2, variacao: -4.2, participacao: 48 },
    { nome: "Impressora 02", setor: "Financeiro", paginas: 38420, custo: 11210.5, variacao: 2.1, participacao: 39 },
    { nome: "Impressora 03", setor: "Marketing", paginas: 31760, custo: 9840.1, variacao: -6.8, participacao: 32 },
  ],
};

export const auditoriaDemo: RegistroAuditoria[] = [
  { id: 5, usuario: "Ana Souza", acao: "alterar_configuracoes", entidade: "configuracao", entidade_id: null, detalhe: "4 chaves alteradas", registro_em: "2026-11-19T14:10:00" },
  { id: 4, usuario: "Ana Souza", acao: "alterar_cota", entidade: "usuario", entidade_id: 4, detalhe: "Limite: 5000", registro_em: "2026-11-19T13:42:00" },
  { id: 3, usuario: "Ana Souza", acao: "registrar_troca", entidade: "suprimento", entidade_id: 1, detalhe: "toner_preto por Ana Souza", registro_em: "2026-11-19T11:20:00" },
  { id: 2, usuario: "Ana Souza", acao: "pausar_trabalho", entidade: "trabalho", entidade_id: 1, detalhe: "Impressora 01", registro_em: "2026-11-19T10:30:00" },
  { id: 1, usuario: "Ana Souza", acao: "cadastrar_impressora", entidade: "impressora", entidade_id: 7, detalhe: "Impressora 07", registro_em: "2026-11-19T09:15:00" },
];

export const saudeDemo: SaudeImpressora[] = [
  {
    impressora_id: 1, nome: "Impressora 01", status: "pronta", pontuacao: 88,
    classificacao: "excelente", confianca: 0.9, calculado_em: new Date().toISOString(),
    fatores: [
      { nome: "Erros recentes", valor: 0, peso: 0.3, contribuicao: 0, descricao: "erros nos últimos 7 dias" },
      { nome: "Desgaste do tambor", valor: 0.28, peso: 0.2, contribuicao: 6, descricao: "desgaste estimado" },
      { nome: "Volume", valor: 0.42, peso: 0.1, contribuicao: 4, descricao: "páginas no mês" },
      { nome: "Suprimentos", valor: 0.15, peso: 0.12, contribuicao: 2, descricao: "menor nível" },
    ],
  },
  {
    impressora_id: 2, nome: "Impressora 02", status: "pronta", pontuacao: 79,
    classificacao: "bom", confianca: 0.85, calculado_em: new Date().toISOString(),
    fatores: [
      { nome: "Erros recentes", valor: 0.125, peso: 0.3, contribuicao: 4, descricao: "1 erro em 7 dias" },
      { nome: "Desgaste do tambor", valor: 0.42, peso: 0.2, contribuicao: 8, descricao: "desgaste estimado" },
      { nome: "Volume", valor: 0.55, peso: 0.1, contribuicao: 6, descricao: "páginas no mês" },
      { nome: "Suprimentos", valor: 0.36, peso: 0.12, contribuicao: 4, descricao: "menor nível" },
    ],
  },
  {
    impressora_id: 3, nome: "Impressora 03", status: "ocupada", pontuacao: 64,
    classificacao: "atencao", confianca: 0.82, calculado_em: new Date().toISOString(),
    fatores: [
      { nome: "Erros recentes", valor: 0.25, peso: 0.3, contribuicao: 8, descricao: "2 erros em 7 dias" },
      { nome: "Desgaste do tambor", valor: 0.58, peso: 0.2, contribuicao: 12, descricao: "desgaste estimado" },
      { nome: "Suprimentos", valor: 0.82, peso: 0.12, contribuicao: 10, descricao: "toner 18%" },
      { nome: "Volume", valor: 0.48, peso: 0.1, contribuicao: 5, descricao: "páginas no mês" },
    ],
  },
  {
    impressora_id: 4, nome: "Impressora 04", status: "erro", pontuacao: 38,
    classificacao: "critico", confianca: 0.91, calculado_em: new Date().toISOString(),
    fatores: [
      { nome: "Erros recentes", valor: 0.875, peso: 0.3, contribuicao: 26, descricao: "7 erros em 7 dias" },
      { nome: "Desgaste do tambor", valor: 0.82, peso: 0.2, contribuicao: 16, descricao: "desgaste 82%" },
      { nome: "Erros no mês", valor: 0.65, peso: 0.15, contribuicao: 10, descricao: "13 erros em 30 dias" },
      { nome: "Suprimentos", valor: 1, peso: 0.12, contribuicao: 12, descricao: "papel esgotado" },
    ],
  },
  {
    impressora_id: 5, nome: "Impressora 05", status: "manutencao", pontuacao: 57,
    classificacao: "atencao", confianca: 0.78, calculado_em: new Date().toISOString(),
    fatores: [
      { nome: "Erros recentes", valor: 0.25, peso: 0.3, contribuicao: 8, descricao: "2 erros em 7 dias" },
      { nome: "Desgaste do tambor", valor: 0.59, peso: 0.2, contribuicao: 12, descricao: "desgaste estimado" },
      { nome: "Manutenção", valor: 0.7, peso: 0.05, contribuicao: 4, descricao: "63 dias sem manutenção" },
      { nome: "Idade", valor: 0.5, peso: 0.08, contribuicao: 4, descricao: "5 anos" },
    ],
  },
];

export const previsoesDemo: PrevisaoItem[] = [
  { id: 1, impressora_id: 4, impressora: "Impressora 04", componente: "Tambor", dias_previstos: 3, probabilidade: 0.87, confianca: "alta", fatores: ["desgaste 82%", "7 erros em 7 dias"], resolvida: false },
  { id: 2, impressora_id: 3, impressora: "Impressora 03", componente: "Toner preto", dias_previstos: 9, probabilidade: 0.72, confianca: "média", fatores: ["nível 18%", "volume 42k pág."], resolvida: false },
  { id: 3, impressora_id: 5, impressora: "Impressora 05", componente: "Fusor", dias_previstos: 21, probabilidade: 0.64, confianca: "média", fatores: ["volume alto", "5 anos"], resolvida: false },
  { id: 4, impressora_id: 2, impressora: "Impressora 02", componente: "Bandeja 2", dias_previstos: 45, probabilidade: 0.41, confianca: "baixa", fatores: ["poucos sinais"], resolvida: false },
];

export const ordensDemo: OrdemServico[] = [
  { id: 1042, impressora_id: 4, impressora: "Impressora 04", titulo: "Troca de tambor", prioridade: "critica", status: "agendada", responsavel: "Ricardo Alves", data_prevista: "2026-11-22", custo_estimado: 480, criada_em: "2026-11-19T10:20:00" },
  { id: 1041, impressora_id: 3, impressora: "Impressora 03", titulo: "Reposição de toner", prioridade: "alta", status: "planejada", responsavel: "Ana Souza", data_prevista: "2026-11-28", custo_estimado: 120, criada_em: "2026-11-18T15:10:00" },
];

export const regrasDemo: RegraRoteamento[] = [
  {
    id: 1, nome: "Documentos urgentes do Financeiro", prioridade: 1, ativa: true,
    criada_em: "2026-11-19T09:00:00",
    condicoes: [
      { campo: "setor", operador: "igual", valor: "Financeiro" },
      { campo: "urgencia", operador: "igual", valor: "alta" },
    ],
    acao: { impressora: "Impressora 05", grupo: [], criterio: "disponibilidade", fallback: "Impressora 01" },
  },
  {
    id: 2, nome: "Colorido — Marketing", prioridade: 2, ativa: true,
    criada_em: "2026-11-19T09:05:00",
    condicoes: [
      { campo: "setor", operador: "igual", valor: "Marketing" },
      { campo: "cor", operador: "igual", valor: "cor" },
    ],
    acao: { impressora: null, grupo: ["Impressora 03", "Impressora 05"], criterio: "menor_custo", fallback: null },
  },
  {
    id: 3, nome: "Grandes volumes (> 50 páginas)", prioridade: 3, ativa: false,
    criada_em: "2026-11-19T09:10:00",
    condicoes: [{ campo: "paginas", operador: "maior_que", valor: "50" }],
    acao: { impressora: "Impressora 01", grupo: [], criterio: "menor_carga", fallback: null },
  },
];

export const execucoesDemo: ExecucaoRoteamento[] = [
  { id: 1, trabalho_id: 2, regra_id: 1, regra_nome: "Documentos urgentes do Financeiro", impressora: "Impressora 05", justificativa: ["Regra aplicada: Documentos urgentes do Financeiro", "Critério de escolha: disponibilidade", "Destino Impressora 05 com status pronta e 2 trabalho(s) na fila"], decidido_em: "2026-11-19T10:05:00" },
  { id: 2, trabalho_id: 3, regra_id: 2, regra_nome: "Colorido — Marketing", impressora: "Impressora 03", justificativa: ["Regra aplicada: Colorido — Marketing", "Critério de escolha: menor_custo"], decidido_em: "2026-11-19T09:58:00" },
];

export const simulacaoDemo = {
  documento: "Relatorio_financeiro_dez.pdf",
  destino: "Impressora 05",
  regra_aplicada: "Documentos urgentes do Financeiro",
  justificativa: [
    "Regra aplicada: Documentos urgentes do Financeiro",
    "Critério de escolha: disponibilidade",
    "Destino Impressora 05 com status pronta e 2 trabalho(s) na fila",
  ],
  criterio: "disponibilidade",
  candidatos_avaliados: 6,
  fallback_usado: false,
};

export const statusSyncDemo: StatusSync = {
  ativa: false,
  instalacao_id: "matriz-sp",
  pendencias: 18,
  conflitos_pendentes: 2,
  instalacoes: [
    { id: "matriz-sp", nome: "Matriz — São Paulo", site: "SP", status: "ativo", ultima_sincronizacao: new Date().toISOString(), criada_em: "2026-11-01T09:00:00" },
    { id: "filial-campinas", nome: "Filial 01", site: "SP", status: "ativo", ultima_sincronizacao: new Date().toISOString(), criada_em: "2026-11-02T09:00:00" },
    { id: "filial-rio", nome: "Filial 02", site: "RJ", status: "ativo", ultima_sincronizacao: "2026-11-19T10:12:00", criada_em: "2026-11-03T09:00:00" },
    { id: "filial-bh", nome: "Filial 03", site: "MG", status: "ativo", ultima_sincronizacao: new Date().toISOString(), criada_em: "2026-11-04T09:00:00" },
    { id: "filial-curitiba", nome: "Filial 04", site: "PR", status: "ativo", ultima_sincronizacao: "2026-11-19T09:50:00", criada_em: "2026-11-05T09:00:00" },
  ],
  ciclos: [
    { id: 12, instalacao_id: "matriz-sp", direcao: "recebimento", itens: 112, duracao_ms: 1800, status: "sucesso", detalhe: "112 aplicadas", realizada_em: "2026-11-19T10:30:00" },
    { id: 11, instalacao_id: "matriz-sp", direcao: "envio", itens: 112, duracao_ms: 1800, status: "sucesso", detalhe: "112 enviados", realizada_em: "2026-11-19T10:30:00" },
    { id: 10, instalacao_id: "filial-rio", direcao: "recebimento", itens: 8, duracao_ms: 5200, status: "parcial", detalhe: "timeout parcial", realizada_em: "2026-11-19T10:12:00" },
  ],
  conflitos: [
    { id: 1, entidade: "cotas", entidade_id: 12, versao_local_json: '{"versao":6,"origem":"matriz-sp"}', versao_remota_json: '{"versao":7,"origem":"filial-rio"}', estado: "pendente", detectado_em: "2026-11-19T10:12:00" },
    { id: 2, entidade: "regras_roteamento", entidade_id: 3, versao_local_json: '{"versao":2,"origem":"matriz-sp"}', versao_remota_json: '{"versao":3,"origem":"filial-curitiba"}', estado: "pendente", detectado_em: "2026-11-19T09:50:00" },
  ],
};

export const atividadeDemo: AtividadeItem[] = [
  { tipo: "trabalho", titulo: "Trabalho concluído — documento-01.pdf", detalhe: "Impressora 01 · 12 páginas", ocorrido_em: new Date(Date.now() - 3 * 60000).toISOString() },
  { tipo: "trabalho", titulo: "Novo trabalho na fila — documento-02.docx", detalhe: "Impressora 02 · 6 páginas", ocorrido_em: new Date(Date.now() - 8 * 60000).toISOString() },
  { tipo: "alerta", titulo: "Falha de impressão — documento-03.pdf", detalhe: "Impressora 04 · bandeja vazia", ocorrido_em: new Date(Date.now() - 21 * 60000).toISOString() },
  { tipo: "manutencao", titulo: "Manutenção registrada — Troca de toner", detalhe: "Impressora 03", ocorrido_em: new Date(Date.now() - 60 * 60000).toISOString() },
];

export const outboxDemo: MudancaOutbox[] = [
  { id: 1, instalacao_origem: "matriz-sp", entidade: "cotas", entidade_id: 12, versao: 7, operacao: "update", payload_json: "{}", processado: false, criado_em: "2026-11-19T10:12:00" },
  { id: 2, instalacao_origem: "matriz-sp", entidade: "regras_roteamento", entidade_id: 3, versao: 1, operacao: "insert", payload_json: "{}", processado: false, criado_em: "2026-11-19T09:58:00" },
  { id: 3, instalacao_origem: "matriz-sp", entidade: "configuracoes", entidade_id: 0, versao: 4, operacao: "update", payload_json: "{}", processado: false, criado_em: "2026-11-19T09:40:00" },
];

export const resultadoSyncDemo = {
  enviados: 18, recebidos: 12, conflitos: 0, duracao_ms: 1840, transporte: "Arquivo / LAN",
};

export const configuracoesDemo: Record<string, string> = {
  idioma: "pt-BR",
  tema: "claro",
  formato_data: "DD/MM/AAAA",
  atualizacao_automatica: "true",
  custo_pagina_preto: "0.25",
  custo_pagina_cor: "0.85",
  moeda: "BRL",
  margem_manutencao: "10",
  notificacoes: "true",
  alertas_suprimento: "true",
  limite_nivel_baixo: "20",
  alertas_cota: "false",
  descoberta_automatica: "true",
  descoberta_rede_ativa: "false",
  descoberta_rede_alvos: "",
  ultima_descoberta: new Date().toISOString(),
};
