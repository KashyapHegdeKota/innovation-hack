"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

export default function EmissionsChart({ data, title = "Emissions Over Time" }: EmissionsChartProps) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <h3 className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="co2Gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-bright)",
              borderRadius: "8px",
              color: "var(--text-primary)",
              fontSize: "12px",
            }}
          />
          <Area
            type="monotone"
            dataKey="co2e"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#co2Gradient)"
            name="CO2e (g)"
          />
          <Area
            type="monotone"
            dataKey="energy"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#energyGradient)"
            name="Energy (Wh)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
