"use client";

import { Leaf, DollarSign, CheckCircle, Clock, AlertCircle } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import StatCard from "@/components/StatCard";
import { levySummary, levyOverTime, levyTransactions } from "@/lib/mock-data";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  confirmed: { label: "Confirmed", color: "var(--green-accent)", icon: CheckCircle },
  pooled: { label: "Pooled", color: "var(--amber-accent)", icon: Clock },
  pending: { label: "Pending", color: "var(--text-muted)", icon: AlertCircle },
};

const pieData = [
  { name: "Confirmed", value: levySummary.confirmed_pct, color: "#22c55e" },
  { name: "Pooled", value: levySummary.pooled_pct, color: "#f59e0b" },
  { name: "Pending", value: levySummary.pending_pct, color: "#5a7565" },
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function LevyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Carbon Levy
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Micro-levies routed to verified carbon removal via Stripe Climate
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Levy" value={`$${levySummary.total_levy_usd.toFixed(2)}`} icon={DollarSign} />
        <StatCard label="Carbon Removed" value={levySummary.total_carbon_removed_g.toFixed(1)} unit="g" icon={Leaf} />
        <StatCard label="Transactions" value={levySummary.total_transactions.toLocaleString()} icon={CheckCircle} />
        <StatCard label="Confirmed" value={`${levySummary.confirmed_pct}%`} icon={CheckCircle} trend={3.2} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-12 gap-4">
        {/* Levy over time */}
        <div
          className="col-span-8 rounded-xl border p-5"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <h3 className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
            Levy & Carbon Removal Over Time
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={levyOverTime}>
              <defs>
                <linearGradient id="levyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="removedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
              <YAxis yAxisId="levy" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} orientation="left" />
              <YAxis yAxisId="removed" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} orientation="right" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-bright)",
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                }}
              />
              <Area yAxisId="levy" type="monotone" dataKey="levy" stroke="#22c55e" strokeWidth={2} fill="url(#levyGrad)" name="Levy (USD)" />
              <Area yAxisId="removed" type="monotone" dataKey="removed" stroke="#3b82f6" strokeWidth={2} fill="url(#removedGrad)" name="Removed (g)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status pie + destinations */}
        <div className="col-span-4 space-y-4">
          <div
            className="rounded-xl border p-5"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <h3 className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
              Levy Status
            </h3>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="var(--bg-card)"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-1">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{d.name} {d.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Destinations */}
          <div
            className="rounded-xl border p-5"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
              Destinations
            </h3>
            <div className="space-y-3">
              {levySummary.destinations.map((d) => {
                const s = statusConfig[d.status];
                return (
                  <div key={d.name} className="flex items-start gap-3">
                    <s.icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: s.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{d.name}</p>
                      <div className="flex gap-3 mt-0.5">
                        <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                          ${d.amount_usd.toFixed(2)}
                        </span>
                        {d.carbon_removed_g > 0 && (
                          <span className="text-[10px] font-mono" style={{ color: "var(--green-accent)" }}>
                            {d.carbon_removed_g.toFixed(1)}g removed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction log */}
      <div>
        <h2 className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
          Recent Levy Transactions
        </h2>
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <div
            className="grid grid-cols-[1fr_1fr_100px_100px_1fr_100px] px-5 py-3 text-xs font-medium uppercase tracking-wider border-b"
            style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}
          >
            <span>Time</span>
            <span>Agent</span>
            <span className="text-right">Amount</span>
            <span className="text-right">CO2e</span>
            <span>Destination</span>
            <span>Status</span>
          </div>
          {levyTransactions.map((t) => {
            const s = statusConfig[t.status];
            return (
              <div
                key={t.id}
                className="grid grid-cols-[1fr_1fr_100px_100px_1fr_100px] px-5 py-3 text-xs items-center border-b"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                <span className="font-mono">{formatTime(t.timestamp)}</span>
                <span className="truncate">{t.agent_id}</span>
                <span className="text-right font-mono">${t.amount_usd.toFixed(5)}</span>
                <span className="text-right font-mono">{t.co2e_g.toFixed(3)}g</span>
                <span className="truncate">{t.destination}</span>
                <span className="flex items-center gap-1.5">
                  <s.icon className="w-3 h-3" style={{ color: s.color }} />
                  <span style={{ color: s.color }}>{s.label}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
