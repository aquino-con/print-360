import { useCallback, useEffect, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { api } from "../api/cliente";
import type { Relatorio, Setor } from "../tipos";
import { Card, CardKPI, GraficoArea, GraficoRosca } from "../componentes/ui";
import { useAtualizacoes } from "../hooks/useEventos";
import { useAppStore } from "../estado/store";

const moeda = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function Relatorios() {
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [meses, setMeses] = useState("12");
  const [setor, setSetor] = useState("");
  const notificar = useAppStore((estado) => estado.notificar);

  const carregar = useCallback(() => {
    api.obterRelatorio(Number(meses), setor || undefined).then(setRelatorio);
  }, [meses, setor]);

  useEffect(() => {
    api.listarSetores().then(setSetores);
  }, []);
  useEffect(carregar, [carregar]);
  useAtualizacoes(carregar);

  const exportar = async () => {
    if (!relatorio) return;
    try {
      await api.exportarRelatorioCsv(relatorio, Number(meses));
      notificar("Relatório exportado em CSV.");
    } catch (erro) {
      notificar(`Falha ao exportar: ${String(erro)}`);
    }
  };

  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1 className="titulo-pagina">Relatórios</h1>
          <p className="subtitulo-pagina">Análise de volume, custos e rateio por setor</p>
        </div>
        <button className="botao botao--primario" onClick={exportar}>
          <Download size={15} /> Exportar relatório
        </button>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div className="flex align-center gap-3">
          <select className="campo__entrada" style={{ width: 240 }} value={meses} onChange={(e) => setMeses(e.target.value)}>
            <option value="3">Últimos 3 meses</option>
            <option value="6">Últimos 6 meses</option>
            <option value="12">Últimos 12 meses</option>
          </select>
          <select className="campo__entrada" style={{ width: 240 }} value={setor} onChange={(e) => setSetor(e.target.value)}>
            <option value="">Todos os setores</option>
            {setores.map((item) => <option key={item.id} value={item.nome}>{item.nome}</option>)}
          </select>
          <button className="botao botao--secundario" style={{ marginLeft: "auto" }} onClick={carregar}>
            <RefreshCw size={15} /> Aplicar filtros
          </button>
        </div>
      </Card>

      <div className="grade-kpis">
        <CardKPI rotulo="Custo total" valor={moeda(relatorio?.custo_total ?? 0)} icone={<span />} corFundo="#dbeafe" corIcone="#2563eb" />
        <CardKPI rotulo="Páginas impressas" valor={(relatorio?.paginas ?? 0).toLocaleString("pt-BR")} icone={<span />} corFundo="#d1fae5" corIcone="#10b981" />
        <CardKPI rotulo="Custo por página" valor={moeda(relatorio?.custo_por_pagina ?? 0)} icone={<span />} corFundo="#cffafe" corIcone="#0891b2" />
        <CardKPI
          rotulo="Variação vs. mês anterior"
          valor={`${(relatorio?.economia_percentual ?? 0).toFixed(1).replace(".", ",")}%`}
          icone={<span />}
          corFundo="#d1fae5"
          corIcone="#10b981"
          variacao="período anterior"
        />
      </div>

      <div className="grade-2">
        <Card>
          <h2 className="card__titulo">Evolução de custos</h2>
          <p className="subtitulo-pagina">Custo mensal em R$ · últimos {meses} meses</p>
          <div className="mt-4">
            <GraficoArea dados={(relatorio?.evolucao ?? []).map((ponto) => ({ nome: ponto.nome, valor: ponto.valor }))} />
          </div>
        </Card>
        <Card>
          <h2 className="card__titulo">Rateio por setor</h2>
          <GraficoRosca dados={(relatorio?.setores ?? []).map((ponto) => ({ nome: ponto.nome, valor: ponto.valor }))} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11 }}>
            {(relatorio?.setores ?? []).map((ponto, indice) => (
              <div key={ponto.nome} className="flex align-center gap-2">
                <span style={{ width: 8, height: 8, borderRadius: 2, background: ["#2563eb", "#06b6d4", "#10b981", "#f59e0b", "#94a3b8"][indice % 5] }} />
                {ponto.nome} {relatorio && relatorio.custo_total > 0 ? Math.round((ponto.valor / relatorio.custo_total) * 100) : 0}%
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="card__titulo" style={{ marginBottom: 16 }}>Custo por impressora</h2>
        <table className="tabela">
          <thead><tr><th>Impressora</th><th>Setor</th><th>Páginas</th><th>Custo</th><th>Variação</th><th>Participação</th></tr></thead>
          <tbody>
            {(relatorio?.impressoras ?? []).map((linha) => (
              <tr key={linha.nome}>
                <td className="tabela__principal">{linha.nome}</td>
                <td>{linha.setor}</td>
                <td>{linha.paginas.toLocaleString("pt-BR")}</td>
                <td>{moeda(linha.custo)}</td>
                <td style={{ color: linha.variacao <= 0 ? "var(--cor-sucesso-texto)" : "var(--cor-perigo-texto)", fontWeight: 600 }}>
                  {linha.variacao > 0 ? "+" : ""}{linha.variacao.toFixed(1).replace(".", ",")}%
                </td>
                <td>
                  <div className="flex align-center gap-2">
                    <div className="barra" style={{ width: 100 }}>
                      <div className="barra__preenchimento" style={{ width: `${linha.participacao}%` }} />
                    </div>
                    {linha.participacao}%
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(relatorio?.impressoras.length ?? 0) === 0 && (
          <p style={{ fontSize: 12, color: "var(--cor-texto-secundario)", padding: 24 }}>
            Ainda não há trabalhos concluídos no período selecionado.
          </p>
        )}
      </Card>
    </>
  );
}
