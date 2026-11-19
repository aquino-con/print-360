import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Toast } from "../ui";
import { CentralDeAlertas } from "../especificos/CentralDeAlertas";
import { useAppStore } from "../../estado/store";

export function Layout({ children }: { children: ReactNode }) {
  const mensagem = useAppStore((estado) => estado.mensagem);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#conteudo-principal">Ir para o conteúdo principal</a>
      <Sidebar />
      <div className="conteudo">
        <Topbar />
        <main id="conteudo-principal" className="area-conteudo" tabIndex={-1}>{children}</main>
      </div>
      <Toast mensagem={mensagem} />
      <CentralDeAlertas />
    </div>
  );
}
