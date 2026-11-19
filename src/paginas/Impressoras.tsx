import { useCallback, useEffect, useState } from "react";
import { Pause, Play, Plus, Printer, Trash2 } from "lucide-react";
import { api, type DadosNovaImpressora } from "../api/cliente";
import type { GrupoSuprimento, Impressora } from "../tipos";
import { BadgeStatus, Campo, Card, CardKPI, Modal } from "../componentes/ui";
import { useAtualizacoes } from "../hooks/useEventos";
import { useAppStore } from "../estado/store";

const COR_ICONE: Record<string, string> = {
  pronta: "#10b981", ocupada: "#f59e0b", erro: "#ef4444",
  pausada: "#f59e0b", manutencao: "#6366f1", offline: "#94a3b8",
};

function corNivel(valor: number) {
  return valor >= 50 ? "var(--cor-sucesso)" : valor >= 20 ? "var(--cor-aviso)" : "var(--cor-perigo)";
}

export function Impressoras() {
  const [impressoras, setImpressoras] = useState<Impressora[]>([]);
  const [gruposSuprimento, setGruposSuprimento] = useState<GrupoSuprimento[]>([]);
  const [novaAberta, setNovaAberta] = useState(false);
  const [novo, setNovo] = useState<DadosNovaImpressora>({ nome: "", endereco: "", setor: "" });
  const notificar = useAppStore((estado) => estado.notificar);

  const carregar = useCallback(() => {
    api.listarImpressoras().then(setImpressoras);
    api.listarSuprimentos().then(setGruposSuprimento);
  }, []);

  useEffect(carregar, [carregar]);
  useAtualizacoes(carregar);

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
    } catch (erro) {
      notificar(`Falha na operação: ${String(erro)}`);
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
    } catch (erro) {
      notificar(`Falha ao cadastrar: ${String(erro)}`);
    }
  };

  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1 className="titulo-pagina">Impressoras</h1>
          <p className="subtitulo-pagina">Inventário e saúde da frota de dispositivos</p>
        </div>
        <button className="botao botao--primario" onClick={() => setNovaAberta(true)}>
          <Plus size={16} /> Adicionar impressora
        </button>
      </div>

      <div className="grade-kpis">
        <CardKPI rotulo="Total de impressoras" valor={String(impressoras.length)} icone={<Printer size={20} />} corFundo="#dbeafe" corIcone="#2563eb" />
        <CardKPI rotulo="Ativas" valor={String(impressoras.filter((i) => i.status === "pronta" || i.status === "ocupada").length)} icone={<Printer size={20} />} corFundo="#d1fae5" corIcone="#10b981" />
        <CardKPI rotulo="Com erro" valor={String(impressoras.filter((i) => i.status === "erro").length)} icone={<Printer size={20} />} corFundo="#fee2e2" corIcone="#ef4444" />
        <CardKPI rotulo="Em manutenção" valor={String(impressoras.filter((i) => i.status === "manutencao").length)} icone={<Printer size={20} />} corFundo="#e0e7ff" corIcone="#6366f1" />
      </div>

      <Card>
        <div className="flex align-center gap-3" style={{ marginBottom: 20 }}>
          <input className="campo__entrada" style={{ width: 320 }} placeholder="Buscar por nome, modelo ou IP..." />
          <select className="campo__entrada" style={{ width: 200 }} defaultValue="Todos">
            <option>Todos</option><option>Pronta</option><option>Erro</option>
          </select>
          <button className="botao botao--secundario" style={{ marginLeft: "auto" }} onClick={carregar}>Atualizar</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {impressoras.map((impressora) => (
            <Card key={impressora.id} style={{ padding: 20 }}>
              <div className="flex align-center gap-3">
                <span style={{ width: 40, height: 40, borderRadius: 10, background: `${COR_ICONE[impressora.status] ?? "#94a3b8"}1f`, color: COR_ICONE[impressora.status] ?? "#94a3b8", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Printer size={22} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{impressora.nome}</div>
                  <div style={{ fontSize: 10, color: "var(--cor-texto-claro)" }}>{impressora.modelo ?? "Modelo não informado"}</div>
                </div>
                <div style={{ marginLeft: "auto" }}><BadgeStatus status={impressora.status} /></div>
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
                <button className="link">Ver detalhes →</button>
                <div className="flex gap-2">
                  {impressora.status === "pausada" ? (
                    <button className="botao--icone" title="Retomar" onClick={() => acao(impressora, "retomar")}><Play size={15} color="#10b981" /></button>
                  ) : (
                    <button className="botao--icone" title="Pausar" onClick={() => acao(impressora, "pausar")}><Pause size={15} /></button>
                  )}
                  <button className="botao--icone" title="Limpar fila" onClick={() => acao(impressora, "limpar")}><Trash2 size={15} color="#ef4444" /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Modal aberto={novaAberta} titulo="Adicionar impressora" aoFechar={() => setNovaAberta(false)}>
        <div style={{ display: "grid", gap: 16 }}>
          <Campo rotulo="Nome da impressora" id="nome-impressora" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} placeholder="Nome da impressora" />
          <Campo rotulo="Endereço (IP ou hostname)" id="endereco-impressora" value={novo.endereco} onChange={(e) => setNovo({ ...novo, endereco: e.target.value })} placeholder="IP ou hostname" />
          <Campo rotulo="Setor" id="setor-impressora" value={novo.setor} onChange={(e) => setNovo({ ...novo, setor: e.target.value })} placeholder="Tecnologia" />
        </div>
        <div className="flex justify-between mt-6">
          <button className="botao botao--secundario" onClick={() => setNovaAberta(false)}>Cancelar</button>
          <button className="botao botao--primario" onClick={salvarNova}>Cadastrar</button>
        </div>
      </Modal>
    </>
  );
}
