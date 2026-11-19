import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Check, TriangleAlert } from "lucide-react";
import { api } from "../../api/cliente";
import type { Alerta } from "../../tipos";
import { Badge } from "../ui";
import { useEventos, EVENTOS } from "../../hooks/useEventos";
import { useAppStore } from "../../estado/store";

const TIPO_BADGE: Record<string, "sucesso" | "aviso" | "perigo" | "info" | "neutro"> = {
  critico: "perigo",
  aviso: "aviso",
  info: "info",
};

export function CentralDeAlertas() {
  const aberta = useAppStore((estado) => estado.centralAlertasAberta);
  const fechar = useAppStore((estado) => estado.fecharCentralAlertas);
  const notificar = useAppStore((estado) => estado.notificar);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const painel = useRef<HTMLElement>(null);

  const carregar = useCallback(() => {
    api.listarAlertas(true).then(setAlertas);
  }, []);

  useEffect(() => {
    if (aberta) carregar();
  }, [aberta, carregar]);

  useEffect(() => {
    if (!aberta) return;
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") fechar();
    };
    document.addEventListener("keydown", aoTeclar);
    painel.current?.focus();
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberta, fechar]);

  useEventos(EVENTOS.alertas, carregar);

  if (!aberta) return null;

  const resolver = async (id: number) => {
    try {
      await api.resolverAlerta(id);
      notificar("Alerta marcado como resolvido.");
      carregar();
    } catch (erro) {
      notificar(`Falha ao resolver alerta: ${String(erro)}`);
    }
  };

  const pendentes = alertas.filter((alerta) => !alerta.resolvido);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,.4)",
        display: "flex",
        justifyContent: "flex-end",
        zIndex: 55,
      }}
      onClick={fechar}
    >
      <aside
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-label="Central de Alertas"
        tabIndex={-1}
        className="card"
        style={{
          width: 430,
          height: "100%",
          borderRadius: 0,
          boxShadow: "var(--sombra-elevada)",
          overflowY: "auto",
          outline: "none",
        }}
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="flex align-center justify-between" style={{ marginBottom: 24 }}>
          <div>
            <h2 className="secao-titulo">Central de Alertas</h2>
            <p className="subtitulo-pagina">{pendentes.length} alertas pendentes</p>
          </div>
          <button className="botao--icone" onClick={fechar} aria-label="Fechar">
            ✕
          </button>
        </div>

        {pendentes.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 16px", color: "var(--cor-texto-secundario)" }}>
            <Bell size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
            <p style={{ fontSize: 13 }}>Nenhum alerta pendente. Tudo em ordem!</p>
          </div>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          {pendentes.map((alerta) => (
            <div
              key={alerta.id}
              style={{
                border: "1px solid var(--cor-borda)",
                borderRadius: "var(--raio-md)",
                padding: 14,
                borderLeft: `4px solid ${
                  alerta.severidade === "critico" ? "var(--cor-perigo)" : "var(--cor-aviso)"
                }`,
              }}
            >
              <div className="flex align-center justify-between gap-2">
                <strong style={{ fontSize: 12 }}>{alerta.titulo}</strong>
                <Badge tipo={TIPO_BADGE[alerta.severidade] ?? "neutro"}>
                  {alerta.severidade === "critico" && <TriangleAlert size={11} />}
                  {alerta.severidade}
                </Badge>
              </div>
              {alerta.mensagem && (
                <p style={{ fontSize: 11, color: "var(--cor-texto-secundario)", marginTop: 6 }}>
                  {alerta.mensagem}
                </p>
              )}
              <div className="flex align-center justify-between" style={{ marginTop: 12 }}>
                <span style={{ fontSize: 10, color: "var(--cor-texto-claro)" }}>
                  {new Date(alerta.criado_em).toLocaleString("pt-BR")}
                </span>
                <button className="link" onClick={() => resolver(alerta.id)}>
                  <Check size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
                  Resolver
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
