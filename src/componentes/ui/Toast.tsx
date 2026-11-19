import { CheckCircle2 } from "lucide-react";

interface Props {
  mensagem: string | null;
}

export function Toast({ mensagem }: Props) {
  if (!mensagem) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "#fff",
        border: "1px solid var(--cor-borda)",
        borderLeft: "4px solid var(--cor-sucesso)",
        borderRadius: "var(--raio-md)",
        boxShadow: "var(--sombra-elevada)",
        padding: "12px 18px",
        fontSize: 13,
      }}
    >
      <CheckCircle2 size={18} color="var(--cor-sucesso)" />
      {mensagem}
    </div>
  );
}
