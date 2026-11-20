import { useEffect, useState } from "react";
import { BarChart3, Bell, Download, History, Printer, Settings, Upload, Users } from "lucide-react";
import { api } from "../api/cliente";
import type { RegistroAuditoria } from "../tipos";
import { Campo, Card, Modal, Selecao, Toast, Toggle } from "../componentes/ui";
import { useAppStore } from "../estado/store";

const SECOES = [
  { id: "geral", rotulo: "Geral", icone: Settings },
  { id: "custos", rotulo: "Custos", icone: BarChart3 },
  { id: "alertas", rotulo: "Alertas", icone: Bell },
  { id: "impressoras", rotulo: "Impressoras", icone: Printer },
  { id: "permissoes", rotulo: "Usuários e Permissões", icone: Users },
  { id: "backup", rotulo: "Backup e Dados", icone: Download },
];

export function Configuracoes() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [secao, setSecao] = useState("geral");
  const [aviso, setAviso] = useState<string | null>(null);
  const [confirmarRestauracao, setConfirmarRestauracao] = useState(false);
  const [auditoria, setAuditoria] = useState<RegistroAuditoria[]>([]);
  const definirTela = useAppStore((estado) => estado.definirTela);

  useEffect(() => {
    api.obterConfiguracoes().then(setConfig);
  }, []);

  useEffect(() => {
    if (secao === "backup") {
      api.listarAuditoria().then(setAuditoria);
    }
  }, [secao]);

  const alterar = (chave: string, valor: string) => {
    setConfig((anterior) => ({ ...anterior, [chave]: valor }));
  };

  const salvar = async () => {
    try {
      await api.salvarConfiguracoes(config);
      await api.salvarParametrosCusto(
        Number(config.custo_pagina_preto) || 0,
        Number(config.custo_pagina_cor) || 0
      );
      setAviso("Configurações salvas com sucesso.");
      setTimeout(() => setAviso(null), 3500);
    } catch (erro) {
      setAviso(`Falha ao salvar: ${String(erro)}`);
    }
  };

  const exportar = async () => {
    try {
      await api.exportarBackup();
      setAviso("Backup exportado com sucesso.");
      setTimeout(() => setAviso(null), 3500);
    } catch (erro) {
      setAviso(`Falha ao exportar: ${String(erro)}`);
    }
  };

  const restaurar = async () => {
    setConfirmarRestauracao(false);
    try {
      await api.importarBackup();
      setAviso("Backup restaurado. Reinicie a aplicação para recarregar os dados.");
      setTimeout(() => setAviso(null), 6000);
    } catch (erro) {
      setAviso(`Falha ao restaurar: ${String(erro)}`);
    }
  };

  const ligado = (chave: string) => config[chave] === "true";

  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1 className="titulo-pagina">Configurações</h1>
          <p className="subtitulo-pagina">Parâmetros e preferências do sistema</p>
        </div>
        <button className="botao botao--primario" onClick={salvar}>Salvar alterações</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "216px 1fr", gap: 20 }}>
        <Card style={{ padding: 12, alignSelf: "start" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--cor-texto-claro)", letterSpacing: 1, padding: "8px 12px 12px" }}>SEÇÕES</div>
          <div style={{ display: "grid", gap: 4 }}>
            {SECOES.map((item) => {
              const Icone = item.icone;
              const ativo = item.id === secao;
              return (
                <button key={item.id} onClick={() => setSecao(item.id)}
                  className={`nav-item ${ativo ? "nav-item--ativo" : ""}`}
                  style={{ background: ativo ? "#eff6ff" : undefined, color: ativo ? "#1d4ed8" : "#475569" }}>
                  <Icone size={17} /> <span style={{ fontSize: 12 }}>{item.rotulo}</span>
                </button>
              );
            })}
          </div>
        </Card>

        <div style={{ display: "grid", gap: 20 }}>
          {secao === "geral" && (
            <Card>
              <h2 className="card__titulo">Preferências gerais</h2>
              <p className="subtitulo-pagina">Idioma, tema e comportamento da aplicação</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
                <Selecao rotulo="Idioma" id="idioma" opcoes={["Português (Brasil)", "English"]}
                  value={config.idioma === "pt-BR" ? "Português (Brasil)" : "English"}
                  onChange={(e) => alterar("idioma", e.target.value === "English" ? "en" : "pt-BR")} />
                <Selecao rotulo="Tema" id="tema" opcoes={["Claro", "Escuro (em breve)"]}
                  value={config.tema === "escuro" ? "Escuro (em breve)" : "Claro"}
                  onChange={(e) => alterar("tema", e.target.value === "Claro" ? "claro" : "escuro")} />
                <Campo rotulo="Formato de data" id="formato_data" value={config.formato_data ?? ""} onChange={(e) => alterar("formato_data", e.target.value)} />
                <div style={{ alignSelf: "end" }}>
                  <Toggle rotulo="Atualizar status automaticamente" descricao="A cada 15 segundos"
                    ativo={ligado("atualizacao_automatica")}
                    aoAlterar={(valor) => alterar("atualizacao_automatica", String(valor))} />
                </div>
              </div>

              <div style={{ marginTop: 24, borderTop: "1px solid var(--cor-fundo)", paddingTop: 20 }}>
                <h3 className="card__titulo" style={{ fontSize: 13 }}>Descoberta de impressoras</h3>
                <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
                  <Toggle
                    rotulo="Descoberta automática"
                    descricao="Consulta o spooler e a rede a cada ciclo de coleta"
                    ativo={ligado("descoberta_automatica")}
                    aoAlterar={(valor) => alterar("descoberta_automatica", String(valor))}
                  />
                  <Toggle
                    rotulo="Descoberta em rede"
                    descricao="Varre somente os alvos configurados (IPP 631 e RAW 9100)"
                    ativo={ligado("descoberta_rede_ativa")}
                    aoAlterar={(valor) => alterar("descoberta_rede_ativa", String(valor))}
                  />
                  <Campo
                    rotulo="Alvos de rede (IPs ou blocos CIDR IPv4, separados por vírgula)"
                    id="descoberta_rede_alvos"
                    value={config.descoberta_rede_alvos ?? ""}
                    onChange={(e) => alterar("descoberta_rede_alvos", e.target.value)}
                    placeholder="192.0.2.0/30"
                  />
                </div>
              </div>
            </Card>
          )}

          {secao === "custos" && (
            <Card>
              <h2 className="card__titulo">Parâmetros de custo</h2>
              <p className="subtitulo-pagina">Valores usados no cálculo de custo por página</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
                <Campo rotulo="Custo por página (preto e branco)" id="custo_pb" value={config.custo_pagina_preto ?? ""} onChange={(e) => alterar("custo_pagina_preto", e.target.value)} />
                <Campo rotulo="Custo por página (colorida)" id="custo_cor" value={config.custo_pagina_cor ?? ""} onChange={(e) => alterar("custo_pagina_cor", e.target.value)} />
                <Campo rotulo="Moeda" id="moeda" value={config.moeda ?? ""} onChange={(e) => alterar("moeda", e.target.value)} />
                <Campo rotulo="Margem de manutenção (%)" id="margem" value={config.margem_manutencao ?? ""} onChange={(e) => alterar("margem_manutencao", e.target.value)} />
              </div>
            </Card>
          )}

          {secao === "alertas" && (
            <Card>
              <h2 className="card__titulo">Alertas e notificações</h2>
              <p className="subtitulo-pagina">Escolha quais eventos geram avisos</p>
              <div style={{ display: "grid", gap: 18, marginTop: 20 }}>
                <Toggle rotulo="Notificações do sistema" descricao="Exibir avisos nativos do sistema operacional"
                  ativo={ligado("notificacoes")} aoAlterar={(valor) => alterar("notificacoes", String(valor))} />
                <hr style={{ border: 0, borderTop: "1px solid var(--cor-fundo)" }} />
                <Toggle rotulo="Alertas de suprimento baixo" descricao="Avisar quando um item atingir o limite definido"
                  ativo={ligado("alertas_suprimento")} aoAlterar={(valor) => alterar("alertas_suprimento", String(valor))} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "end" }}>
                  <Campo rotulo="Limite de nível baixo" id="limite" value={config.limite_nivel_baixo ?? ""} onChange={(e) => alterar("limite_nivel_baixo", e.target.value)} />
                  <Toggle rotulo="Alertas de cota excedida" descricao="Avisar quando o usuário ultrapassar a cota"
                    ativo={ligado("alertas_cota")} aoAlterar={(valor) => alterar("alertas_cota", String(valor))} />
                </div>
              </div>
            </Card>
          )}

          {(secao === "impressoras" || secao === "permissoes") && (
            <Card>
              <h2 className="card__titulo">{secao === "impressoras" ? "Impressoras" : "Usuários e Permissões"}</h2>
              <p className="subtitulo-pagina" style={{ marginTop: 8 }}>
                Essas opções são gerenciadas diretamente nas telas correspondentes.
              </p>
              <button className="botao botao--secundario mt-6"
                onClick={() => definirTela(secao === "impressoras" ? "impressoras" : "usuarios")}>
                Abrir {secao === "impressoras" ? "Impressoras" : "Usuários e Cotas"}
              </button>
            </Card>
          )}

          {secao === "backup" && (
            <>
              <Card>
                <h2 className="card__titulo">Backup e restauração</h2>
                <p className="subtitulo-pagina">Exporte um snapshot íntegro ou restaure um backup anterior</p>
                <div className="flex gap-3 mt-6">
                  <button className="botao botao--primario" onClick={exportar}>
                    <Download size={15} /> Exportar backup
                  </button>
                  <button className="botao botao--secundario" onClick={() => setConfirmarRestauracao(true)}>
                    <Upload size={15} /> Restaurar backup
                  </button>
                </div>
                <p style={{ fontSize: 11, color: "var(--cor-texto-claro)", marginTop: 16 }}>
                  O banco fica em `%APPDATA%\print_360\print360.db`. Restaurar substitui todos os dados atuais.
                </p>
              </Card>

              <Card>
                <div className="flex align-center gap-3">
                  <History size={18} color="var(--cor-primaria)" />
                  <h2 className="card__titulo">Trilha de auditoria</h2>
                </div>
                <p className="subtitulo-pagina" style={{ marginBottom: 16 }}>Últimas ações administrativas registradas</p>
                <table className="tabela">
                  <thead><tr><th>Data</th><th>Usuário</th><th>Ação</th><th>Entidade</th><th>Detalhe</th></tr></thead>
                  <tbody>
                    {auditoria.map((registro) => (
                      <tr key={registro.id}>
                        <td>{new Date(registro.registro_em).toLocaleString("pt-BR")}</td>
                        <td className="tabela__principal">{registro.usuario}</td>
                        <td>{registro.acao}</td>
                        <td>{registro.entidade}</td>
                        <td>{registro.detalhe ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {auditoria.length === 0 && (
                  <p style={{ fontSize: 12, color: "var(--cor-texto-secundario)", padding: 24 }}>
                    Nenhuma ação registrada ainda.
                  </p>
                )}
              </Card>
            </>
          )}
        </div>
      </div>

      <Modal aberto={confirmarRestauracao} titulo="Restaurar backup" aoFechar={() => setConfirmarRestauracao(false)}>
        <p style={{ fontSize: 13, color: "var(--cor-texto-secundario)" }}>
          A restauração <strong>substitui todos os dados atuais</strong> pelo conteúdo do backup escolhido.
          Deseja continuar?
        </p>
        <div className="flex justify-between mt-6">
          <button className="botao botao--secundario" onClick={() => setConfirmarRestauracao(false)}>Cancelar</button>
          <button className="botao botao--perigo" onClick={restaurar}>Escolher arquivo e restaurar</button>
        </div>
      </Modal>

      <Toast mensagem={aviso} />
    </>
  );
}
