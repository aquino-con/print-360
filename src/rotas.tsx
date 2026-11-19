import {
  Activity,
  BarChart3,
  LayoutDashboard,
  ListOrdered,
  Network,
  Package,
  Route,
  Printer,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Tela } from "./tipos";

export interface ItemNav {
  id: Tela;
  rotulo: string;
  icone: LucideIcon;
  badge?: number;
  badgeTipo?: "perigo" | "aviso";
}

export const ITENS_NAV: ItemNav[] = [
  { id: "visao-geral", rotulo: "Visão Geral", icone: LayoutDashboard },
  { id: "fila", rotulo: "Fila de Impressão", icone: ListOrdered, badge: 3, badgeTipo: "perigo" },
  { id: "impressoras", rotulo: "Impressoras", icone: Printer },
  { id: "suprimentos", rotulo: "Suprimentos", icone: Package, badge: 5, badgeTipo: "aviso" },
  { id: "relatorios", rotulo: "Relatórios", icone: BarChart3 },
  { id: "usuarios", rotulo: "Usuários e Cotas", icone: Users },
  { id: "configuracoes", rotulo: "Configurações", icone: Settings },
];

export const ITENS_NAV_AVANCADO: ItemNav[] = [
  { id: "manutencao", rotulo: "Manutenção Preditiva", icone: Activity },
  { id: "roteamento", rotulo: "Roteamento", icone: Route },
  { id: "sincronizacao", rotulo: "Sincronização", icone: Network },
  { id: "config-avancada", rotulo: "Configurações Avançadas", icone: Settings },
];

export const TITULO_TELAS: Record<Tela, string> = {
  "visao-geral": "Visão Geral",
  fila: "Fila de Impressão",
  impressoras: "Impressoras",
  suprimentos: "Suprimentos",
  relatorios: "Relatórios",
  usuarios: "Usuários e Cotas",
  configuracoes: "Configurações",
  manutencao: "Manutenção Preditiva",
  "saude-dispositivo": "Saúde do Dispositivo",
  roteamento: "Roteamento Inteligente",
  sincronizacao: "Sincronização",
  "config-avancada": "Configurações Avançadas",
};
