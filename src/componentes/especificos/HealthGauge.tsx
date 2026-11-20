interface Props {
  valor: number;
  classificacao: string;
  confianca?: number;
  tamanho?: number;
}

const CORES: Record<string, string> = {
  excelente: "#10B981",
  bom: "#2563EB",
  atencao: "#F59E0B",
  critico: "#DC2626",
};

const CORES_TEXTO: Record<string, string> = {
  excelente: "#047857",
  bom: "#1D4ED8",
  atencao: "#B45309",
  critico: "#B91C1C",
};

const ROTULOS: Record<string, string> = {
  excelente: "Excelente",
  bom: "Bom",
  atencao: "Atenção",
  critico: "Crítico",
};

/** Gauge de saúde acessível: valor textual + classificação, nunca apenas cor. */
export function HealthGauge({ valor, classificacao, confianca, tamanho = 164 }: Props) {
  const raio = 66;
  const circunferencia = 2 * Math.PI * raio;
  const preenchido = (valor / 100) * circunferencia;
  const cor = CORES[classificacao] ?? "#64748B";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg
        width={tamanho}
        height={tamanho}
        viewBox="0 0 160 160"
        role="img"
        aria-label={`Índice de saúde ${valor} de 100, classificação ${ROTULOS[classificacao] ?? classificacao}`}
      >
        <circle cx="80" cy="80" r={raio} fill="none" stroke="#E2E8F0" strokeWidth="14" />
        <circle
          cx="80" cy="80" r={raio} fill="none" stroke={cor} strokeWidth="14"
          strokeLinecap="round" strokeDasharray={`${preenchido} ${circunferencia}`}
          transform="rotate(-90 80 80)"
        />
        <text x="80" y="82" textAnchor="middle" fontSize="34" fontWeight="700" fill="#0F172A">{valor}</text>
        <text x="80" y="102" textAnchor="middle" fontSize="11" fill="#64748B">de 100</text>
      </svg>
      <span
        style={{
          fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 999,
          background: `${cor}1f`, color: CORES_TEXTO[classificacao] ?? "#475569",
        }}
      >
        {ROTULOS[classificacao] ?? classificacao}
      </span>
      {confianca !== undefined && (
        <span style={{ fontSize: 10, color: "var(--cor-texto-claro)" }}>
          Confiança: {Math.round(confianca * 100)}%
        </span>
      )}
    </div>
  );
}
