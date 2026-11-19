import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Download,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  X,
} from "lucide-react";
import { api } from "../api/cliente";
import type { Impressora, Trabalho } from "../tipos";
import { BadgeStatus, Card, CardKPI, Modal } from "../componentes/ui";
import { useAtualizacoes } from "../hooks/useEventos";
import { useAppStore } from "../estado/store";

export function FilaImpressao() {
  const [trabalhos, setTrabalhos] = useState<Trabalho[]>([]);
  const [impressoras, setImpressoras] = useState<Impressora[]>([]);
  const [confirmar, setConfirmar] = useState<Trabalho | null>(null);
  const notificar = useAppStore((estado) => estado.notificar);

  const carregar = useCallback(() => {
    api.listarTrabalhos().then(setTrabalhos);
    api.listarImpressoras().then(setImpressoras);
  }, []);

  useEffect(carregar, [carregar]);
  useAtualizacoes(carregar);

  const executar = async (trabalho: Trabalho, acao: "pausar" | "retomar" | "reiniciar") => {
    const funcoes = {
      pausar: api.pausarTrabalho,
      retomar: api.retomarTrabalho,
      reiniciar: api.reiniciarTrabalho,
    };
    try {
      await funcoes[acao](trabalho.id);
      notificar(`Trabalho "${trabalho.documento}" ${acao === "pausar" ? "pausado" : acao === "retomar" ? "retomado" : "reiniciado"}.`);
      carregar();
    } catch (erro) {
      notificar(`Falha ao executar ação: ${String(erro)}`);
    }
  };

  const confirmarCancelamento = async () => {
    if (!confirmar) return;
    try {
      await api.cancelarTrabalho(confirmar.id);
      notificar(`Trabalho "${confirmar.documento}" cancelado.`);
      carregar();
    } catch (erro) {
      notificar(`Falha ao cancelar: ${String(erro)}`);
    } finally {
      setConfirmar(null);
    }
  };

  const acoes = (trabalho: Trabalho) => {
    if (trabalho.status === "concluido") return <Download size={15} color="#64748b" />;
    if (trabalho.status === "cancelado") return <span style={{ color: "#94a3b8" }}>—</span>;
    if (trabalho.status === "pausado" || trabalho.status === "pendente") {
      return <Play size={15} color="#f59e0b" onClick={() => executar(trabalho, "retomar")} style={{ cursor: "pointer" }} />;
    }
    if (trabalho.status === "erro") {
      return <RotateCcw size={15} color="#ef4444" onClick={() => executar(trabalho, "reiniciar")} style={{ cursor: "pointer" }} />;
    }
    return (
      <>
        <Pause size={15} color="#64748b" onClick={() => executar(trabalho, "pausar")} style={{ cursor: "pointer" }} />
        <X size={15} color="#ef4444" onClick={() => setConfirmar(trabalho)} style={{ cursor: "pointer", marginLeft: 8 }} />
      </>
    );
  };

  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1 className="titulo-pagina">Fila de Impressão</h1>
          <p className="subtitulo-pagina">Gerencie os trabalhos pendentes e em andamento em tempo real</p>
        </div>
      </div>

      <div className="grade-kpis">
        <CardKPI rotulo="Na fila" valor={String(trabalhos.filter((item) => item.status === "pendente").length)} icone={<Clock3 size={20} />} corFundo="#f1f5f9" corIcone="#475569" variacao="aguardando" tipoVariacao="info" />
        <CardKPI rotulo="Em processamento" valor={String(trabalhos.filter((item) => item.status === "processando").length)} icone={<Loader2 size={20} />} corFundo="#dbeafe" corIcone="#2563eb" variacao="ativos" />
        <CardKPI rotulo="Pausados" valor={String(trabalhos.filter((item) => item.status === "pausado").length)} icone={<Pause size={20} />} corFundo="#fef3c7" corIcone="#b45309" variacao="manual" tipoVariacao="aviso" />
        <CardKPI rotulo="Concluídos" valor={String(trabalhos.filter((item) => item.status === "concluido").length)} icone={<CheckCircle2 size={20} />} corFundo="#d1fae5" corIcone="#047857" />
      </div>

      <Card>
        <div className="flex align-center gap-3" style={{ marginBottom: 16 }}>
          <input className="campo__entrada" style={{ width: 300 }} placeholder="Buscar documento..." />
          <select className="campo__entrada" style={{ width: 180 }} defaultValue="Todos">
            <option>Todos</option><option>Processando</option><option>Concluído</option>
          </select>
          <select className="campo__entrada" style={{ width: 200 }} defaultValue="Todas" aria-label="Filtrar por impressora">
            <option>Todas</option>
            {impressoras.map((impressora) => <option key={impressora.id}>{impressora.nome}</option>)}
          </select>
          <button className="botao botao--secundario" style={{ marginLeft: "auto" }} onClick={carregar}>
            Atualizar
          </button>
        </div>

        <table className="tabela">
          <thead>
            <tr>
              <th>Documento</th><th>Usuário</th><th>Impressora</th><th>Páginas</th>
              <th>Progresso</th><th>Status</th><th style={{ textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {trabalhos.map((trabalho) => (
              <tr key={trabalho.id}>
                <td>
                  <div className="tabela__principal">{trabalho.documento}</div>
                  <div className="tabela__secundario">{trabalho.paginas} pág.</div>
                </td>
                <td>{trabalho.usuario ?? "—"}</td>
                <td>{trabalho.impressora}</td>
                <td>{trabalho.paginas}</td>
                <td style={{ width: 130 }}>
                  <div className="barra">
                    <div className="barra__preenchimento" style={{ width: `${trabalho.progresso}%` }} />
                  </div>
                  <span style={{ fontSize: 10, color: "var(--cor-texto-claro)" }}>{trabalho.progresso}%</span>
                </td>
                <td><BadgeStatus status={trabalho.status} /></td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>{acoes(trabalho)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex align-center justify-between" style={{ marginTop: 16, fontSize: 12, color: "var(--cor-texto-secundario)" }}>
          <span>Mostrando <strong>{trabalhos.length}</strong> trabalhos</span>
          <div className="flex gap-2">
            <button className="botao botao--secundario">Anterior</button>
            <button className="botao botao--primario">Próxima</button>
          </div>
        </div>
      </Card>

      <Modal aberto={confirmar !== null} titulo="Cancelar trabalho" aoFechar={() => setConfirmar(null)}>
        <p style={{ fontSize: 13, color: "var(--cor-texto-secundario)" }}>
          Tem certeza que deseja cancelar o trabalho <strong>{confirmar?.documento}</strong>?
          Esta ação não pode ser desfeita.
        </p>
        <div className="flex justify-between mt-6">
          <button className="botao botao--secundario" onClick={() => setConfirmar(null)}>Voltar</button>
          <button className="botao botao--perigo" onClick={confirmarCancelamento}>Cancelar trabalho</button>
        </div>
      </Modal>
    </>
  );
}
