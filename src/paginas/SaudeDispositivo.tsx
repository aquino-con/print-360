import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CalendarClock, Sparkles, Wrench } from "lucide-react";
import { api } from "../api/cliente";
import type { DetalhesImpressora, OrdemServico, PrevisaoItem, SaudeImpressora } from "../tipos";
import { Badge, Card } from "../componentes/ui";
import { HealthGauge } from "../componentes/especificos/HealthGauge";
import { useAppStore } from "../estado/store";

const COR_FATOR = (contribuicao: number) =>
  contribuicao >= 20 ? "#DC2626" : contribuicao >= 10 ? "#F59E0B" : "#2563EB";

export function SaudeDispositivo() {
  const [saude, setSaude] = useState<SaudeImpressora[]>([]);
  const [previsoes, setPrevisoes] = useState<PrevisaoItem[]>([]);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [detalhes, setDetalhes] = useState<DetalhesImpressora | null>(null);
  const selecionadoStore = useAppStore((estado) => estado.impressoraSelecionadaId);
  const [selecionado, setSelecionado] = useState<number | null>(selecionadoStore);
  const definirTela = useAppStore((estado) => estado.definirTela);
  const selecionarImpressora = useAppStore((estado) => estado.selecionarImpressora);
  const notificar = useAppStore((estado) => estado.notificar);

  const carregar = useCallback(() => {
    api.obterSaudeFrota().then((dados) => {
      setSaude(dados);
      setSelecionado((atual) => atual ?? selecionadoStore ?? dados[0]?.impressora_id ?? null);
    });
    api.obterPrevisoes().then(setPrevisoes);
    api.listarOrdensServico().then(setOrdens);
  }, [selecionadoStore]);

  useEffect(carregar, [carregar]);

  useEffect(() => {
    if (selecionado === null) return;
    selecionarImpressora(selecionado);
    api.obterDetalhesImpressora(selecionado)
      .then(setDetalhes)
      .catch(() => setDetalhes(null));
  }, [selecionado, selecionarImpressora]);

  const dispositivo = saude.find((item) => item.impressora_id === selecionado);
  const previsoesDoDispositivo = previsoes.filter((item) => item.impressora_id === selecionado);
  const ordensDoDispositivo = ordens.filter((item) => item.impressora_id === selecionado);

  const criarOrdem = async (previsao: PrevisaoItem) => {
    try {
      await api.criarOrdemServico({
        previsao_id: previsao.id,
        titulo: `Manutenção preventiva — ${previsao.componente}`,
        responsavel: "Ana Souza",
      });
      notificar("Ordem de serviço criada.");
      carregar();
    } catch (erro) {
      notificar(`Falha ao criar ordem: ${String(erro)}`);
    }
  };

  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <button className="link flex align-center gap-2" onClick={() => definirTela("manutencao")}>
            <ArrowLeft size={13} /> Manutenção Preditiva
          </button>
          <h1 className="titulo-pagina" style={{ marginTop: 8 }}>Saúde do Dispositivo</h1>
          <p className="subtitulo-pagina">
            {dispositivo
              ? [
                  dispositivo.nome,
                  detalhes?.numero_serie && `Série ${detalhes.numero_serie}`,
                  detalhes?.setor,
                  detalhes?.ultima_vista && `Última vista: ${new Date(detalhes.ultima_vista).toLocaleString("pt-BR")}`,
                ].filter(Boolean).join(" · ")
              : "Carregando dispositivo..."}
          </p>
        </div>
        <div className="flex align-center gap-2">
          <select className="campo__entrada" style={{ width: 240 }} value={selecionado ?? ""}
            onChange={(e) => setSelecionado(Number(e.target.value))}
            aria-label="Selecionar impressora">
            {saude.map((item) => (
              <option key={item.impressora_id} value={item.impressora_id}>{item.nome}</option>
            ))}
          </select>
          <span className="badge badge--info" style={{ background: "#EDE9FE", color: "#5B21B6" }}>
            <Sparkles size={11} /> Recursos Avançados
          </span>
        </div>
      </div>

      {detalhes && (
        <Card style={{ marginBottom: 20 }}>
          <div className="flex align-center justify-between">
            <h2 className="card__titulo">Ficha técnica</h2>
            <Badge tipo={detalhes.origem === "manual" ? "neutro" : "info"}>
              {detalhes.origem === "manual" ? "Cadastro manual" : "Descoberta pela rede"}
            </Badge>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginTop: 20 }}>
            {[
              { rotulo: "Número de série", valor: detalhes.numero_serie ?? "—" },
              { rotulo: "Firmware", valor: detalhes.firmware ?? "—" },
              { rotulo: "Endereço", valor: detalhes.endereco ?? "—" },
              { rotulo: "Localização", valor: detalhes.localizacao ?? "—" },
            ].map((campo) => (
              <div key={campo.rotulo}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--cor-texto-secundario)" }}>{campo.rotulo}</div>
                <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>{campo.valor}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 24, marginTop: 20, fontSize: 11, color: "var(--cor-texto-secundario)" }}>
            <span><strong>{detalhes.trabalhos.length}</strong> trabalhos recentes</span>
            <span><strong>{detalhes.alertas.length}</strong> alertas ativos</span>
            <span><strong>{detalhes.manutencoes.length}</strong> ordens de serviço</span>
            <span><strong>{detalhes.suprimentos.length}</strong> suprimentos</span>
          </div>
        </Card>
      )}

      {dispositivo && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 20 }}>
            <Card>
              <h2 className="card__titulo">Índice de saúde</h2>
              <p className="subtitulo-pagina">cálculo explicável · {dispositivo.fatores.length} sinais</p>
              <div style={{ display: "grid", placeItems: "center", marginTop: 8 }}>
                <HealthGauge valor={dispositivo.pontuacao} classificacao={dispositivo.classificacao} confianca={dispositivo.confianca} tamanho={200} />
              </div>
              <p style={{ fontSize: 11, color: "var(--cor-sucesso-texto)", fontWeight: 700, textAlign: "center" }}>
                +5 pontos vs. semana anterior
              </p>
            </Card>

            <Card>
              <h2 className="card__titulo">Fatores contribuintes</h2>
              <p className="subtitulo-pagina">peso de cada sinal no índice de saúde</p>
              <div style={{ display: "grid", gap: 18, marginTop: 20 }}>
                {dispositivo.fatores.map((fator) => (
                  <div key={fator.nome}>
                    <div className="flex justify-between" style={{ fontSize: 11, marginBottom: 5 }}>
                      <span>{fator.nome} <span style={{ color: "var(--cor-texto-claro)" }}>· {fator.descricao}</span></span>
                      <strong>{Math.round(fator.peso * 100)}% · {Math.round(fator.contribuicao)} pts</strong>
                    </div>
                    <div className="barra">
                      <div className="barra__preenchimento" style={{
                        width: `${Math.min(100, fator.contribuicao * 3)}%`,
                        background: COR_FATOR(fator.contribuicao),
                      }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: 12, fontSize: 11, color: "#1D4ED8" }}>
                Os pesos são configuráveis em Configurações dos recursos avançados → Predição.
              </div>
            </Card>
          </div>

          <Card className="mt-6">
            <h2 className="card__titulo">Previsões por componente</h2>
            <p className="subtitulo-pagina">dias estimados até a próxima intervenção</p>
            <table className="tabela mt-4">
              <thead><tr><th>Componente</th><th>Dias previstos</th><th>Probabilidade</th><th>Confiança</th><th>Fatores</th><th style={{ textAlign: "right" }}>Ação</th></tr></thead>
              <tbody>
                {previsoesDoDispositivo.map((previsao) => (
                  <tr key={previsao.id}>
                    <td className="tabela__principal">{previsao.componente}</td>
                    <td>
                      <div className="barra" style={{ width: 110 }}>
                        <div className="barra__preenchimento" style={{
                          width: `${Math.min(100, (90 - previsao.dias_previstos) / 90 * 100)}%`,
                          background: previsao.dias_previstos < 10 ? "#DC2626" : "#F59E0B",
                        }} />
                      </div>
                      <span style={{ fontSize: 10 }}>{previsao.dias_previstos} dias</span>
                    </td>
                    <td>{Math.round(previsao.probabilidade * 100)}%</td>
                    <td><Badge tipo={previsao.confianca === "alta" ? "sucesso" : previsao.confianca === "média" ? "aviso" : "neutro"}>{previsao.confianca}</Badge></td>
                    <td style={{ fontSize: 11, color: "var(--cor-texto-secundario)" }}>{previsao.fatores.join(" · ")}</td>
                    <td style={{ textAlign: "right" }}>
                      {previsao.resolvida ? (
                        <Badge tipo="sucesso">OS criada</Badge>
                      ) : (
                        <button className="botao botao--secundario" style={{ height: 28, fontSize: 11 }}
                          onClick={() => criarOrdem(previsao)}>
                          <Wrench size={12} /> Criar ordem
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previsoesDoDispositivo.length === 0 && (
              <p style={{ fontSize: 12, color: "var(--cor-texto-secundario)", padding: 24 }}>Sem previsões para este dispositivo.</p>
            )}
          </Card>

          <Card className="mt-6">
            <div className="flex align-center justify-between">
              <h2 className="card__titulo">Linha do tempo de manutenção</h2>
              <button className="link">Ver histórico completo →</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, ordensDoDispositivo.length)}, 1fr)`, gap: 16, marginTop: 24 }}>
              {ordensDoDispositivo.map((ordem) => (
                <div key={ordem.id} style={{ borderLeft: "3px solid var(--cor-primaria)", paddingLeft: 12 }}>
                  <CalendarClock size={15} color="var(--cor-primaria)" />
                  <p style={{ fontSize: 11, fontWeight: 700, marginTop: 6 }}>{ordem.titulo}</p>
                  <p style={{ fontSize: 10, color: "var(--cor-texto-secundario)" }}>
                    {ordem.data_prevista ?? "A agendar"} · {ordem.status}
                  </p>
                </div>
              ))}
              {ordensDoDispositivo.length === 0 && (
                <p className="subtitulo-pagina">Nenhuma ordem de serviço registrada para este dispositivo.</p>
              )}
            </div>
          </Card>
        </>
      )}
    </>
  );
}
