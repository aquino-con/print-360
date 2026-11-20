import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Pause, Play, Plus, Printer, RefreshCw, Search, Trash2 } from "lucide-react";
import { api, type DadosNovaImpressora } from "../api/cliente";
import type { GrupoSuprimento, Impressora, Setor } from "../tipos";
import { Badge, BadgeStatus, Campo, Card, CardKPI, Modal } from "../componentes/ui";
import { useAtualizacoes } from "../hooks/useEventos";
import { useAppStore } from "../estado/store";

const COR_ICONE: Record<string, string> = {
  pronta: "#10b981", ocupada: "#f59e0b", erro: "#ef4444",
  pausada: "#f59e0b", manutencao: "#6366f1", offline: "#94a3b8",
};

const STATUS_OPCOES = [
  { valor: "todos", rotulo: "Todos os status" },
  { valor: "pronta", rotulo: "Pronta" },
  { valor: "ocupada", rotulo: "Ocupada" },
  { valor: "erro", rotulo: "Erro" },
  { valor: "pausada", rotulo: "Pausada" },
  { valor: "manutencao", rotulo: "Manutenção" },
  { valor: "offline", rotulo: "Offline" },
  { valor: "desconhecido", rotulo: "Desconhecido" },
];

function corNivel(valor: number) {
  return valor >= 50 ? "var(--cor-sucesso)" : valor >= 20 ? "var(--cor-aviso)" : "var(--cor-perigo)";
}

export function Impressoras() {
  const [impressoras, setImpressoras] = useState<Impressora[]>([]);
  const [gruposSuprimento, setGruposSuprimento] = useState<GrupoSuprimento[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("todos");
  const [setor, setSetor] = useState("todos");
  const [carregando, setCarregando] = useState(true);
  const [descobrindo, setDescobrindo] = useState(false);
  const [ultimaDescoberta, setUltimaDescoberta] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [novaAberta, setNovaAberta] = useState(false);
  const [novo, setNovo] = useState<DadosNovaImpressora>({ nome: "", endereco: "", setor: "" });
  const notificar = useAppStore((estado) => estado.notificar);
  const definirTela = useAppStore((estado) => estado.definirTela);
  const selecionarImpressora = useAppStore((estado) => estado.selecionarImpressora);

  const carregar = useCallback(() => {
    setCarregando(true);
    setErro(null);
    Promise.all([
      api.listarImpressoras(),
      api.listarSuprimentos(),
      api.listarSetores(),
      api.obterConfiguracoes(),
    ])
      .then(([lista, grupos, listaSetores, config]) => {
        setImpressoras(lista);
        setGruposSuprimento(grupos);
        setSetores(listaSetores);
        setUltimaDescoberta(config.ultima_descoberta ?? null);
      })
      .catch((falha) => setErro(String(falha)))
      .finally(() => setCarregando(false));
  }, []);

  useEffect(carregar, [carregar]);
  useAtualizacoes(carregar);

  const descobrir = async () => {
    setDescobrindo(true);
    try {
      const resultado = await api.descobrirImpressoras();
      notificar(
        `Descoberta concluída: ${resultado.encontradas} encontrada(s), ` +
        `${resultado.novas} nova(s), ${resultado.atualizadas} atualizada(s) em ${resultado.tempo_ms} ms.`
      );
      carregar();
    } catch (falha) {
      notificar(`Falha na descoberta: ${String(falha)}`);
    } finally {
      setDescobrindo(false);
    }
  };

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return impressoras.filter((impressora) => {
      const correspondeTexto = !termo || [impressora.nome, impressora.modelo, impressora.endereco, impressora.setor]
        .some((valor) => (valor ?? "").toLowerCase().includes(termo));
      const correspondeStatus = status === "todos" || impressora.status === status;
      const correspondeSetor = setor === "todos" || impressora.setor === setor;
      return correspondeTexto && correspondeStatus && correspondeSetor;
    });
  }, [impressoras, busca, status, setor]);

  const acao = async (impressora: Impressora, tipo: "pausar" | "retomar" | "limpar") => {
    try {
      if (tipo === "pausar") await api.pausarImpressora(impressora.nome);
      if (tipo === "retomar") await api.retomarImpressora(impressora.nome);
      if (tipo === "limpar") await api.limparFilaImpressora(impressora.nome);
      notificar(
        tipo === "limpar"
          ? `Fila de ${impressora.nome} limpa.`
          : `Impressora ${impressora.nome} ${tipo === "pausar" ? "pausada" : "retomada"}.`
      );
      carregar();
    } catch (falha) {
      notificar(`Falha na operação: ${String(falha)}`);
    }
  };

  const salvarNova = async () => {
    if (!novo.nome.trim()) {
      notificar("Informe o nome da impressora.");
      return;
    }
    try {
      await api.adicionarImpressora(novo);
      notificar(`Impressora ${novo.nome} cadastrada.`);
      setNovo({ nome: "", endereco: "", setor: "" });
      setNovaAberta(false);
      carregar();
    } catch (falha) {
      notificar(`Falha ao cadastrar: ${String(falha)}`);
    }
  };

  const verDetalhes = (id: number) => {
    selecionarImpressora(id);
    definirTela("saude-dispositivo");
  };

  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1 className="titulo-pagina">Impressoras</h1>
          <p className="subtitulo-pagina">Inventário e saúde da frota de dispositivos</p>
        </div>
        <div className="flex align-center gap-2">
          <button className="botao botao--secundario" onClick={descobrir} disabled={descobrindo}>
            <Search size={16} /> {descobrindo ? "Descobrindo..." : "Descobrir impressoras"}
          </button>
          <button className="botao botao--primario" onClick={() => setNovaAberta(true)}>
            <Plus size={16} /> Adicionar impressora
          </button>
        </div>
      </div>

      <div className="grade-kpis">
        <CardKPI rotulo="Total de impressoras" valor={String(impressoras.length)} icone={<Printer size={20} />} corFundo="#dbeafe" corIcone="#2563eb" />
        <CardKPI rotulo="Ativas" valor={String(impressoras.filter((i) => i.status === "pronta" || i.status === "ocupada").length)} icone={<Printer size={20} />} corFundo="#d1fae5" corIcone="#047857" />
        <CardKPI rotulo="Com erro" valor={String(impressoras.filter((i) => i.status === "erro").length)} icone={<Printer size={20} />} corFundo="#fee2e2" corIcone="#b91c1c" />
        <CardKPI rotulo="Em manutenção" valor={String(impressoras.filter((i) => i.status === "manutencao").length)} icone={<Printer size={20} />} corFundo="#e0e7ff" corIcone="#6366f1" />
      </div>

      <Card>
        <div className="flex align-center gap-3" style={{ marginBottom: 20 }}>
          <input
            className="campo__entrada"
            style={{ width: 320 }}
            placeholder="Buscar por nome, modelo, endereço ou setor..."
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            aria-label="Buscar impressoras"
          />
          <select
            className="campo__entrada"
            style={{ width: 200 }}
            value={status}
            onChange={(evento) => setStatus(evento.target.value)}
            aria-label="Filtrar por status"
          >
            {STATUS_OPCOES.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>{opcao.rotulo}</option>
            ))}
          </select>
          <select
            className="campo__entrada"
            style={{ width: 200 }}
            value={setor}
            onChange={(evento) => setSetor(evento.target.value)}
            aria-label="Filtrar por setor"
          >
            <option value="todos">Todos os setores</option>
            {setores.map((item) => <option key={item.id} value={item.nome}>{item.nome}</option>)}
          </select>
          <span style={{ fontSize: 11, color: "var(--cor-texto-secundario)", marginLeft: 8 }}>
            {filtradas.length} de {impressoras.length} impressoras
            {ultimaDescoberta && ` · última descoberta ${new Date(ultimaDescoberta).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
          </span>
          <button className="botao botao--secundario" style={{ marginLeft: "auto" }} onClick={carregar} disabled={carregando}>
            <RefreshCw size={15} /> Atualizar
          </button>
        </div>

        {erro && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: 20, display: "grid", gap: 12 }}>
            <div className="flex align-center gap-2" style={{ color: "#B91C1C", fontSize: 13, fontWeight: 600 }}>
              <AlertTriangle size={16} /> Não foi possível carregar as impressoras
            </div>
            <p style={{ fontSize: 11, color: "var(--cor-texto-secundario)" }}>{erro}</p>
            <button className="botao botao--primario" style={{ justifySelf: "start" }} onClick={carregar}>
              Tentar novamente
            </button>
          </div>
        )}

        {carregando && !erro && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[1, 2, 3].map((indice) => (
              <div key={indice} style={{ height: 220, borderRadius: 14, background: "#F1F5F9", opacity: 0.7 }} />
            ))}
          </div>
        )}

        {!carregando && !erro && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {filtradas.map((impressora) => (
              <Card key={impressora.id} style={{ padding: 20 }}>
                <div className="flex align-center gap-3">
                  <span style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: `${COR_ICONE[impressora.status] ?? "#94a3b8"}1f`,
                    color: COR_ICONE[impressora.status] ?? "#94a3b8",
                    display: "grid", placeItems: "center",
                  }}>
                    <Printer size={22} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{impressora.nome}</div>
                    <div style={{ fontSize: 10, color: "var(--cor-texto-claro)" }}>{impressora.modelo ?? "Modelo não informado"}</div>
                  </div>
                  <div className="flex align-center gap-2" style={{ marginLeft: "auto" }}>
                    <BadgeStatus status={impressora.status} />
                    {impressora.origem === "manual"
                      ? <Badge tipo="neutro">Manual</Badge>
                      : <Badge tipo="info">Rede</Badge>}
                  </div>
                </div>
                <hr style={{ border: 0, borderTop: "1px solid var(--cor-fundo)", margin: "16px 0" }} />
                <div className="flex justify-between" style={{ fontSize: 11 }}>
                  <span><strong>Endereço</strong><br />{impressora.endereco ?? "—"}</span>
                  <span><strong>Setor</strong><br />{impressora.setor ?? "—"}</span>
                </div>
                <div style={{ marginTop: 16, fontSize: 9, fontWeight: 600, color: "var(--cor-texto-claro)", letterSpacing: 0.6 }}>SUPRIMENTOS</div>
                <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
                  {(gruposSuprimento.find((grupo) => grupo.impressora_id === impressora.id)?.itens ?? []).map((item) => (
                    <div key={item.id}>
                      <div className="flex justify-between" style={{ fontSize: 10 }}>
                        <span>{item.tipo_rotulo}</span>
                        <span style={{ color: corNivel(item.nivel), fontWeight: 600 }}>{item.nivel}%</span>
                      </div>
                      <div className="barra" style={{ marginTop: 4 }}>
                        <div className="barra__preenchimento" style={{ width: `${item.nivel}%`, background: corNivel(item.nivel) }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex align-center justify-between mt-4">
                  <button className="link" onClick={() => verDetalhes(impressora.id)}>Ver detalhes →</button>
                  <div className="flex gap-2">
                    {impressora.status === "pausada" ? (
                      <button className="botao--icone" title="Retomar" aria-label={`Retomar ${impressora.nome}`} onClick={() => acao(impressora, "retomar")}>
                        <Play size={15} color="#10b981" />
                      </button>
                    ) : (
                      <button className="botao--icone" title="Pausar" aria-label={`Pausar ${impressora.nome}`} onClick={() => acao(impressora, "pausar")}>
                        <Pause size={15} />
                      </button>
                    )}
                    <button className="botao--icone" title="Limpar fila" aria-label={`Limpar fila de ${impressora.nome}`} onClick={() => acao(impressora, "limpar")}>
                      <Trash2 size={15} color="#ef4444" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
            {filtradas.length === 0 && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 40, color: "var(--cor-texto-secundario)", fontSize: 13 }}>
                Nenhuma impressora corresponde aos filtros selecionados.
              </div>
            )}
          </div>
        )}
      </Card>

      <Modal aberto={novaAberta} titulo="Adicionar impressora" aoFechar={() => setNovaAberta(false)}>
        <div style={{ display: "grid", gap: 16 }}>
          <Campo rotulo="Nome da impressora" id="nome-impressora" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} placeholder="Nome da impressora" />
          <Campo rotulo="Endereço (IP ou hostname)" id="endereco-impressora" value={novo.endereco} onChange={(e) => setNovo({ ...novo, endereco: e.target.value })} placeholder="IP ou hostname" />
          <Campo rotulo="Setor" id="setor-impressora" value={novo.setor} onChange={(e) => setNovo({ ...novo, setor: e.target.value })} placeholder="Informe o setor" />
        </div>
        <div className="flex justify-between mt-6">
          <button className="botao botao--secundario" onClick={() => setNovaAberta(false)}>Cancelar</button>
          <button className="botao botao--primario" onClick={salvarNova}>Cadastrar</button>
        </div>
      </Modal>
    </>
  );
}
