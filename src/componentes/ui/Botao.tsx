import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variante = "primario" | "secundario" | "fantasma" | "perigo";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  icone?: ReactNode;
}

export function Botao({ variante = "primario", icone, children, className = "", ...resto }: Props) {
  return (
    <button className={`botao botao--${variante} ${className}`} {...resto}>
      {icone}
      {children}
    </button>
  );
}
