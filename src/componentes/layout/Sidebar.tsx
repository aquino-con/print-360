import { Printer, Sparkles } from "lucide-react";
import { ITENS_NAV, ITENS_NAV_AVANCADO } from "../../rotas";
import { useAppStore } from "../../estado/store";

export function Sidebar() {
  const telaAtual = useAppStore((estado) => estado.telaAtual);
  const definirTela = useAppStore((estado) => estado.definirTela);

  return (
    <aside className="sidebar">
      <div className="sidebar__marca">
        <div className="sidebar__logo">
          <Printer size={22} />
        </div>
        <div>
          <div className="sidebar__nome">Print 360</div>
          <div className="sidebar__assinatura">AQUINO CONSULTORIA</div>
        </div>
      </div>

      <div className="sidebar__rotulo">MENU PRINCIPAL</div>
      <nav className="sidebar__nav" aria-label="Navegação principal">
        {ITENS_NAV.map((item) => {
          const ativo = item.id === telaAtual;
          const Icone = item.icone;
          return (
            <button
              key={item.id}
              className={`nav-item foco-visivel ${ativo ? "nav-item--ativo" : ""}`}
              onClick={() => definirTela(item.id)}
              aria-current={ativo ? "page" : undefined}
            >
              <Icone size={19} />
              <span>{item.rotulo}</span>
              {item.badge && (
                <span
                  className={`nav-item__badge ${
                    item.badgeTipo === "aviso" ? "nav-item__badge--aviso" : ""
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar__rotulo" style={{ color: "#A78BFA", marginTop: 16 }}>
        RECURSOS AVANÇADOS
      </div>
      <nav className="sidebar__nav" aria-label="Navegação dos recursos avançados">
        {ITENS_NAV_AVANCADO.map((item) => {
          const ativo = item.id === telaAtual;
          const Icone = item.icone;
          return (
            <button
              key={item.id}
              className={`nav-item foco-visivel ${ativo ? "nav-item--ativo" : ""}`}
              style={ativo ? { borderLeft: "3px solid #7C3AED" } : undefined}
              onClick={() => definirTela(item.id)}
              aria-current={ativo ? "page" : undefined}
            >
              <Icone size={19} />
              <span>{item.rotulo}</span>
              <Sparkles size={11} style={{ marginLeft: "auto", color: "#7C3AED" }} />
            </button>
          );
        })}
      </nav>

      <div className="sidebar__rodape">
        <div className="sidebar__status">
          <span className="bolinha-status" />
          Sistema online
        </div>
        <div className="sidebar__versao">v2.0.0 · Aquino Consultoria</div>
      </div>
    </aside>
  );
}
