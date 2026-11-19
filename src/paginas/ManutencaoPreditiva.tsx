import { useCallback, useEffect, useState } from "react";
import { Activity, CalendarClock, ChevronDown, ChevronUp, Sparkles, Wrench } from "lucide-react";
import { api } from "../api/cliente";
import type { OrdemServico, PrevisaoItem, SaudeImpressora } from "../tipos";
import { Badge, Campo, Card, CardKPI, Modal } from "../componentes/ui";
import { HealthGauge } from "../componentes/especificos/HealthGauge";
import { useAtualizacoes } from "../hooks/useEventos";
import { useAppStore } from "../estado/store";

type TipoConfianca = "sucesso" | "aviso" | "neutro";

const corConfianca = (confianca: string): TipoConfianca =>
  confianca === "alta" ? "sucesso" : confianca === "média" ? "aviso" : "neutro";

const corRisco = (pontuacao: number) =>
  pontuacao >= 85 ? "#10B981" : pontuacao >= 70 ? "#2563EB" : pontuacao >= 50 ? "#F59E0B" : "#DC2626";

export function ManutencaoPreditiva() {
  const [saude, setSaude] = useState<SaudeImpressora[]>([]);
  const [previsoes, setPrevisoes] = useState<PrevisaoItem[]>([]);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [expandida, setExpandida] = useState<number | null>(null);
  const [ordem, setOrdem] = useState<PrevisaoItem | null>(null);
  const [responsavel, setResponsavel] = useState("Ana Souza");
  const [horizonte, setHorizonte] = useState("30");
  const notificar = useAppStore((estado) => estado.notificar);
  const definirTela = useAppStore((estado) => estado.definirTela);

  const carregar = useCallback(() => {
    api.obterSaudeFrota().then(setSaude);
    api.obterPrevisoes().then(setPrevisoes);
    api.listarOrdensServico().then(setOrdens);
  }, []);

  useEffect(carregar, [carregar]);
  useAtualizacoes(carregar);

  const media = saude.length
    ? Math.round(saude.reduce((soma, item) => soma + item.pontuacao, 0) / saude.length)
    : 0;
  const atencao = saude.filter((item) => item.classificacao === "atencao" || item.classificacao === "critico").length;
  const criticas = previsoes.filter((item) => !item.resolvida && item.dias_previstos <= 30);

  const criarOrdem = async () => {
    if (!ordem) return;
    try {
      await api.criarOrdemServico({
        previsao_id: ordem.id,
        titulo: `Manutenção preventiva — ${ordem.componente}`,
        responsavel,
      });
      notificar(`Ordem de serviço criada para ${ordem.impressora}.`);
      setOrdem(null);
      carregar();
    } catch (erro) {
      notificar(`Falha ao criar ordem: ${String(erro)}`);
    }
  };

  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1 className="titulo-pagina">Manutenção Preditiva</h1>
          <p className="subtitulo-pagina">Antecipe falhas com base em sinais da frota · estimativas com fatores e confiança</p>
        </div>
        <div className="flex align-center gap-2">
          <div style={{ display: "flex", gap: 0 }}>
            {["7", "30", "90"].map((opcao) => (
              <button key={opcao}
                onClick={() => setHorizonte(opcao)}
                style={{
                  width: 52, height: 36, fontSize: 12, fontWeight: 600,
                  border: "1px solid var(--cor-borda-forte)",
                  borderRight: opcao === "90" ? "1px solid var(--cor-borda-forte)" : "none",
                  borderRadius: opcao === "7" ? "8px 0 0 8px" : opcao === "90" ? "0 8px 8px 0" : 0,
                  background: horizonte === opcao ? "var(--cor-primaria)" : "#fff",
                  color: horizonte === opcao ? "#fff" : "var(--cor-texto)",
                }}>
                {opcao}d
              </button>
            ))}
          </div>
          <span className="badge badge--info" style={{ background: "#EDE9FE", color: "#5B21B6" }}>
            <Sparkles size={11} /> Recursos Avançados
          </span>
        </div>
      </div>

      <div className="grade-kpis">
        <CardKPI rotulo="Saúde média da frota" valor={`${media}/100`} icone={<Activity size={20} />} corFundo="#DBEAFE" corIcone="#2563EB" />
        <CardKPI rotulo="Em atenção" valor={String(atencao)} icone={<Activity size={20} />} corFundo="#FEF3C7" corIcone="#B45309" />
        <CardKPI rotulo={`Falhas previstas (${horizonte}d)`} valor={String(criticas.length)} icone={<Wrench size={20} />} corFundo="#FEE2E2" corIcone="#DC2626" />
        <CardKPI rotulo="Ordens abertas" valor={String(ordens.filter((ordem) => ordem.status !== "concluida" && ordem.status !== "cancelada").length)} icone={<CalendarClock size={20} />} corFundo="#D1FAE5" corIcone="#047857" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "440px 1fr 240px", gap: 20 }}>
        <Card>
          <h2 className="card__titulo">Saúde da frota</h2>
          <p className="subtitulo-pagina">Média ponderada · {saude.length} dispositivos</p>
          <div style={{ display: "grid", placeItems: "center", marginTop: 8 }}>
            <HealthGauge valor={media} classificacao={media >= 85 ? "excelente" : media >= 70 ? "bom" : media >= 50 ? "atencao" : "critico"} confianca={0.82} />
          </div>
        </Card>

        <Card>
          <h2 className="card__titulo">Risco por impressora</h2>
          <p className="subtitulo-pagina">Maior risco primeiro · horizonte {horizonte} dias</p>
          <div style={{ display: "grid", gap: 14, marginTop: 20 }}>
            {[...saude].sort((a, b) => a.pontuacao - b.pontuacao).slice(0, 5).map((item) => {
              const risco = 100 - item.pontuacao;
              const cor = corRisco(item.pontuacao);
              return (
                <div key={item.impressora_id}>
                  <div className="flex justify-between" style={{ fontSize: 11, marginBottom: 4 }}>
                    <button className="link" style={{ fontSize: 11 }} onClick={() => definirTela("saude-dispositivo")}>{item.nome}</button>
                    <strong style={{ color: cor }}>{risco}%</strong>
                  </div>
                  <div className="barra">
                    <div className="barra__preenchimento" style={{ width: `${risco}%`, background: cor }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h2 className="card__titulo">Próximas manutenções</h2>
          <p className="subtitulo-pagina">linha do tempo</p>
          <div style={{ display: "grid", gap: 16, marginTop: 20 }}>
            {criticas.slice(0, 4).map((item) => (
              <div key={item.id}>
                <div className="flex align-center gap-2">
                  <span style={{ width: 8, height: 8, borderRadius: 4, background: item.dias_previstos < 7 ? "#DC2626" : "#F59E0B" }} />
                  <strong style={{ fontSize: 11 }}>{item.componente}</strong>
                </div>
                <p style={{ fontSize: 10, color: "var(--cor-texto-secundario)", marginLeft: 16 }}>
                  {item.impressora} · em {item.dias_previstos} dias
                </p>
              </div>
            ))}
            {criticas.length === 0 && <p className="subtitulo-pagina">Nenhuma manutenção prevista.</p>}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="card__titulo">Recomendações priorizadas</h2>
        <p className="subtitulo-pagina">Ordenadas por risco × custo · clique em "Por quê?" para ver os fatores</p>
        <table className="tabela mt-4">
          <thead><tr>
            <th>Impressora</th><th>Componente</th><th>Prazo</th><th>Probabilidade</th><th>Confiança</th><th>Fatores / Ação</th>
          </tr></thead>
          <tbody>
            {previsoes.filter((item) => !item.resolvida).map((item) => (
              <tr key={item.id}>
                <td className="tabela__principal">
                  <button className="link" onClick={() => definirTela("saude-dispositivo")}>{item.impressora}</button>
                </td>
                <td>{item.componente}</td>
                <td style={{ color: item.dias_previstos < 7 ? "var(--cor-perigo-texto)" : "var(--cor-aviso-texto)", fontWeight: 700 }}>
                  {item.dias_previstos} dias
                </td>
                <td>{Math.round(item.probabilidade * 100)}%</td>
                <td><Badge tipo={corConfianca(item.confianca)}>{item.confianca}</Badge></td>
                <td>
                  <button className="link" onClick={() => setExpandida(expandida === item.id ? null : item.id)}>
                    {expandida === item.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Por quê?
                  </button>
                  {expandida === item.id && (
                    <div style={{ fontSize: 10, color: "var(--cor-texto-secundario)", marginTop: 4 }}>
                      {item.fatores.join(" · ")}
                    </div>
                  )}
                  <button className="botao botao--primario" style={{ height: 26, marginLeft: 12, fontSize: 10 }}
                    onClick={() => setOrdem(item)}>
                    Criar OS
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {previsoes.every((item) => item.resolvida) && (
          <p style={{ fontSize: 12, color: "var(--cor-texto-secundario)", padding: 24 }}>
            Nenhuma recomendação pendente.
          </p>
        )}
      </Card>

      <Modal aberto={ordem !== null} titulo="Criar ordem de serviço" aoFechar={() => setOrdem(null)}>
        {ordem && (
          <>
            <p style={{ fontSize: 13, color: "var(--cor-texto-secundario)" }}>
              Gerar ordem para <strong>{ordem.componente}</strong> em <strong>{ordem.impressora}</strong>?
            </p>
            <div className="mt-4">
              <Campo rotulo="Responsável" id="responsavel-os" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
            </div>
            <div className="flex justify-between mt-6">
              <button className="botao botao--secundario" onClick={() => setOrdem(null)}>Cancelar</button>
              <button className="botao botao--primario" onClick={criarOrdem}>Criar ordem</button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
