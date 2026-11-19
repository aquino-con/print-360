import { Bell, Search } from "lucide-react";
import { TITULO_TELAS } from "../../rotas";
import { useAppStore } from "../../estado/store";

export function Topbar() {
  const telaAtual = useAppStore((estado) => estado.telaAtual);
  const busca = useAppStore((estado) => estado.busca);
  const definirBusca = useAppStore((estado) => estado.definirBusca);
  const abrirCentralAlertas = useAppStore((estado) => estado.abrirCentralAlertas);

  return (
    <header className="topbar">
      <div className="topbar__breadcrumb">
        Painel / <strong>{TITULO_TELAS[telaAtual]}</strong>
      </div>

      <div className="topbar__busca">
        <Search size={16} />
        <input
          type="search"
          value={busca}
          onChange={(evento) => definirBusca(evento.target.value)}
          placeholder="Buscar impressoras, trabalhos, usuários..."
          aria-label="Busca global"
        />
      </div>

      <div className="topbar__acoes">
        <button className="topbar__sino foco-visivel" aria-label="Notificações" onClick={abrirCentralAlertas}>
          <Bell size={20} />
          <span className="ponto" />
        </button>
        <div className="topbar__avatar" title="Ana Souza — Administradora">
          AC
        </div>
      </div>
    </header>
  );
}
