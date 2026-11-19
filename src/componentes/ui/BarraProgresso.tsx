interface Props {
  valor: number;
  tipo?: "primario" | "sucesso" | "aviso" | "perigo";
  mostrarTexto?: boolean;
}

export function corNivel(valor: number): "sucesso" | "aviso" | "perigo" {
  if (valor >= 50) return "sucesso";
  if (valor >= 20) return "aviso";
  return "perigo";
}

export function BarraProgresso({ valor, tipo = "primario", mostrarTexto = false }: Props) {
  const valorSeguro = Math.max(0, Math.min(100, valor));
  return (
    <div className="flex align-center gap-2">
      <div className={`barra ${tipo !== "primario" ? `barra--${tipo}` : ""}`} style={{ flex: 1 }}>
        <div className="barra__preenchimento" style={{ width: `${valorSeguro}%` }} />
      </div>
      {mostrarTexto && <span style={{ fontSize: 11, minWidth: 34 }}>{valorSeguro}%</span>}
    </div>
  );
}
