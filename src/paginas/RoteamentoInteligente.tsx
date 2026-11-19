import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Play, Plus, Route, Sparkles, Trash2 } from "lucide-react";
import { api } from "../api/cliente";
import type {
  AcaoRegra,
  Condicao,
  ContextoSimulacao,
  ExecucaoRoteamento,
  RegraRoteamento,
  Relatorio,
  Simulacao,
} from "../tipos";
import { Badge, Campo, Card, CardKPI, Modal, Selecao } from "../componentes/ui";
import { useAppStore } from "../estado/store";

const CAMPOS = ["setor", "documento", "paginas", "cor", "urgencia", "tamanho_bytes"];
const OPERADORES = ["igual", "diferente", "contem", "maior_que", "menor_que"];
const CRITERIOS = ["disponibilidade", "proximidade", "menor_custo", "menor_carga"];

interface EditorState {
  aberto: boolean;
  id?: number;
  nome: string;
  prioridade: number;
  condicoes: Condicao[];
  acao: AcaoRegra;
}

const editorVazio = (): EditorState => ({
  aberto: false,
  nome: "",
  prioridade: 10,
  condicoes: [{ campo: "setor", operador: "igual", valor: "" }],
  acao: { impressora: "", grupo: [], criterio: "disponibilidade", fallback: "" },
});

const resumirCondicoes = (condicoes: Condicao[]) =>
  condicoes.map((condicao) => `${condicao.campo} ${condicao.operador} ${condicao.valor}`).join(" E ") || "sem condições";

export function RoteamentoInteligente() {
  const [regras, setRegras] = useState<RegraRoteamento[]>([]);
  const [decisoes, setDecisoes] = useState<ExecucaoRoteamento[]>([]);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [editor, setEditor] = useState<EditorState>(editorVazio());
  const [simulacao, setSimulacao] = useState<Simulacao | null>(null);
  const [ativo, setAtivo] = useState(false);
  const [contexto, setContexto] = useState<ContextoSimulacao>({
    documento: "Relatorio_financeiro_dez.pdf", setor: "Financeiro",
    paginas: 18, cor: "pb", urgencia: "alta", tamanho_bytes: 2048,
  });
  const notificar = useAppStore((estado) => estado.notificar);

  const carregar = useCallback(() => {
    api.listarRegras().then(setRegras);
    api.listarDecisoesRoteamento().then(setDecisoes);
    api.obterConfiguracoes().then((config) => {
      setConfig(config);
      setAtivo(config.f2_roteamento_ativa === "true");
    });
    api.obterRelatorio(12).then(setRelatorio);
  }, []);

  useEffect(carregar, [carregar]);

  const alternarGlobal = async () => {
    const config = await api.obterConfiguracoes();
    const novo = !ativo;
    await api.salvarConfiguracoes({ ...config, f2_roteamento_ativa: String(novo) });
    setAtivo(novo);
    notificar(novo ? "Roteamento automático ativado." : "Roteamento automático desativado.");
  };

  const simular = async () => {
    try {
      const resultado = await api.simularRoteamento(contexto);
      setSimulacao(resultado);
    } catch (erro) {
      notificar(`Falha na simulação: ${String(erro)}`);
    }
  };

  const simularEditor = async () => {
    const condicao = editor.condicoes[0];
    const ctx: ContextoSimulacao = {
      ...contexto,
      setor: condicao?.campo === "setor" ? condicao.valor : contexto.setor,
      cor: condicao?.campo === "cor" ? condicao.valor : contexto.cor,
      urgencia: condicao?.campo === "urgencia" ? condicao.valor : contexto.urgencia,
      paginas: condicao?.campo === "paginas" ? Number(condicao.valor) || 1 : contexto.paginas,
    };
    await simularCom(ctx);
  };

  const simularCom = async (ctx: ContextoSimulacao) => {
    try {
      const resultado = await api.simularRoteamento(ctx);
      setSimulacao(resultado);
    } catch (erro) {
      notificar(`Falha na simulação: ${String(erro)}`);
    }
  };

  const salvar = async () => {
    try {
      await api.salvarRegra({
        id: editor.id,
        nome: editor.nome,
        prioridade: editor.prioridade,
        condicoes: editor.condicoes,
        acao: {
          impressora: editor.acao.impressora || null,
          grupo: editor.acao.grupo,
          criterio: editor.acao.criterio,
          fallback: editor.acao.fallback || null,
        },
        ativa: true,
      });
      notificar("Regra salva e auditada.");
      setEditor(editorVazio());
      setSimulacao(null);
      carregar();
    } catch (erro) {
      notificar(`Falha ao salvar regra: ${String(erro)}`);
    }
  };

  const abrirEdicao = (regra: RegraRoteamento) => {
    setSimulacao(null);
    setEditor({
      aberto: true,
      id: regra.id,
      nome: regra.nome,
      prioridade: regra.prioridade,
      condicoes: regra.condicoes.length ? regra.condicoes : [{ campo: "setor", operador: "igual", valor: "" }],
      acao: regra.acao,
    });
  };

  const mover = async (regra: RegraRoteamento, direcao: -1 | 1) => {
    const novaPrioridade = Math.max(1, regra.prioridade + direcao);
    await api.salvarRegra({
      id: regra.id, nome: regra.nome, prioridade: novaPrioridade,
      condicoes: regra.condicoes, acao: regra.acao, ativa: regra.ativa,
    });
    carregar();
  };

  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1 className="titulo-pagina">Roteamento Inteligente</h1>
          <p className="subtitulo-pagina">Defina regras, simule o destino e ative com segurança</p>
        </div>
        <div className="flex align-center gap-3">
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--cor-texto)" }}>Roteamento automático</span>
          <button
            role="switch" aria-checked={ativo} aria-label="Roteamento automático"
            className={`toggle ${ativo ? "toggle--ativo" : ""}`} onClick={alternarGlobal}
          >
            <span className="toggle__bolinha" />
          </button>
          <span style={{ fontSize: 11, fontWeight: 700, color: ativo ? "#047857" : "#475569" }}>
            {ativo ? "ATIVADO" : "DESLIGADO"}
          </span>
          <span className="badge badge--info" style={{ background: "#EDE9FE", color: "#5B21B6" }}>
            <Sparkles size={11} /> Recursos Avançados
          </span>
        </div>
      </div>

      <div className="grade-kpis">
        <CardKPI rotulo="Trabalhos roteados" valor={String(decisoes.length)} icone={<Route size={20} />} corFundo="#DBEAFE" corIcone="#2563EB" />
        <CardKPI rotulo="Variação de custo" valor={relatorio ? `${relatorio.economia_percentual.toFixed(1).replace(".", ",")}%` : "—"} icone={<Route size={20} />} corFundo="#D1FAE5" corIcone="#047857" />
        <CardKPI rotulo="Regras ativas" valor={String(regras.filter((r) => r.ativa).length)} icone={<Sparkles size={20} />} corFundo="#EDE9FE" corIcone="#7C3AED" />
        <CardKPI rotulo="Fallback usado" valor={String(decisoes.filter((d) => d.justificativa.some((j) => j.toLowerCase().includes("fallback"))).length)} icone={<Route size={20} />} corFundo="#FEF3C7" corIcone="#B45309" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "640px 1fr", gap: 20 }}>
        <Card>
          <div className="flex align-center justify-between">
            <div>
              <h2 className="card__titulo">Regras de roteamento</h2>
              <p className="subtitulo-pagina">primeira correspondência vence · ordene por prioridade</p>
            </div>
            <button className="botao botao--secundario" onClick={() => { setEditor({ ...editorVazio(), aberto: true }); setSimulacao(null); }}>
              <Plus size={14} /> Nova regra
            </button>
          </div>
          <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
            {regras.map((regra) => (
              <div key={regra.id} style={{
                border: "1px solid var(--cor-borda)", borderRadius: 10, padding: 14,
                background: regra.ativa ? "#F8FAFC" : "#FFFFFF", opacity: regra.ativa ? 1 : 0.6,
              }}>
                <div className="flex align-center gap-3">
                  <span style={{
                    width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center",
                    background: "#DBEAFE", color: "#1D4ED8", fontWeight: 700, fontSize: 12,
                  }}>{regra.prioridade}</span>
                  <strong style={{ fontSize: 12, flex: 1 }}>{regra.nome}</strong>
                  {!regra.ativa && <Badge tipo="neutro">Inativa</Badge>}
                  <button role="switch" aria-checked={regra.ativa} aria-label={`Ativar ${regra.nome}`}
                    className={`toggle ${regra.ativa ? "toggle--ativo" : ""}`}
                    style={{ width: 36, height: 20 }}
                    onClick={() => { api.alternarRegra(regra.id).then(carregar); }}>
                    <span className="toggle__bolinha" style={{ width: 14, height: 14 }} />
                  </button>
                </div>
                <p style={{ fontSize: 11, color: "var(--cor-texto-secundario)", marginTop: 10 }}>SE {resumirCondicoes(regra.condicoes)}</p>
                <p style={{ fontSize: 11, color: "#1D4ED8", marginTop: 4 }}>
                  → {regra.acao.impressora || regra.acao.grupo.join(", ") || "todas"} · critério: {regra.acao.criterio}
                </p>
                <div className="flex align-center gap-2" style={{ marginTop: 10 }}>
                  <button className="botao--icone" title="Subir prioridade" onClick={() => mover(regra, -1)}><ArrowUp size={14} /></button>
                  <button className="botao--icone" title="Descer prioridade" onClick={() => mover(regra, 1)}><ArrowDown size={14} /></button>
                  <button className="link" style={{ marginLeft: 8 }} onClick={() => abrirEdicao(regra)}>Editar</button>
                  <button className="botao--icone" title="Excluir" onClick={() => { api.excluirRegra(regra.id).then(carregar); }}>
                    <Trash2 size={14} color="#DC2626" />
                  </button>
                </div>
              </div>
            ))}
            {regras.length === 0 && <p className="subtitulo-pagina">Nenhuma regra cadastrada.</p>}
          </div>
          <p style={{ fontSize: 11, color: "var(--cor-texto-claro)", marginTop: 16 }}>
            Fallback: {regras.find((regra) => regra.acao.fallback)?.acao.fallback ?? "não configurado"} · máx. {config.f2_roteamento_fallback_tentativas ?? 2} tentativas
          </p>
        </Card>

        <Card>
          <div style={{ background: "#EFF6FF", border: "1px dashed #93C5FD", borderRadius: 10, padding: "10px 14px", marginBottom: 20 }}>
            <div className="flex align-center justify-between">
              <strong style={{ fontSize: 14, color: "#1D4ED8" }} className="flex align-center gap-2">
                <Play size={13} /> Simulação (dry-run)
              </strong>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#1D4ED8" }}>SEM EFEITO REAL</span>
            </div>
          </div>

          <p className="fl" style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>DOCUMENTO DE EXEMPLO</p>
          <Campo id="sim-documento" rotulo="" value={contexto.documento} onChange={(e) => setContexto({ ...contexto, documento: e.target.value })} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
            <Selecao rotulo="Setor" id="sim-setor" opcoes={["Financeiro", "Marketing", "Tecnologia", "RH"]}
              value={contexto.setor ?? ""} onChange={(e) => setContexto({ ...contexto, setor: e.target.value })} />
            <Selecao rotulo="Urgência" id="sim-urgencia" opcoes={["baixa", "normal", "alta"]}
              value={contexto.urgencia} onChange={(e) => setContexto({ ...contexto, urgencia: e.target.value })} />
            <Campo rotulo="Páginas" id="sim-paginas" type="number" value={String(contexto.paginas)} onChange={(e) => setContexto({ ...contexto, paginas: Number(e.target.value) })} />
            <Selecao rotulo="Cor" id="sim-cor" opcoes={["pb", "cor"]}
              value={contexto.cor} onChange={(e) => setContexto({ ...contexto, cor: e.target.value })} />
          </div>

          <button className="botao botao--secundario mt-4" onClick={simular}><Play size={14} /> Simular</button>

          {simulacao && (
            <div style={{ marginTop: 20, background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 10, padding: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#5B21B6" }}>DESTINO ESCOLHIDO</p>
              <p style={{ fontSize: 15, fontWeight: 700, marginTop: 6 }}>{simulacao.destino}</p>
              <p style={{ fontSize: 10, color: "#5B21B6", marginTop: 8 }}>{simulacao.regra_aplicada ?? "Impressora padrão"} · critério: {simulacao.criterio}</p>
              <ul style={{ marginTop: 12, paddingLeft: 18, fontSize: 10, color: "#475569" }}>
                {simulacao.justificativa.map((item, indice) => <li key={indice}>{item}</li>)}
              </ul>
              <p style={{ fontSize: 10, color: "#64748B", marginTop: 8 }}>
                {simulacao.candidatos_avaliados} candidato(s) avaliado(s){simulacao.fallback_usado ? " · fallback usado" : ""}
              </p>
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="card__titulo">Decisões recentes</h2>
        <table className="tabela mt-4">
          <thead><tr><th>Documento</th><th>Regra</th><th>Destino</th><th>Justificativa</th></tr></thead>
          <tbody>
            {decisoes.slice(0, 5).map((decisao) => (
              <tr key={decisao.id}>
                <td className="tabela__principal">Trabalho #{decisao.trabalho_id}</td>
                <td>{decisao.regra_nome ?? "Padrão"}</td>
                <td>{decisao.impressora}</td>
                <td style={{ fontSize: 10, color: "var(--cor-texto-secundario)" }}>{decisao.justificativa[0]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal aberto={editor.aberto} titulo={editor.id ? "Editar regra" : "Nova regra"} aoFechar={() => setEditor(editorVazio())}>
        <div style={{ display: "grid", gap: 14 }}>
          <Campo rotulo="Nome" id="regra-nome" value={editor.nome} onChange={(e) => setEditor({ ...editor, nome: e.target.value })} />
          <Campo rotulo="Prioridade" id="regra-prioridade" type="number" value={String(editor.prioridade)} onChange={(e) => setEditor({ ...editor, prioridade: Number(e.target.value) })} />
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>CONDIÇÕES</p>
            {editor.condicoes.map((condicao, indice) => (
              <div key={indice} className="flex gap-2" style={{ marginBottom: 8 }}>
                <Selecao rotulo="" id={`cond-campo-${indice}`} opcoes={CAMPOS} value={condicao.campo}
                  onChange={(e) => setEditor({ ...editor, condicoes: editor.condicoes.map((c, i) => i === indice ? { ...c, campo: e.target.value } : c) })} />
                <Selecao rotulo="" id={`cond-op-${indice}`} opcoes={OPERADORES} value={condicao.operador}
                  onChange={(e) => setEditor({ ...editor, condicoes: editor.condicoes.map((c, i) => i === indice ? { ...c, operador: e.target.value } : c) })} />
                <Campo rotulo="" id={`cond-valor-${indice}`} value={condicao.valor}
                  onChange={(e) => setEditor({ ...editor, condicoes: editor.condicoes.map((c, i) => i === indice ? { ...c, valor: e.target.value } : c) })} />
              </div>
            ))}
            <button className="link" onClick={() => setEditor({ ...editor, condicoes: [...editor.condicoes, { campo: "setor", operador: "igual", valor: "" }] })}>
              + Adicionar condição
            </button>
          </div>
          <Campo rotulo="Impressora destino (opcional)" id="regra-destino" value={editor.acao.impressora ?? ""}
            onChange={(e) => setEditor({ ...editor, acao: { ...editor.acao, impressora: e.target.value } })} />
          <Selecao rotulo="Critério de escolha" id="regra-criterio" opcoes={CRITERIOS} value={editor.acao.criterio}
            onChange={(e) => setEditor({ ...editor, acao: { ...editor.acao, criterio: e.target.value } })} />
          <Campo rotulo="Fallback (opcional)" id="regra-fallback" value={editor.acao.fallback ?? ""}
            onChange={(e) => setEditor({ ...editor, acao: { ...editor.acao, fallback: e.target.value } })} />

          {simulacao && (
            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: 12, fontSize: 11 }}>
              <strong>Simulação: {simulacao.destino}</strong>
              <p style={{ color: "#047857", marginTop: 4 }}>Pré-requisito atendido para salvar.</p>
            </div>
          )}
        </div>
        <div className="flex justify-between mt-6">
          <button className="botao botao--secundario" onClick={simularEditor}>Simular regra</button>
          <button className="botao botao--primario" disabled={!simulacao} onClick={salvar} title={!simulacao ? "Simule a regra antes de salvar" : undefined}>
            Salvar e ativar
          </button>
        </div>
      </Modal>
    </>
  );
}
