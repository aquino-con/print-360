import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  FileText,
  Package,
  Printer,
  RefreshCw,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { api } from "../api/cliente";
import type { Alerta, AtividadeItem, Impressora, Relatorio, ResumoDashboard } from "../tipos";
import { Badge, BadgeStatus, Card, CardKPI, GraficoArea } from "../componentes/ui";
import { useAtualizacoes } from "../hooks/useEventos";

const ICONES: Record<string, { icone: typeof FileText; cor: string }> = {
  trabalho: { icone: FileText, cor: "#2563EB" },
  alerta: { icone: TriangleAlert, cor: "#DC2626" },
  manutencao: { icone: Wrench, cor: "#7C3AED" },
};

function tempoRelativo(iso: string): string {
  const minutos = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  return `há ${Math.round(horas / 24)} d`;
}

export function VisaoGeral() {
  const [resumo, setResumo] = useState<ResumoDashboard | null>(null);
  const [impressoras, setImpressoras] = useState<Impressora[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [atividade, setAtividade] = useState<AtividadeItem[]>([]);
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);

  const carregar = useCallback(() => {
    api.obterResumo().then(setResumo);
    api.listarImpressoras().then(setImpressoras);
    api.listarAlertas(true).then(setAlertas);
    api.obterAtividade().then(setAtividade);
    api.obterRelatorio(12).then(setRelatorio);
  }, []);

  useEffect(carregar, [carregar]);
  useAtualizacoes(carregar);

  const criticos = alertas.filter((alerta) => alerta.severidade === "critico").length;
  const percentualOnline = impressoras.length
    ? Math.round(((resumo?.impressoras_ativas ?? 0) / impressoras.length) * 100)
    : 0;

  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1 className="titulo-pagina">Visão Geral</h1>
          <p className="subtitulo-pagina">
            Panorama da operação de impressão · {new Date().toLocaleDateString("pt-BR", {
              weekday: "long", day: "2-digit", month: "long", year: "numeric",
            })}
          </p>
        </div>
        <button className="botao botao--primario" onClick={carregar}>
          <RefreshCw size={15} /> Atualizar
        </button>
      </div>

      <div className="grade-kpis">
        <CardKPI rotulo="Páginas impressas" valor={(resumo?.paginas_hoje ?? 0).toLocaleString("pt-BR")}
          icone={<FileText size={20} />} corFundo="#dbeafe" corIcone="#2563eb" />
        <CardKPI rotulo="Custo estimado" valor={`R$ ${(resumo?.custo_mes ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          icone={<Printer size={20} />} corFundo="#cffafe" corIcone="#0891b2"
          variacao={relatorio ? `${relatorio.economia_percentual.toFixed(1).replace(".", ",")}% vs. anterior` : undefined}
          tipoVariacao={relatorio && relatorio.economia_percentual < 0 ? "sucesso" : "aviso"} />
        <CardKPI rotulo="Impressoras ativas" valor={String(resumo?.impressoras_ativas ?? 0)}
          icone={<Printer size={20} />} corFundo="#d1fae5" corIcone="#10b981"
          variacao={`${percentualOnline}% online`} tipoVariacao="info" />
        <CardKPI rotulo="Alertas pendentes" valor={String(resumo?.alertas_pendentes ?? 0)}
          icone={<Bell size={20} />} corFundo="#fee2e2" corIcone="#b91c1c"
          variacao={`${criticos} críticos`} tipoVariacao="perigo" />
      </div>

      <div className="grade-2">
        <Card>
          <h2 className="card__titulo">Volume de impressão</h2>
          <p className="subtitulo-pagina">Custo mensal consolidado · últimos 12 meses</p>
          <div className="mt-4">
            <GraficoArea dados={(relatorio?.evolucao ?? []).map((ponto) => ({ nome: ponto.nome, valor: ponto.valor }))} />
          </div>
        </Card>

        <Card>
          <div className="flex align-center justify-between">
            <h2 className="card__titulo">Status da frota</h2>
            <button className="link" onClick={() => undefined}>Ver todos</button>
          </div>
          <div className="mt-4" style={{ display: "grid", gap: 14 }}>
            {impressoras.slice(0, 5).map((impressora) => (
              <div key={impressora.id} className="flex align-center justify-between">
                <span style={{ fontSize: 12, fontWeight: 600 }}>{impressora.nome}</span>
                <BadgeStatus status={impressora.status} />
              </div>
            ))}
            {impressoras.length === 0 && <p className="subtitulo-pagina">Nenhuma impressora cadastrada.</p>}
          </div>
        </Card>
      </div>

      <div className="grade-2 mt-6">
        <Card>
          <h2 className="card__titulo">Atividade recente</h2>
          <div className="mt-4" style={{ display: "grid", gap: 14 }}>
            {atividade.slice(0, 5).map((item, indice) => {
              const info = ICONES[item.tipo] ?? { icone: Package, cor: "#64748B" };
              const Icone = info.icone;
              return (
                <div key={`${item.titulo}-${indice}`} className="flex align-center gap-3">
                  <span style={{ width: 28, height: 28, borderRadius: "50%", background: `${info.cor}1f`, color: info.cor, display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <Icone size={14} />
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{item.titulo}</div>
                    <div style={{ fontSize: 10, color: "var(--cor-texto-claro)" }}>{item.detalhe}</div>
                  </div>
                  <span style={{ fontSize: 10, color: "var(--cor-texto-claro)" }}>{tempoRelativo(item.ocorrido_em)}</span>
                </div>
              );
            })}
            {atividade.length === 0 && <p className="subtitulo-pagina">Nenhuma atividade registrada.</p>}
          </div>
        </Card>

        <Card>
          <h2 className="card__titulo">Alertas recentes</h2>
          <div className="mt-4" style={{ display: "grid", gap: 16 }}>
            {alertas.slice(0, 3).map((alerta) => (
              <div key={alerta.id}>
                <Badge tipo={alerta.severidade === "critico" ? "perigo" : alerta.severidade === "aviso" ? "aviso" : "info"}>
                  {alerta.severidade === "critico" ? <TriangleAlert size={12} /> : <Bell size={12} />}
                  {alerta.titulo}
                </Badge>
                <p className="subtitulo-pagina">{alerta.mensagem ?? "—"}</p>
              </div>
            ))}
            {alertas.length === 0 && <p className="subtitulo-pagina">Nenhum alerta pendente.</p>}
          </div>
        </Card>
      </div>
    </>
  );
}
