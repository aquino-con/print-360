import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface PontoSerie {
  nome: string;
  valor: number;
}

export function GraficoArea({ dados }: { dados: PontoSerie[] }) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <AreaChart data={dados} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dbeafe" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#dbeafe" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <XAxis dataKey="nome" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Area type="monotone" dataKey="valor" stroke="#2563eb" strokeWidth={2} fill="url(#gradArea)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const CORES = ["#2563eb", "#06b6d4", "#10b981", "#f59e0b", "#94a3b8"];

export function GraficoRosca({ dados }: { dados: PontoSerie[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={dados} dataKey="valor" nameKey="nome" innerRadius={55} outerRadius={78} paddingAngle={2}>
          {dados.map((_, indice) => (
            <Cell key={indice} fill={CORES[indice % CORES.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
