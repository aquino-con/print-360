import { useEffect, useState } from "react";
import { Activity, Network, Route, Save, ShieldCheck, Sparkles } from "lucide-react";
import { api } from "../api/cliente";
import { Campo, Card, CardKPI, Selecao, Toast, Toggle } from "../componentes/ui";
import { useAppStore } from "../estado/store";

const GRUPOS = [
  { id: "predicao", rotulo: "Predição", icone: Activity },
  { id: "roteamento", rotulo: "Roteamento", icone: Route },
  { id: "sincronizacao", rotulo: "Sincronização", icone: Network },
];

export function ConfiguracoesAvancadas() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [grupo, setGrupo] = useState("predicao");
  const [aviso, setAviso] = useState<string | null>(null);
  const notificar = useAppStore((estado) => estado.notificar);

  useEffect(() => {
    api.obterConfiguracoes().then(setConfig);
  }, []);

  const alterar = (chave: string, valor: string) =>
    setConfig((anterior) => ({ ...anterior, [chave]: valor }));

  const ligado = (chave: string) => config[chave] === "true";

  const salvar = async () => {
    try {
      await api.salvarConfiguracoes(config);
      notificar("Configurações avançadas salvas e auditadas.");
      setAviso("Configurações salvas com sucesso.");
      setTimeout(() => setAviso(null), 3500);
    } catch (erro) {
      setAviso(`Falha ao salvar: ${String(erro)}`);
    }
  };

  const ativos = [ligado("f2_predicao_ativa"), ligado("f2_roteamento_ativo"), ligado("f2_sync_ativa")].filter(Boolean).length;

  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1 className="titulo-pagina">Configurações Avançadas</h1>
          <p className="subtitulo-pagina">Habilite e calibre predição, roteamento e sincronização de forma incremental</p>
        </div>
        <div className="flex align-center gap-3">
          <span className="badge badge--info" style={{ background: "#EDE9FE", color: "#5B21B6" }}>
            <Sparkles size={11} /> Recursos avançados
          </span>
          <button className="botao botao--primario" onClick={salvar}><Save size={15} /> Salvar alterações</button>
        </div>
      </div>

      <div className="grade-kpis">
        <CardKPI rotulo="Módulos ativos" valor={`${ativos}/3`} icone={<ShieldCheck size={20} />} corFundo="#EDE9FE" corIcone="#7C3AED" />
        <CardKPI rotulo="Horizonte de previsão" valor={`${config.f2_horizonte_dias ?? 30} dias`} icone={<Activity size={20} />} corFundo="#DBEAFE" corIcone="#2563EB" />
        <CardKPI rotulo="Critério de roteamento" valor={config.f2_roteamento_criterio ?? "disponibilidade"} icone={<Route size={20} />} corFundo="#D1FAE5" corIcone="#047857" />
        <CardKPI rotulo="Transporte de sincronização" valor={config.f2_sync_transporte === "http" ? "HTTP (nuvem)" : "Arquivo / LAN"} icone={<Network size={20} />} corFundo="#FEF3C7" corIcone="#B45309" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "216px 1fr", gap: 20 }}>
        <Card style={{ padding: 12, alignSelf: "start" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--cor-texto-claro)", letterSpacing: 1, padding: "8px 12px 12px" }}>MÓDULOS</div>
          <div style={{ display: "grid", gap: 4 }}>
            {GRUPOS.map((item) => {
              const Icone = item.icone;
              const ativo = item.id === grupo;
              return (
                <button key={item.id} onClick={() => setGrupo(item.id)}
                  className={`nav-item ${ativo ? "nav-item--ativo" : ""}`}
                  style={{ background: ativo ? "#F5F3FF" : undefined, color: ativo ? "#5B21B6" : "#475569" }}>
                  <Icone size={17} /> <span style={{ fontSize: 12 }}>{item.rotulo}</span>
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 24, borderTop: "1px solid var(--cor-fundo)", padding: "12px 12px 0", fontSize: 10, color: "var(--cor-texto-claro)" }}>
            Identificador: <strong>{config.f2_instalacao_id ?? "matriz-sp"}</strong>
          </div>
        </Card>

        <div style={{ display: "grid", gap: 20 }}>
          {grupo === "predicao" && (
            <Card>
              <div className="flex align-center gap-3">
                <Activity size={18} color="#7C3AED" />
                <h2 className="card__titulo">Predição</h2>
              </div>
              <p className="subtitulo-pagina">Modelo heurístico plugável · substituível por adaptador de ML</p>
              <div style={{ marginTop: 20 }}>
                <Toggle rotulo="Manutenção preditiva" descricao="Health score, previsões e ordens de serviço"
                  ativo={ligado("f2_predicao_ativa")}
                  aoAlterar={(valor) => alterar("f2_predicao_ativa", String(valor))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 24 }}>
                <Selecao rotulo="Horizonte padrão" id="f2-horizonte" opcoes={["7", "30", "90"]}
                  value={config.f2_horizonte_dias ?? "30"} onChange={(e) => alterar("f2_horizonte_dias", e.target.value)} />
                <Campo rotulo="Confiança mínima (0 a 1)" id="f2-confianca" value={config.f2_confianca_minima ?? "0.7"}
                  onChange={(e) => alterar("f2_confianca_minima", e.target.value)} />
              </div>
              <p style={{ fontSize: 10, color: "var(--cor-texto-claro)", marginTop: 16 }}>
                Toda previsão exibe fatores e confiança, independentemente do modelo escolhido.
              </p>
            </Card>
          )}

          {grupo === "roteamento" && (
            <Card>
              <div className="flex align-center gap-3">
                <Route size={18} color="#7C3AED" />
                <h2 className="card__titulo">Roteamento</h2>
              </div>
              <p className="subtitulo-pagina">Critérios de escolha e segurança de ativação</p>
              <div style={{ marginTop: 20 }}>
                <Toggle rotulo="Roteamento automático" descricao="Regras, simulação e fallback"
                  ativo={ligado("f2_roteamento_ativo")}
                  aoAlterar={(valor) => alterar("f2_roteamento_ativo", String(valor))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 24 }}>
                <Selecao rotulo="Critério padrão" id="f2-criterio"
                  opcoes={["disponibilidade", "proximidade", "menor_custo", "menor_carga"]}
                  value={config.f2_roteamento_criterio ?? "disponibilidade"}
                  onChange={(e) => alterar("f2_roteamento_criterio", e.target.value)} />
                <Campo rotulo="Tentativas de fallback" id="f2-fallback" type="number"
                  value={config.f2_roteamento_fallback_tentativas ?? "2"}
                  onChange={(e) => alterar("f2_roteamento_fallback_tentativas", e.target.value)} />
              </div>
              <div style={{ marginTop: 20, background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 8, padding: 12, fontSize: 11, color: "#5B21B6" }}>
                A simulação antes de ativar uma regra é obrigatória e não pode ser desligada.
              </div>
            </Card>
          )}

          {grupo === "sincronizacao" && (
            <Card>
              <div className="flex align-center gap-3">
                <Network size={18} color="#7C3AED" />
                <h2 className="card__titulo">Sincronização</h2>
              </div>
              <p className="subtitulo-pagina">Transporte, frequência, entidades e política de conflito</p>
              <div style={{ marginTop: 20 }}>
                <Toggle rotulo="Sincronização entre instalações" descricao="Outbox, transporte e conflitos"
                  ativo={ligado("f2_sync_ativa")}
                  aoAlterar={(valor) => alterar("f2_sync_ativa", String(valor))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 24 }}>
                <Selecao rotulo="Transporte" id="f2-transporte" opcoes={["arquivo", "http"]}
                  value={config.f2_sync_transporte ?? "arquivo"} onChange={(e) => alterar("f2_sync_transporte", e.target.value)} />
                <Campo rotulo="Intervalo (min)" id="f2-intervalo" type="number"
                  value={config.f2_sync_intervalo_min ?? "15"} onChange={(e) => alterar("f2_sync_intervalo_min", e.target.value)} />
                <Selecao rotulo="Política de conflito" id="f2-politica" opcoes={["manual", "recente", "origem"]}
                  value={config.f2_sync_conflito_policy ?? "manual"} onChange={(e) => alterar("f2_sync_conflito_policy", e.target.value)} />
              </div>
              {config.f2_sync_transporte === "http" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
                  <Campo rotulo="URL base" id="f2-url" value={config.f2_sync_url ?? ""} onChange={(e) => alterar("f2_sync_url", e.target.value)} />
                  <Campo rotulo="Token de acesso" id="f2-token" type="password" value={config.f2_sync_token ?? ""} onChange={(e) => alterar("f2_sync_token", e.target.value)} />
                </div>
              )}
              <p style={{ fontSize: 10, color: "var(--cor-texto-claro)", marginTop: 16 }}>
                Documentos e dados de impressão nunca são sincronizados.
              </p>
            </Card>
          )}
        </div>
      </div>

      <Toast mensagem={aviso} />
    </>
  );
}
