"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart, Line,
} from "recharts";

interface DataPoint {
  date: string;
  co2e: number;
  energy: number;
}

interface EmissionsChartProps {
  data: DataPoint[];
  title?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border px-4 py-3 text-xs space-y-1.5"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-bright)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
      <p className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span style={{ color: "var(--text-muted)" }}>{p.name}:</span>
          <span className="font-mono font-medium" style={{ color: "var(--text-primary)" }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function EmissionsChart({ data, title = "Emissions Over Time" }: EmissionsChartProps) {
  const singleDay = data.length <= 1;

  return (
    <div className="relative rounded-xl border glow-hover overflow-hidden p-5"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>

      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(34,197,94,0.3), transparent)" }} />

      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          {title}
        </h3>
        <div className="flex items-center gap-4">
          {[{ color: "#22c55e", label: "CO2e (g)" }, { color: "#3b82f6", label: "Energy (Wh)" }].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        {singleDay ? (
          // Single day — dual Y axes so CO2e and Energy scale independently
          <ComposedChart data={data} margin={{ top: 4, right: 40, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} dy={8} />
            <YAxis yAxisId="co2e" tick={{ fill: "#22c55e", fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
            <YAxis yAxisId="energy" orientation="right" tick={{ fill: "#3b82f6", fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(34,197,94,0.05)" }} />
            <Bar yAxisId="co2e" dataKey="co2e" name="CO2e (g)" fill="#22c55e" radius={[4, 4, 0, 0]} fillOpacity={0.85} barSize={60} />
            <Bar yAxisId="energy" dataKey="energy" name="Energy (Wh)" fill="#3b82f6" radius={[4, 4, 0, 0]} fillOpacity={0.85} barSize={60} />
          </ComposedChart>
        ) : (
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="co2Gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} dy={8} />
            <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--border-bright)", strokeWidth: 1, strokeDasharray: "4 4" }} />
            <Area type="monotone" dataKey="co2e" stroke="#22c55e" strokeWidth={2}
              fill="url(#co2Gradient)" name="CO2e (g)" dot={false} activeDot={{ r: 4, fill: "#22c55e", strokeWidth: 0 }} />
            <Area type="monotone" dataKey="energy" stroke="#3b82f6" strokeWidth={2}
              fill="url(#energyGradient)" name="Energy (Wh)" dot={false} activeDot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }} />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
