import { useCallback, useEffect, useState } from "react";
import { Package, RefreshCw, TriangleAlert } from "lucide-react";
import { api } from "../api/cliente";
import type { GrupoSuprimento, Suprimento as TipoSuprimento } from "../tipos";
import { BadgeStatus, BarraProgresso, Campo, Card, CardKPI, Modal, corNivel } from "../componentes/ui";
import { useAtualizacoes } from "../hooks/useEventos";
import { useAppStore } from "../estado/store";

export function Suprimentos() {
  const [grupos, setGrupos] = useState<GrupoSuprimento[]>([]);
  const [troca, setTroca] = useState<TipoSuprimento | null>(null);
  const [responsavel, setResponsavel] = useState("Ana Souza");
  const notificar = useAppStore((estado) => estado.notificar);
  const abrirCentral = useAppStore((estado) => estado.abrirCentralAlertas);

  const carregar = useCallback(() => {
    api.listarSuprimentos().then(setGrupos);
  }, []);

  useEffect(carregar, [carregar]);
  useAtualizacoes(carregar);

  const itens = grupos.flatMap((grupo) => grupo.itens);
  const baixos = itens.filter((item) => item.nivel < 20).length;
  const esgotados = itens.filter((item) => item.nivel === 0).length;

  const registrar = async () => {
    if (!troca) return;
    try {
      await api.registrarTroca(troca.impressora_id, troca.tipo, responsavel || "Não informado");
      notificar(`Troca de ${troca.tipo_rotulo} registrada em ${troca.impressora}.`);
      setTroca(null);
      carregar();
    } catch (erro) {
      notificar(`Falha ao registrar troca: ${String(erro)}`);
    }
  };

  const previsao = (item: TipoSuprimento) => {
    if (item.previsao_dias === null) return "sem dados";
    if (item.previsao_dias <= 0) return "esgotado";
    return `~ ${item.previsao_dias} dias`;
  };

  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1 className="titulo-pagina">Suprimentos</h1>
          <p className="subtitulo-pagina">Acompanhe os níveis e antecipe trocas antes da falha</p>
        </div>
        <button className="botao botao--secundario" onClick={carregar}>
          <RefreshCw size={15} /> Atualizar
        </button>
      </div>

      <div className="grade-kpis">
        <CardKPI rotulo="Itens monitorados" valor={String(itens.length)} icone={<Package size={20} />} corFundo="#dbeafe" corIcone="#2563eb" />
        <CardKPI rotulo="Nível baixo" valor={String(baixos)} icone={<TriangleAlert size={20} />} corFundo="#fef3c7" corIcone="#f59e0b" />
        <CardKPI rotulo="Esgotados" valor={String(esgotados)} icone={<TriangleAlert size={20} />} corFundo="#fee2e2" corIcone="#ef4444" />
        <CardKPI rotulo="Com previsão" valor={String(itens.filter((i) => i.previsao_dias !== null).length)} icone={<Package size={20} />} corFundo="#cffafe" corIcone="#0891b2" />
      </div>

      {(baixos > 0 || esgotados > 0) && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <TriangleAlert size={20} color="#ef4444" />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#991b1b" }}>
            Atenção: {esgotados} itens esgotados e {baixos} com nível baixo exigem ação
          </span>
          <button className="link" style={{ marginLeft: "auto" }} onClick={abrirCentral}>
            Ver todos os alertas →
          </button>
        </div>
      )}

      <Card>
        <div className="flex align-center justify-between" style={{ marginBottom: 8 }}>
          <h2 className="card__titulo">Níveis de suprimento por impressora</h2>
          <span style={{ fontSize: 10, color: "var(--cor-texto-claro)" }}>Sincronizado automaticamente</span>
        </div>

        {grupos.length === 0 && (
          <p style={{ fontSize: 12, color: "var(--cor-texto-secundario)", padding: "24px 0" }}>
            Nenhum suprimento monitorado ainda. Eles são criados automaticamente quando uma
            impressora é descoberta.
          </p>
        )}

        {grupos.map((grupo) => (
          <div key={grupo.impressora_id} style={{ padding: "16px 0", borderBottom: "1px solid var(--cor-fundo)" }}>
            <div className="flex align-center gap-3" style={{ marginBottom: 14 }}>
              <span style={{ width: 6, height: 18, borderRadius: 3, background: "var(--cor-primaria)" }} />
              <strong style={{ fontSize: 12 }}>{grupo.impressora}</strong>
              <span style={{ marginLeft: "auto" }}><BadgeStatus status={grupo.status} /></span>
            </div>
            <div style={{ display: "grid", gap: 12, paddingLeft: 18 }}>
              {grupo.itens.map((item) => {
                const tipo = corNivel(item.nivel);
                return (
                  <div key={item.id} style={{ display: "grid", gridTemplateColumns: "160px 1fr 55px 130px 70px", alignItems: "center", gap: 16, fontSize: 11 }}>
                    <span>{item.tipo_rotulo}</span>
                    <BarraProgresso valor={item.nivel} tipo={tipo} />
                    <strong style={{ color: `var(--cor-${tipo})` }}>{item.nivel}%</strong>
                    <span style={{ color: "var(--cor-texto-claro)" }}>{previsao(item)}</span>
                    <button className="link" style={{ textAlign: "right" }} onClick={() => setTroca(item)}>
                      Registrar troca
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </Card>

      <Modal aberto={troca !== null} titulo="Registrar troca de suprimento" aoFechar={() => setTroca(null)}>
        {troca && (
          <>
            <p style={{ fontSize: 13, color: "var(--cor-texto-secundario)" }}>
              Confirmar a troca de <strong>{troca.tipo_rotulo}</strong> em{" "}
              <strong>{troca.impressora}</strong>? O nível será resetado para 100%.
            </p>
            <div className="mt-4">
              <Campo rotulo="Responsável pela troca" id="responsavel-troca" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
            </div>
            <div className="flex justify-between mt-6">
              <button className="botao botao--secundario" onClick={() => setTroca(null)}>Cancelar</button>
              <button className="botao botao--primario" onClick={registrar}>Confirmar troca</button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
