import { lazy, Suspense } from "react";
import { Layout } from "./componentes/layout/Layout";
import { useAppStore } from "./estado/store";

// Code-splitting: cada tela é carregada sob demanda, reduzindo o bundle inicial.
const VisaoGeral = lazy(() => import("./paginas/VisaoGeral").then((m) => ({ default: m.VisaoGeral })));
const FilaImpressao = lazy(() => import("./paginas/FilaImpressao").then((m) => ({ default: m.FilaImpressao })));
const Impressoras = lazy(() => import("./paginas/Impressoras").then((m) => ({ default: m.Impressoras })));
const Suprimentos = lazy(() => import("./paginas/Suprimentos").then((m) => ({ default: m.Suprimentos })));
const Relatorios = lazy(() => import("./paginas/Relatorios").then((m) => ({ default: m.Relatorios })));
const UsuariosCotas = lazy(() => import("./paginas/UsuariosCotas").then((m) => ({ default: m.UsuariosCotas })));
const Configuracoes = lazy(() => import("./paginas/Configuracoes").then((m) => ({ default: m.Configuracoes })));
const ManutencaoPreditiva = lazy(() => import("./paginas/ManutencaoPreditiva").then((m) => ({ default: m.ManutencaoPreditiva })));
const SaudeDispositivo = lazy(() => import("./paginas/SaudeDispositivo").then((m) => ({ default: m.SaudeDispositivo })));
const RoteamentoInteligente = lazy(() => import("./paginas/RoteamentoInteligente").then((m) => ({ default: m.RoteamentoInteligente })));
const Sincronizacao = lazy(() => import("./paginas/Sincronizacao").then((m) => ({ default: m.Sincronizacao })));
const ConfiguracoesAvancadas = lazy(() => import("./paginas/ConfiguracoesAvancadas").then((m) => ({ default: m.ConfiguracoesAvancadas })));

const PAGINAS = {
  "visao-geral": VisaoGeral,
  fila: FilaImpressao,
  impressoras: Impressoras,
  suprimentos: Suprimentos,
  relatorios: Relatorios,
  usuarios: UsuariosCotas,
  configuracoes: Configuracoes,
  manutencao: ManutencaoPreditiva,
  "saude-dispositivo": SaudeDispositivo,
  roteamento: RoteamentoInteligente,
  sincronizacao: Sincronizacao,
  "config-avancada": ConfiguracoesAvancadas,
};

function Carregando() {
  return (
    <div role="status" aria-label="Carregando tela" style={{ padding: 32, color: "var(--cor-texto-secundario)", fontSize: 13 }}>
      Carregando…
    </div>
  );
}

export default function App() {
  const telaAtual = useAppStore((estado) => estado.telaAtual);
  const Pagina = PAGINAS[telaAtual];

  return (
    <Layout>
      <Suspense fallback={<Carregando />}>
        <Pagina />
      </Suspense>
    </Layout>
  );
}
