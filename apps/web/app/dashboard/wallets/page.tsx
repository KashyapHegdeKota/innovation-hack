"use client";

import { useState } from "react";
import { Shield, AlertTriangle, Ban, Clock, ArrowDownToLine } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { wallets } from "@/lib/mock-data";

const policyConfig: Record<string, { label: string; icon: any; color: string; description: string }> = {
  downgrade_model: { label: "Downgrade Model", icon: ArrowDownToLine, color: "var(--blue-accent)", description: "Auto-switch to a lighter model when budget is exceeded" },
  offset: { label: "Auto-Offset", icon: Shield, color: "var(--green-accent)", description: "Purchase carbon offsets and continue operating" },
  defer: { label: "Defer", icon: Clock, color: "var(--amber-accent)", description: "Queue tasks for off-peak low-carbon hours" },
  block: { label: "Block", icon: Ban, color: "var(--red-accent)", description: "Reject inference requests until next period" },
};

const trendConfig: Record<string, { label: string; color: string }> = {
  on_track: { label: "On Track", color: "var(--green-accent)" },
  at_risk: { label: "At Risk", color: "var(--amber-accent)" },
  exceeded: { label: "Exceeded", color: "var(--red-accent)" },
};

export default function WalletsPage() {
  const [selectedWallet, setSelectedWallet] = useState(wallets[0].id);
  const active = wallets.find((w) => w.id === selectedWallet)!;
  const utilization = Math.round((active.current_spend_co2e_g / active.monthly_budget_co2e_g) * 100);
  const barColor = utilization >= 80 ? "var(--red-accent)" : utilization >= 50 ? "var(--amber-accent)" : "var(--green-accent)";
  const policy = policyConfig[active.on_exceeded];
  const trend = trendConfig[active.trend] || trendConfig.on_track;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Carbon Wallets
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Per-agent carbon budgets with policy enforcement
        </p>
      </div>

      {/* Wallet selector cards */}
      <div className="grid grid-cols-4 gap-4">
        {wallets.map((w) => {
          const pct = Math.round((w.current_spend_co2e_g / w.monthly_budget_co2e_g) * 100);
          const c = pct >= 80 ? "var(--red-accent)" : pct >= 50 ? "var(--amber-accent)" : "var(--green-accent)";
          const isActive = w.id === selectedWallet;
          return (
            <button
              key={w.id}
              onClick={() => setSelectedWallet(w.id)}
              className="rounded-xl border p-4 text-left transition-all"
              style={{
                backgroundColor: isActive ? "var(--bg-card-hover)" : "var(--bg-card)",
                borderColor: isActive ? c : "var(--border)",
                borderWidth: isActive ? "1.5px" : "1px",
              }}
            >
              <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                {w.display_name}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "var(--border)" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: c }} />
                </div>
                <span className="text-xs font-mono font-bold" style={{ color: c }}>
                  {pct}%
                </span>
              </div>
              <p className="text-[10px] mt-1.5 font-mono" style={{ color: "var(--text-muted)" }}>
                {w.current_spend_co2e_g.toFixed(1)} / {w.monthly_budget_co2e_g}g
              </p>
            </button>
          );
        })}
      </div>

      {/* Detail panel */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left — budget chart */}
        <div
          className="col-span-8 rounded-xl border p-5"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Budget Burn — {active.display_name}
            </h3>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-medium uppercase"
              style={{ color: trend.color, backgroundColor: "var(--bg-secondary)" }}
            >
              {trend.label}
            </span>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={active.transactions}>
              <defs>
                <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={barColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={barColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} domain={[0, active.monthly_budget_co2e_g]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-bright)",
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                }}
                formatter={(value) => [`${Number(value).toFixed(1)}g CO2e`, "Spend"]}
              />
              <ReferenceLine y={active.monthly_budget_co2e_g} stroke="var(--red-accent)" strokeDasharray="6 3" label={{ value: "Budget", fill: "var(--red-accent)", fontSize: 11, position: "right" }} />
              <ReferenceLine y={active.monthly_budget_co2e_g * 0.8} stroke="var(--amber-accent)" strokeDasharray="4 4" strokeOpacity={0.5} />
              <Area type="monotone" dataKey="spend" stroke={barColor} strokeWidth={2} fill="url(#spendGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Right — wallet info */}
        <div className="col-span-4 space-y-4">
          {/* Big gauge */}
          <div
            className="rounded-xl border p-5"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <p className="text-xs uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Utilization</p>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-4 rounded-full" style={{ backgroundColor: "var(--border)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(utilization, 100)}%`, backgroundColor: barColor }} />
              </div>
              <span className="font-mono text-2xl font-bold" style={{ color: barColor }}>
                {utilization}%
              </span>
            </div>
            <div className="flex justify-between mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
              <span>Spent: {active.current_spend_co2e_g.toFixed(1)}g</span>
              <span>Budget: {active.monthly_budget_co2e_g}g</span>
            </div>
            <div className="flex justify-between text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              <span>Remaining: {(active.monthly_budget_co2e_g - active.current_spend_co2e_g).toFixed(1)}g</span>
              <span>{active.period_start} — {active.period_end}</span>
            </div>
          </div>

          {/* Exceeded policy */}
          <div
            className="rounded-xl border p-5"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <p className="text-xs uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>When Budget Exceeded</p>
            <div className="flex items-center gap-3">
              {policy && (
                <>
                  <policy.icon className="w-5 h-5 shrink-0" style={{ color: policy.color }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: policy.color }}>{policy.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{policy.description}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* All policies legend */}
          <div
            className="rounded-xl border p-5"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <p className="text-xs uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Available Policies</p>
            <div className="space-y-2">
              {Object.entries(policyConfig).map(([key, p]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                  style={{
                    backgroundColor: key === active.on_exceeded ? "var(--bg-card-hover)" : "transparent",
                  }}
                >
                  <p.icon className="w-3.5 h-3.5 shrink-0" style={{ color: p.color }} />
                  <span className="text-xs" style={{ color: key === active.on_exceeded ? p.color : "var(--text-muted)" }}>
                    {p.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
