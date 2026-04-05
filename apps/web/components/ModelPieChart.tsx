"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface ModelUsage {
  name: string;
  value: number;
  color: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border px-3 py-2 text-xs"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-bright)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
      <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{payload[0].name}</p>
      <p className="font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>{payload[0].value} queries</p>
    </div>
  );
};

export default function ModelPieChart({ data }: { data: ModelUsage[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="relative rounded-xl border glow-hover overflow-hidden p-5" style={{ height: "100%", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>

      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(34,197,94,0.3), transparent)" }} />

      <h3 className="text-[10px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
        Model Usage
      </h3>

      <ResponsiveContainer width="100%" style={{ flex: 1 }}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
            dataKey="value" strokeWidth={3} stroke="var(--bg-card)">
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {/* Center label */}
          <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle"
            style={{ fill: "var(--text-primary)", fontSize: 22, fontWeight: 800, fontFamily: "monospace" }}>
            {total}
          </text>
          <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle"
            style={{ fill: "var(--text-muted)", fontSize: 10 }}>
            queries
          </text>
        </PieChart>
      </ResponsiveContainer>

      <div className="flex flex-col gap-2 mt-3">
        {data.map((item) => {
          const pct = Math.round((item.value / total) * 100);
          return (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-xs flex-1" style={{ color: "var(--text-secondary)" }}>{item.name}</span>
              <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{pct}%</span>
              <div className="w-16 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-secondary)" }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: item.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
