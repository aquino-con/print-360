import type { ReactNode } from "react";

export type TipoBadge = "sucesso" | "aviso" | "perigo" | "info" | "neutro";

interface Props {
  tipo?: TipoBadge;
  children: ReactNode;
}

const STATUS: Record<string, { rotulo: string; tipo: TipoBadge }> = {
  pronta: { rotulo: "Pronta", tipo: "sucesso" },
  ocupada: { rotulo: "Ocupada", tipo: "aviso" },
  erro: { rotulo: "Erro", tipo: "perigo" },
  pausada: { rotulo: "Pausada", tipo: "aviso" },
  offline: { rotulo: "Offline", tipo: "neutro" },
  manutencao: { rotulo: "Manutenção", tipo: "info" },
  processando: { rotulo: "Processando", tipo: "info" },
  concluido: { rotulo: "Concluído", tipo: "sucesso" },
  pausado: { rotulo: "Pausado", tipo: "aviso" },
  pendente: { rotulo: "Na fila", tipo: "neutro" },
  cancelado: { rotulo: "Cancelado", tipo: "perigo" },
};

export function Badge({ tipo = "neutro", children }: Props) {
  return <span className={`badge badge--${tipo}`}>{children}</span>;
}

export function BadgeStatus({ status }: { status: string }) {
  const info = STATUS[status] ?? { rotulo: status, tipo: "neutro" as TipoBadge };
  return <Badge tipo={info.tipo}>{info.rotulo}</Badge>;
}

export { STATUS as MAPA_STATUS };
