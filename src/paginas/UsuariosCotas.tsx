import { useCallback, useEffect, useState } from "react";
import { Plus, SlidersHorizontal } from "lucide-react";
import { api, type DadosNovoUsuario } from "../api/cliente";
import type { Setor, UsuarioResumo } from "../tipos";
import { Badge, BarraProgresso, Campo, Card, CardKPI, Modal, Selecao, corNivel } from "../componentes/ui";
import { useAtualizacoes } from "../hooks/useEventos";
import { useAppStore } from "../estado/store";

const STATUS: Record<string, { rotulo: string; tipo: "sucesso" | "aviso" | "perigo" | "neutro" }> = {
  dentro_cota: { rotulo: "Dentro da cota", tipo: "sucesso" },
  atencao: { rotulo: "Atenção", tipo: "aviso" },
  acima_cota: { rotulo: "Acima da cota", tipo: "perigo" },
  sem_cota: { rotulo: "Sem cota", tipo: "neutro" },
};

function statusCota(percentual: number) {
  if (percentual > 100) return STATUS.acima_cota;
  if (percentual >= 90) return STATUS.atencao;
  return STATUS.dentro_cota;
}

export function UsuariosCotas() {
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [novoAberto, setNovoAberto] = useState(false);
  const [novo, setNovo] = useState<DadosNovoUsuario>({ nome: "", login: "", email: "", setor: "", perfil: "usuario" });
  const [editando, setEditando] = useState<UsuarioResumo | null>(null);
  const [limite, setLimite] = useState("2000");
  const [bloquear, setBloquear] = useState(false);
  const notificar = useAppStore((estado) => estado.notificar);

  const carregar = useCallback(() => {
    api.listarUsuarios().then(setUsuarios);
    api.listarSetores().then(setSetores);
  }, []);

  useEffect(carregar, [carregar]);
  useAtualizacoes(carregar);

  const salvarUsuario = async () => {
    if (!novo.nome.trim() || !novo.login.trim()) {
      notificar("Informe nome e login.");
      return;
    }
    try {
      await api.adicionarUsuario(novo);
      notificar(`Usuário ${novo.nome} cadastrado.`);
      setNovo({ nome: "", login: "", email: "", setor: "", perfil: "usuario" });
      setNovoAberto(false);
      carregar();
    } catch (erro) {
      notificar(`Falha ao cadastrar: ${String(erro)}`);
    }
  };

  const abrirCota = (usuario: UsuarioResumo) => {
    setEditando(usuario);
    setLimite(String(usuario.limite || 2000));
    setBloquear(false);
  };

  const salvarCota = async () => {
    if (!editando) return;
    try {
      await api.salvarCota(editando.id, Number(limite), bloquear);
      notificar(`Cota de ${editando.nome} atualizada.`);
      setEditando(null);
      carregar();
    } catch (erro) {
      notificar(`Falha ao salvar cota: ${String(erro)}`);
    }
  };

  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1 className="titulo-pagina">Usuários e Cotas</h1>
          <p className="subtitulo-pagina">Controle de consumo e limites por usuário e setor</p>
        </div>
        <button className="botao botao--primario" onClick={() => setNovoAberto(true)}>
          <Plus size={16} /> Novo usuário
        </button>
      </div>

      <div className="grade-kpis">
        <CardKPI rotulo="Usuários ativos" valor={String(usuarios.length)} icone={<span />} corFundo="#dbeafe" corIcone="#2563eb" />
        <CardKPI rotulo="Com cota" valor={String(usuarios.filter((u) => u.limite > 0).length)} icone={<span />} corFundo="#d1fae5" corIcone="#10b981" />
        <CardKPI rotulo="Acima da cota" valor={String(usuarios.filter((u) => u.percentual > 100).length)} icone={<span />} corFundo="#fee2e2" corIcone="#ef4444" />
        <CardKPI rotulo="Consumo médio" valor={`${usuarios.length ? Math.round(usuarios.reduce((soma, u) => soma + u.consumo, 0) / usuarios.length) : 0} pág.`} icone={<span />} corFundo="#cffafe" corIcone="#0891b2" />
      </div>

      <Card>
        <table className="tabela">
          <thead><tr><th>Usuário</th><th>Setor</th><th>Perfil</th><th>Consumo</th><th>Uso da cota</th><th>Status</th><th style={{ textAlign: "right" }}>Ações</th></tr></thead>
          <tbody>
            {usuarios.map((usuario) => {
              const status = STATUS[usuario.status] ?? statusCota(usuario.percentual);
              return (
                <tr key={usuario.id}>
                  <td>
                    <div className="tabela__principal">{usuario.nome}</div>
                    <div className="tabela__secundario">{usuario.email ?? "—"}</div>
                  </td>
                  <td>{usuario.setor}</td>
                  <td><Badge tipo={usuario.perfil === "administrador" ? "info" : usuario.perfil === "gestor" ? "neutro" : "neutro"}>{usuario.perfil}</Badge></td>
                  <td>{usuario.consumo.toLocaleString("pt-BR")} pág.</td>
                  <td style={{ width: 180 }}>
                    <BarraProgresso valor={Math.min(usuario.percentual, 100)} tipo={corNivel(usuario.percentual)} mostrarTexto />
                  </td>
                  <td><Badge tipo={status.tipo}>{status.rotulo}</Badge></td>
                  <td style={{ textAlign: "right" }}>
                    <button className="botao--icone" title="Editar cota" onClick={() => abrirCota(usuario)}>
                      <SlidersHorizontal size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {usuarios.length === 0 && (
          <p style={{ fontSize: 12, color: "var(--cor-texto-secundario)", padding: 24 }}>
            Nenhum usuário cadastrado. Use o botão "Novo usuário" para começar.
          </p>
        )}
      </Card>

      <Modal aberto={novoAberto} titulo="Novo usuário" aoFechar={() => setNovoAberto(false)}>
        <div style={{ display: "grid", gap: 14 }}>
          <Campo rotulo="Nome" id="novo-nome" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} />
          <Campo rotulo="Login" id="novo-login" value={novo.login} onChange={(e) => setNovo({ ...novo, login: e.target.value })} />
          <Campo rotulo="E-mail" id="novo-email" value={novo.email ?? ""} onChange={(e) => setNovo({ ...novo, email: e.target.value })} />
          <Selecao rotulo="Setor" id="novo-setor" opcoes={["", ...setores.map((s) => s.nome)]}
            value={novo.setor} onChange={(e) => setNovo({ ...novo, setor: e.target.value })} />
          <Selecao rotulo="Perfil" id="novo-perfil" opcoes={["usuario", "gestor", "administrador"]}
            value={novo.perfil} onChange={(e) => setNovo({ ...novo, perfil: e.target.value })} />
        </div>
        <div className="flex justify-between mt-6">
          <button className="botao botao--secundario" onClick={() => setNovoAberto(false)}>Cancelar</button>
          <button className="botao botao--primario" onClick={salvarUsuario}>Cadastrar</button>
        </div>
      </Modal>

      <Modal aberto={editando !== null} titulo={`Editar cota — ${editando?.nome ?? ""}`} aoFechar={() => setEditando(null)}>
        <div style={{ display: "grid", gap: 14 }}>
          <Campo rotulo="Limite mensal de páginas" id="limite-cota" type="number" value={limite} onChange={(e) => setLimite(e.target.value)} />
          <label className="flex align-center gap-2" style={{ fontSize: 12 }}>
            <input type="checkbox" checked={bloquear} onChange={(e) => setBloquear(e.target.checked)} />
            Bloquear impressão ao exceder a cota
          </label>
          {editando && (
            <p style={{ fontSize: 11, color: "var(--cor-texto-secundario)" }}>
              Consumo atual: {editando.consumo.toLocaleString("pt-BR")} páginas.
            </p>
          )}
        </div>
        <div className="flex justify-between mt-6">
          <button className="botao botao--secundario" onClick={() => setEditando(null)}>Cancelar</button>
          <button className="botao botao--primario" onClick={salvarCota}>Salvar cota</button>
        </div>
      </Modal>
    </>
  );
}
