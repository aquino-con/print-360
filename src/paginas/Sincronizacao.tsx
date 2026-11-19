import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Network, RefreshCw, Sparkles } from "lucide-react";
import { api } from "../api/cliente";
import type { Instalacao, MudancaOutbox, ResultadoSync, StatusSync } from "../tipos";
import { Badge, Card, CardKPI } from "../componentes/ui";
import { useEventos } from "../hooks/useEventos";
import { useAppStore } from "../estado/store";

const ESTADO_INSTALACAO = (instalacao: Instalacao, matrizId: string) => {
  if (instalacao.id === matrizId) return { tipo: "info" as const, rotulo: "Esta instalação", cor: "#7C3AED" };
  const atrasada = instalacao.ultima_sincronizacao
    ? Date.now() - new Date(instalacao.ultima_sincronizacao).getTime() > 30 * 60 * 1000
    : true;
  if (atrasada) return { tipo: "aviso" as const, rotulo: "Pendente", cor: "#F59E0B" };
  return { tipo: "sucesso" as const, rotulo: "Sincronizado", cor: "#10B981" };
};

export function Sincronizacao() {
  const [status, setStatus] = useState<StatusSync | null>(null);
  const [outbox, setOutbox] = useState<MudancaOutbox[]>([]);
  const [resultado, setResultado] = useState<ResultadoSync | null>(null);
  const [sincronizando, setSincronizando] = useState(false);
  const notificar = useAppStore((estado) => estado.notificar);

  const carregar = useCallback(() => {
    api.obterStatusSync().then(setStatus);
    api.listarOutbox().then(setOutbox);
  }, []);

  useEffect(carregar, [carregar]);
  useEventos("sync_concluida", carregar);
  useEventos("conflito_detectado", carregar);

  const sincronizar = async () => {
    setSincronizando(true);
    try {
      const resultado = await api.sincronizarAgora();
      setResultado(resultado);
      notificar(`Sincronização concluída: ${resultado.enviados} enviados, ${resultado.recebidos} recebidos.`);
      carregar();
    } catch (erro) {
      notificar(`Falha na sincronização: ${String(erro)}`);
    } finally {
      setSincronizando(false);
    }
  };

  const alternar = async () => {
    if (!status) return;
    const config = await api.obterConfiguracoes();
    await api.salvarConfiguracoes({ ...config, f2_sync_ativa: String(!status.ativa) });
    notificar(status.ativa ? "Sincronização automática desativada." : "Sincronização automática ativada.");
    carregar();
  };

  const resolver = async (id: number, vencedor: "local" | "remoto") => {
    try {
      await api.resolverConflitoSync(id, vencedor);
      notificar("Conflito resolvido.");
      carregar();
    } catch (erro) {
      notificar(`Falha ao resolver conflito: ${String(erro)}`);
    }
  };

  const outras = status?.instalacoes.filter((item) => item.id !== status.instalacao_id) ?? [];
  const matriz = status?.instalacoes.find((item) => item.id === status.instalacao_id);

  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1 className="titulo-pagina">Sincronização entre Instalações</h1>
          <p className="subtitulo-pagina">Topologia, fila de mudanças e resolução de conflitos entre filiais</p>
        </div>
        <div className="flex align-center gap-3">
          <span style={{ fontSize: 12, fontWeight: 600 }}>Sincronização automática</span>
          <button role="switch" aria-checked={status?.ativa ?? false} aria-label="Sincronização automática"
            className={`toggle ${status?.ativa ? "toggle--ativo" : ""}`} onClick={alternar}>
            <span className="toggle__bolinha" />
          </button>
          <button className="botao botao--secundario" onClick={sincronizar} disabled={sincronizando}>
            <RefreshCw size={15} className={sincronizando ? "spin" : ""} /> {sincronizando ? "Sincronizando…" : "Sincronizar agora"}
          </button>
          <span className="badge badge--info" style={{ background: "#EDE9FE", color: "#5B21B6" }}>
            <Sparkles size={11} /> Recursos Avançados
          </span>
        </div>
      </div>

      <div className="grade-kpis">
        <CardKPI rotulo="Instalações ativas" valor={String(status?.instalacoes.length ?? 0)} icone={<Network size={20} />} corFundo="#DBEAFE" corIcone="#2563EB" />
        <CardKPI rotulo="Pendências no outbox" valor={String(status?.pendencias ?? 0)} icone={<Clock3 size={20} />} corFundo="#FEF3C7" corIcone="#B45309" />
        <CardKPI rotulo="Conflitos pendentes" valor={String(status?.conflitos_pendentes ?? 0)} icone={<AlertTriangle size={20} />} corFundo="#FEE2E2" corIcone="#DC2626" />
        <CardKPI rotulo="Último ciclo" valor={resultado ? `${resultado.duracao_ms} ms` : (status?.ciclos[0] ? new Date(status.ciclos[0].realizada_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—")} icone={<CheckCircle2 size={20} />} corFundo="#D1FAE5" corIcone="#047857" />
      </div>

      <Card>
        <div className="flex align-center justify-between">
          <h2 className="card__titulo">Topologia de instalações</h2>
          <span style={{ fontSize: 10, color: "var(--cor-texto-claro)" }}>
            Transporte: {resultado?.transporte ?? "Arquivo / LAN"}
          </span>
        </div>

        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "240px 1fr", gap: 40, marginTop: 24, alignItems: "center" }}>
          {matriz && (
            <div style={{ background: "#0F172A", borderRadius: 14, padding: 20, color: "#fff" }}>
              <Network size={20} color="#C4B5FD" />
              <p style={{ fontSize: 14, fontWeight: 700, marginTop: 10 }}>{matriz.nome}</p>
              <span style={{ display: "inline-block", marginTop: 8, fontSize: 9, fontWeight: 700, color: "#C4B5FD", background: "#1E293B", padding: "3px 10px", borderRadius: 999 }}>
                ESTA INSTALAÇÃO
              </span>
              <p style={{ fontSize: 10, color: "#94A3B8", marginTop: 12 }}>{status?.instalacoes.length ?? 0} nós na malha</p>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {outras.map((instalacao) => {
              const estado = ESTADO_INSTALACAO(instalacao, status?.instalacao_id ?? "");
              return (
                <div key={instalacao.id} style={{ border: `2px solid ${estado.cor}`, borderRadius: 12, padding: 14, background: "#fff" }}>
                  <div className="flex align-center gap-2">
                    <span style={{ width: 8, height: 8, borderRadius: 4, background: estado.cor }} />
                    <strong style={{ fontSize: 12, flex: 1 }}>{instalacao.nome}</strong>
                  </div>
                  <div style={{ marginTop: 10 }}><Badge tipo={estado.tipo}>{estado.rotulo}</Badge></div>
                  <p style={{ fontSize: 10, color: "var(--cor-texto-claro)", marginTop: 8 }}>
                    {instalacao.site ?? "—"} · {instalacao.ultima_sincronizacao
                      ? new Date(instalacao.ultima_sincronizacao).toLocaleString("pt-BR")
                      : "nunca sincronizado"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="mt-6" style={{ display: "grid", gridTemplateColumns: "540px 300px 1fr", gap: 20 }}>
        <Card>
          <h2 className="card__titulo">Fila de mudanças (outbox)</h2>
          <p className="subtitulo-pagina">{status?.pendencias ?? 0} pendentes · cotas, regras e configurações</p>
          <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
            {outbox.map((item) => (
              <div key={item.id} className="flex align-center justify-between" style={{ fontSize: 11, borderBottom: "1px solid var(--cor-fundo)", paddingBottom: 8 }}>
                <span className="tabela__principal">{item.entidade} #{item.entidade_id}</span>
                <span>{item.operacao}</span>
                <span>v{item.versao}</span>
                <span style={{ color: "var(--cor-texto-secundario)" }}>{item.instalacao_origem}</span>
              </div>
            ))}
            {outbox.length === 0 && <p className="subtitulo-pagina">Nenhuma mudança pendente.</p>}
          </div>
          <p style={{ fontSize: 10, color: "var(--cor-texto-claro)", marginTop: 12 }}>
            Documentos e dados de impressão nunca entram no outbox.
          </p>
        </Card>

        <Card>
          <h2 className="card__titulo">Histórico de ciclos</h2>
          <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
            {(status?.ciclos ?? []).map((ciclo) => (
              <div key={ciclo.id} style={{ borderRadius: 8, padding: 10, background: ciclo.status === "sucesso" ? "#F0FDF4" : "#FFFBEB" }}>
                <div className="flex align-center gap-2">
                  <span style={{ width: 7, height: 7, borderRadius: 4, background: ciclo.status === "sucesso" ? "#10B981" : "#F59E0B" }} />
                  <strong style={{ fontSize: 10, color: ciclo.status === "sucesso" ? "#047857" : "#B45309" }}>
                    {ciclo.status === "sucesso" ? "Sucesso" : "Parcial"}
                  </strong>
                </div>
                <p style={{ fontSize: 10, color: "var(--cor-texto-secundario)", marginTop: 4 }}>
                  {new Date(ciclo.realizada_em).toLocaleString("pt-BR")}
                </p>
                <p style={{ fontSize: 10, color: "var(--cor-texto-claro)" }}>{ciclo.detalhe}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="card__titulo">Conflitos</h2>
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {(status?.conflitos ?? []).filter((conflito) => conflito.estado === "pendente").map((conflito) => (
              <div key={conflito.id} style={{ border: "1px solid #FECACA", borderLeft: "4px solid #DC2626", borderRadius: 10, padding: 12 }}>
                <div className="flex align-center gap-2">
                  <AlertTriangle size={14} color="#DC2626" />
                  <strong style={{ fontSize: 11, color: "#B91C1C" }}>{conflito.entidade} #{conflito.entidade_id}</strong>
                </div>
                <p style={{ fontSize: 10, color: "var(--cor-texto-secundario)", marginTop: 6 }}>
                  versão local × remota · {new Date(conflito.detectado_em).toLocaleString("pt-BR")}
                </p>
                <div className="flex gap-2" style={{ marginTop: 10 }}>
                  <button className="botao botao--secundario" style={{ height: 26, fontSize: 10 }} onClick={() => resolver(conflito.id, "local")}>Manter local</button>
                  <button className="botao botao--primario" style={{ height: 26, fontSize: 10 }} onClick={() => resolver(conflito.id, "remoto")}>Usar remota</button>
                </div>
              </div>
            ))}
            {(status?.conflitos.length ?? 0) === 0 && (
              <p className="subtitulo-pagina">Nenhum conflito pendente. Tudo em ordem!</p>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
