import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface Props {
  aberto: boolean;
  titulo: string;
  children: ReactNode;
  aoFechar: () => void;
}

export function Modal({ aberto, titulo, children, aoFechar }: Props) {
  const painel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") aoFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    painel.current?.focus();
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto, aoFechar]);

  if (!aberto) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,.45)",
        display: "grid",
        placeItems: "center",
        zIndex: 50,
      }}
      onClick={aoFechar}
    >
      <div
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        className="card"
        style={{ minWidth: 440, outline: "none" }}
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="flex align-center justify-between" style={{ marginBottom: 20 }}>
          <h3 className="secao-titulo">{titulo}</h3>
          <button className="botao--icone foco-visivel" onClick={aoFechar} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
