import type { HTMLAttributes, ReactNode } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className = "", ...resto }: Props) {
  return (
    <div className={`card ${className}`} {...resto}>
      {children}
    </div>
  );
}

interface CardKPIProps {
  rotulo: string;
  valor: string;
  icone: ReactNode;
  corFundo: string;
  corIcone: string;
  variacao?: string;
  tipoVariacao?: "sucesso" | "aviso" | "perigo" | "info";
}

export function CardKPI({
  rotulo,
  valor,
  icone,
  corFundo,
  corIcone,
  variacao,
  tipoVariacao = "sucesso",
}: CardKPIProps) {
  return (
    <Card className="card-kpi">
      <div className="card-kpi__topo">
        <span className="card-kpi__icone" style={{ background: corFundo, color: corIcone }}>
          {icone}
        </span>
        <span className="card-kpi__rotulo">{rotulo}</span>
      </div>
      <div className="card-kpi__valor">{valor}</div>
      {variacao && (
        <span
          className="card-kpi__variacao"
          style={{
            background: `var(--cor-${tipoVariacao}-fundo, var(--cor-info-fundo))`,
            color: `var(--cor-${tipoVariacao}-texto, var(--cor-primaria))`,
          }}
        >
          {variacao}
        </span>
      )}
    </Card>
  );
}
