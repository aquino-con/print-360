import { create } from "zustand";
import type { Tela } from "../tipos";

interface EstadoApp {
  telaAtual: Tela;
  definirTela: (tela: Tela) => void;
  busca: string;
  definirBusca: (busca: string) => void;
  mensagem: string | null;
  notificar: (mensagem: string) => void;
  limparNotificacao: () => void;
  centralAlertasAberta: boolean;
  abrirCentralAlertas: () => void;
  fecharCentralAlertas: () => void;
}

export const useAppStore = create<EstadoApp>((set) => ({
  telaAtual: "visao-geral",
  definirTela: (tela) => set({ telaAtual: tela }),
  busca: "",
  definirBusca: (busca) => set({ busca }),
  mensagem: null,
  notificar: (mensagem) => set({ mensagem }),
  limparNotificacao: () => set({ mensagem: null }),
  centralAlertasAberta: false,
  abrirCentralAlertas: () => set({ centralAlertasAberta: true }),
  fecharCentralAlertas: () => set({ centralAlertasAberta: false }),
}));
