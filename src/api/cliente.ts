import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import type {
  Alerta,
  GrupoSuprimento,
  AcaoRegra,
  AtividadeItem,
  Condicao,
  ContextoSimulacao,
  DetalhesImpressora,
  ExecucaoRoteamento,
  Impressora,
  MudancaOutbox,
  OrdemServico,
  RegraRoteamento,
  PrevisaoItem,
  ResultadoDescoberta,
  ResultadoSync,
  StatusSync,
  RegistroAuditoria,
  Relatorio,
  ResumoDashboard,
  SaudeImpressora,
  Setor,
  Simulacao,
  Trabalho,
  UsuarioResumo,
} from "../tipos";
import {
  alertasDemo,
  atividadeDemo,
  auditoriaDemo,
  configuracoesDemo,
  gruposSuprimentoDemo,
  impressorasDemo,
  ordensDemo,
  outboxDemo,
  previsoesDemo,
  relatorioDemo,
  regrasDemo,
  execucoesDemo,
  simulacaoDemo,
  statusSyncDemo,
  resultadoSyncDemo,
  saudeDemo,
  resumoDemo,
  setoresDemo,
  trabalhosDemo,
  usuariosDemo,
} from "./dados_demo";

/** Detecta se está rodando dentro do shell Tauri ou no navegador. */
export const DENTRO_TAURI = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

const RESPOSTAS_DEMO: Record<string, unknown> = {
  listar_impressoras: impressorasDemo,
  listar_trabalhos: trabalhosDemo,
  obter_resumo_dashboard: resumoDemo,
  obter_configuracoes: configuracoesDemo,
  listar_suprimentos: gruposSuprimentoDemo,
  listar_usuarios: usuariosDemo,
  listar_setores: setoresDemo,
  listar_alertas: alertasDemo,
  obter_relatorio: relatorioDemo,
  listar_auditoria: auditoriaDemo,
  obter_saude_frota: saudeDemo,
  obter_previsoes: previsoesDemo,
  listar_ordens_servico: ordensDemo,
  listar_regras: regrasDemo,
  listar_decisoes_roteamento: execucoesDemo,
  simular_roteamento: simulacaoDemo,
  obter_atividade_recente: atividadeDemo,
  listar_outbox: outboxDemo,
  obter_status_sync: statusSyncDemo,
  sincronizar_agora: resultadoSyncDemo,
};

/** Ações simuladas no navegador, para validar a interface sem o shell Tauri. */
const ACOES_DEMO: Record<string, (args: Record<string, unknown>) => void> = {
  pausar_trabalho: ({ id }) => alterarTrabalho(Number(id), "pausado"),
  retomar_trabalho: ({ id }) => alterarTrabalho(Number(id), "processando"),
  cancelar_trabalho: ({ id }) => alterarTrabalho(Number(id), "cancelado"),
  reiniciar_trabalho: ({ id }) => alterarTrabalho(Number(id), "processando"),
  limpar_fila_impressora: ({ nome }) => {
    trabalhosDemo.filter((t) => t.impressora === nome).forEach((t) => {
      t.status = "cancelado";
      t.progresso = 0;
    });
  },
  pausar_impressora: ({ nome }) => alterarImpressora(String(nome), "pausada"),
  retomar_impressora: ({ nome }) => alterarImpressora(String(nome), "pronta"),
  adicionar_impressora: ({ nome, endereco, setor }) => {
    impressorasDemo.push({
      id: Date.now(), nome: String(nome), modelo: null,
      endereco: endereco ? String(endereco) : null,
      status: "desconhecido", setor: setor ? String(setor) : null,
      origem: "manual", ultima_vista: null,
    });
  },
  registrar_troca_suprimento: ({ impressora_id, tipo }) => {
    gruposSuprimentoDemo
      .find((grupo) => grupo.impressora_id === Number(impressora_id))
      ?.itens.filter((item) => item.tipo === tipo)
      .forEach((item) => { item.nivel = 100; item.previsao_dias = 30; });
  },
  salvar_cota: ({ usuario_id, limite_paginas }) => {
    const usuario = usuariosDemo.find((u) => u.id === Number(usuario_id));
    if (usuario) {
      usuario.limite = Number(limite_paginas);
      usuario.percentual = usuario.limite > 0 ? Math.round((usuario.consumo / usuario.limite) * 100) : 0;
    }
  },
  adicionar_usuario: ({ nome, login, email, setor, perfil }) => {
    usuariosDemo.push({
      id: Date.now(), nome: String(nome), email: email ? String(email) : null,
      setor: setor ? String(setor) : "Não informado", perfil: String(perfil),
      consumo: 0, limite: 0, percentual: 0, status: "sem_cota",
    });
    void login;
  },
  resolver_alerta: ({ id }) => {
    const alerta = alertasDemo.find((item) => item.id === Number(id));
    if (alerta) alerta.resolvido = true;
  },
  salvar_parametros_custo: ({ preto, cor }) => {
    configuracoesDemo.custo_pagina_preto = String(preto);
    configuracoesDemo.custo_pagina_cor = String(cor);
  },
  criar_ordem_servico: ({ previsao_id, titulo, responsavel }) => {
    const previsao = previsoesDemo.find((item) => item.id === Number(previsao_id));
    if (previsao) {
      previsao.resolvida = true;
      ordensDemo.unshift({
        id: Date.now(),
        impressora_id: previsao.impressora_id,
        impressora: previsao.impressora,
        titulo: String(titulo) || `Manutenção preventiva — ${previsao.componente}`,
        prioridade: "alta",
        status: "planejada",
        responsavel: responsavel ? String(responsavel) : null,
        data_prevista: null,
        custo_estimado: null,
        criada_em: new Date().toISOString(),
      });
    }
  },
  salvar_regra: ({ id, nome, prioridade, condicoes, acao, ativa }) => {
    const dados = {
      id: id ? Number(id) : Date.now(),
      nome: String(nome),
      prioridade: Number(prioridade),
      condicoes: condicoes as Condicao[],
      acao: acao as AcaoRegra,
      ativa: Boolean(ativa),
      criada_em: new Date().toISOString(),
    };
    const indice = regrasDemo.findIndex((regra) => regra.id === dados.id);
    if (indice >= 0) regrasDemo[indice] = dados;
    else regrasDemo.push(dados);
  },
  alternar_regra: ({ id }) => {
    const regra = regrasDemo.find((item) => item.id === Number(id));
    if (regra) regra.ativa = !regra.ativa;
  },
  excluir_regra: ({ id }) => {
    const indice = regrasDemo.findIndex((item) => item.id === Number(id));
    if (indice >= 0) regrasDemo.splice(indice, 1);
  },
  descobrir_impressoras: () => ({
    encontradas: impressorasDemo.length,
    novas: 0,
    atualizadas: 0,
    tempo_ms: 120,
  }),
  sincronizar_agora: () => {
    statusSyncDemo.pendencias = 0;
    outboxDemo.splice(0, outboxDemo.length);
    statusSyncDemo.ciclos.unshift({
      id: Date.now(), instalacao_id: "matriz-sp", direcao: "envio", itens: 18,
      duracao_ms: 1840, status: "sucesso", detalhe: "18 enviados",
      realizada_em: new Date().toISOString(),
    });
    return resultadoSyncDemo;
  },
  resolver_conflito_sync: ({ id, vencedor }) => {
    const conflito = statusSyncDemo.conflitos.find((item) => item.id === Number(id));
    if (conflito) {
      conflito.estado = vencedor === "local" ? "resolvido_local" : "resolvido_remoto";
      statusSyncDemo.conflitos_pendentes = statusSyncDemo.conflitos.filter(
        (item) => item.estado === "pendente"
      ).length;
    }
  },
};

function alterarTrabalho(id: number, status: string) {
  const trabalho = trabalhosDemo.find((item) => item.id === id);
  if (trabalho) trabalho.status = status;
}

function alterarImpressora(nome: string, status: string) {
  const impressora = impressorasDemo.find((item) => item.nome === nome);
  if (impressora) impressora.status = status;
}

function montarDetalhesDemo(id: number): DetalhesImpressora {
  const impressora = impressorasDemo.find((item) => item.id === id);
  const grupo = gruposSuprimentoDemo.find((item) => item.impressora_id === id);
  return {
    impressora_id: id,
    nome: impressora?.nome ?? `Impressora ${id}`,
    modelo: impressora?.modelo ?? null,
    numero_serie: `SER-${String(id).padStart(4, "0")}`,
    firmware: "—",
    endereco: impressora?.endereco ?? null,
    localizacao: null,
    setor: impressora?.setor ?? null,
    status: impressora?.status ?? "desconhecido",
    origem: "spooler",
    ultima_vista: new Date().toISOString(),
    trabalhos: trabalhosDemo
      .filter((item) => item.impressora === impressora?.nome)
      .map((item) => ({
        id: item.id, documento: item.documento, usuario: item.usuario ?? "",
        paginas: item.paginas, status: item.status, criado_em: item.criado_em,
      })),
    alertas: alertasDemo.filter((item) => item.impressora === impressora?.nome),
    manutencoes: ordensDemo
      .filter((item) => item.impressora_id === id)
      .map((item) => ({
        id: item.id, titulo: item.titulo, tipo: "preventiva", responsavel: item.responsavel ?? "",
        data_prevista: item.data_prevista ?? "", status: item.status, custo_estimado: item.custo_estimado ?? 0,
      })),
    suprimentos: grupo?.itens ?? [],
  };
}

/** Wrapper dos comandos Tauri com fallback para dados demo no navegador. */
export async function chamar<T>(
  comando: string,
  argumentos?: Record<string, unknown>
): Promise<T> {
  if (!DENTRO_TAURI) {
    await new Promise((resolver) => setTimeout(resolver, 100));
    if (comando === "obter_detalhes_impressora") {
      const id = Number(argumentos?.id);
      return montarDetalhesDemo(id) as T;
    }
    const acao = ACOES_DEMO[comando];
    if (acao) {
      const retorno = acao(argumentos ?? {});
      return (retorno === undefined ? undefined : retorno) as T;
    }
    if (comando === "salvar_configuracoes" && argumentos) {
      Object.assign(configuracoesDemo, argumentos.valores);
      return undefined as T;
    }
    const resposta = RESPOSTAS_DEMO[comando];
    if (Array.isArray(resposta)) return [...resposta] as T;
    // Objetos são copiados para garantir nova referência e disparar re-render no React.
    if (resposta && typeof resposta === "object") return { ...(resposta as object) } as T;
    return resposta as T;
  }
  return invoke<T>(comando, argumentos);
}

function baixarCsvDemo(relatorio: Relatorio) {
  const linhas = [
    "Impressora;Setor;Páginas;Custo (R$);Variação (%);Participação (%)",
    ...relatorio.impressoras.map((linha) =>
      `"${linha.nome}";"${linha.setor}";${linha.paginas};${linha.custo.toFixed(2)};${linha.variacao.toFixed(1)};${linha.participacao}`
    ),
    `\nTotal;;${relatorio.paginas};${relatorio.custo_total.toFixed(2)};;100`,
  ];
  const blob = new Blob(["\uFEFF" + linhas.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "relatorio_print360.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export interface DadosNovaImpressora {
  nome: string;
  endereco?: string;
  setor?: string;
}

export interface DadosNovoUsuario {
  nome: string;
  login: string;
  email?: string;
  setor?: string;
  perfil: string;
}

export const api = {
  listarImpressoras: () => chamar<Impressora[]>("listar_impressoras"),
  descobrirImpressoras: () => chamar<ResultadoDescoberta>("descobrir_impressoras"),
  listarTrabalhos: () => chamar<Trabalho[]>("listar_trabalhos"),
  obterResumo: () => chamar<ResumoDashboard>("obter_resumo_dashboard"),
  obterAtividade: () => chamar<AtividadeItem[]>("obter_atividade_recente", { limite: 8 }),
  listarOutbox: () => chamar<MudancaOutbox[]>("listar_outbox"),
  obterConfiguracoes: () => chamar<Record<string, string>>("obter_configuracoes"),
  salvarConfiguracoes: (valores: Record<string, string>) =>
    chamar<void>("salvar_configuracoes", { valores }),
  salvarParametrosCusto: (preto: number, cor: number) =>
    chamar<void>("salvar_parametros_custo", { preto, cor }),

  adicionarImpressora: (dados: DadosNovaImpressora) =>
    chamar<number>("adicionar_impressora", {
      nome: dados.nome, endereco: dados.endereco, setor: dados.setor,
    }),
  pausarTrabalho: (id: number) => chamar<void>("pausar_trabalho", { id }),
  retomarTrabalho: (id: number) => chamar<void>("retomar_trabalho", { id }),
  cancelarTrabalho: (id: number) => chamar<void>("cancelar_trabalho", { id }),
  reiniciarTrabalho: (id: number) => chamar<void>("reiniciar_trabalho", { id }),
  limparFilaImpressora: (nome: string) => chamar<void>("limpar_fila_impressora", { nome }),
  pausarImpressora: (nome: string) => chamar<void>("pausar_impressora", { nome }),
  retomarImpressora: (nome: string) => chamar<void>("retomar_impressora", { nome }),

  listarSuprimentos: () => chamar<GrupoSuprimento[]>("listar_suprimentos"),
  registrarTroca: (impressoraId: number, tipo: string, responsavel: string) =>
    chamar<void>("registrar_troca_suprimento", {
      impressora_id: impressoraId, tipo, responsavel,
    }),

  listarUsuarios: () => chamar<UsuarioResumo[]>("listar_usuarios"),
  listarSetores: () => chamar<Setor[]>("listar_setores"),
  adicionarUsuario: (dados: DadosNovoUsuario) =>
    chamar<number>("adicionar_usuario", {
      nome: dados.nome, login: dados.login, email: dados.email,
      setor: dados.setor, perfil: dados.perfil,
    }),
  salvarCota: (usuarioId: number, limitePaginas: number, bloquearExcesso: boolean) =>
    chamar<void>("salvar_cota", {
      usuario_id: usuarioId, limite_paginas: limitePaginas, bloquear_excesso: bloquearExcesso,
    }),

  listarAlertas: (soPendentes = true) =>
    chamar<Alerta[]>("listar_alertas", { so_pendentes: soPendentes }),
  resolverAlerta: (id: number) => chamar<void>("resolver_alerta", { id }),

  obterRelatorio: (meses = 12, setor?: string) =>
    chamar<Relatorio>("obter_relatorio", { meses, setor: setor ?? null }),
  exportarRelatorioCsv: async (relatorio: Relatorio, meses = 12) => {
    if (!DENTRO_TAURI) {
      baixarCsvDemo(relatorio);
      return;
    }
    const caminho = await save({
      defaultPath: "relatorio_print360.csv",
      filters: [{ name: "CSV", extensions: ["csv"] }],
    });
    if (caminho) {
      await chamar<void>("exportar_relatorio_csv", { caminho, meses, setor: null });
    }
  },

  listarAuditoria: () => chamar<RegistroAuditoria[]>("listar_auditoria", { limite: 100 }),

  obterDetalhesImpressora: (id: number) =>
    chamar<DetalhesImpressora>("obter_detalhes_impressora", { id }),
  obterSaudeFrota: () => chamar<SaudeImpressora[]>("obter_saude_frota"),
  obterPrevisoes: () => chamar<PrevisaoItem[]>("obter_previsoes"),
  listarOrdensServico: () => chamar<OrdemServico[]>("listar_ordens_servico"),
  criarOrdemServico: (dados: {
    previsao_id: number;
    titulo: string;
    prioridade?: string;
    responsavel?: string;
    data_prevista?: string;
    custo_estimado?: number;
  }) => chamar<number>("criar_ordem_servico", {
    previsao_id: dados.previsao_id,
    titulo: dados.titulo,
    prioridade: dados.prioridade ?? "",
    responsavel: dados.responsavel ?? null,
    data_prevista: dados.data_prevista ?? null,
    custo_estimado: dados.custo_estimado ?? null,
  }),
  recalcularPredicoes: () => chamar<boolean>("recalcular_predicoes"),

  listarRegras: () => chamar<RegraRoteamento[]>("listar_regras"),
  salvarRegra: (dados: {
    id?: number;
    nome: string;
    prioridade: number;
    condicoes: Condicao[];
    acao: AcaoRegra;
    ativa: boolean;
  }) => chamar<number>("salvar_regra", {
    id: dados.id ?? null,
    nome: dados.nome,
    prioridade: dados.prioridade,
    condicoes: dados.condicoes,
    acao: dados.acao,
    ativa: dados.ativa,
  }),
  alternarRegra: (id: number) => chamar<void>("alternar_regra", { id }),
  excluirRegra: (id: number) => chamar<void>("excluir_regra", { id }),
  simularRoteamento: (contexto: ContextoSimulacao) =>
    chamar<Simulacao>("simular_roteamento", contexto as unknown as Record<string, unknown>),
  listarDecisoesRoteamento: () =>
    chamar<ExecucaoRoteamento[]>("listar_decisoes_roteamento"),

  obterStatusSync: () => chamar<StatusSync>("obter_status_sync"),
  sincronizarAgora: () => chamar<ResultadoSync>("sincronizar_agora"),
  resolverConflitoSync: (id: number, vencedor: "local" | "remoto") =>
    chamar<void>("resolver_conflito_sync", { id, vencedor }),

  exportarBackup: async () => {
    if (!DENTRO_TAURI) {
      const snapshot = JSON.stringify(
        { impressoras: impressorasDemo, trabalhos: trabalhosDemo, usuarios: usuariosDemo },
        null,
        2
      );
      const blob = new Blob([snapshot], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "print360_backup_demo.json";
      link.click();
      URL.revokeObjectURL(url);
      return;
    }
    const caminho = await save({
      defaultPath: "print360_backup.db",
      filters: [{ name: "Banco de dados", extensions: ["db"] }],
    });
    if (caminho) await chamar<void>("exportar_backup", { caminho });
  },
  importarBackup: async () => {
    if (!DENTRO_TAURI) return;
    const caminho = await open({
      filters: [{ name: "Banco de dados", extensions: ["db"] }],
      multiple: false,
    });
    if (typeof caminho === "string") {
      await chamar<void>("importar_backup", { caminho });
    }
  },
};
