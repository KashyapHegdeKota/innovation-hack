"use client";

import { useState, useEffect } from "react";
import { Wallet, RefreshCcw, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from "recharts";
import { getAgentScores } from "@/lib/greenledger-api";
import apiClient from "@/lib/api-client";

const trendConfig: Record<string, { label: string; color: string; icon: any }> = {
  on_track: { label: "On Track",  color: "var(--green-accent)",  icon: CheckCircle },
  at_risk:  { label: "At Risk",   color: "var(--amber-accent)",  icon: AlertTriangle },
  exceeded: { label: "Exceeded",  color: "var(--red-accent)",    icon: AlertTriangle },
};

const policyLabels: Record<string, string> = {
  downgrade_model: "Downgrade Model",
  defer:           "Defer Request",
  offset:          "Auto Offset",
  block:           "Block Request",
};

function UtilizationBar({ pct }: { pct: number }) {
  const color = pct >= 90 ? "var(--red-accent)" : pct >= 70 ? "var(--amber-accent)" : "var(--green-accent)";
  return (
    <div className="w-full h-1.5 rounded-full mt-2" style={{ backgroundColor: "var(--bg-secondary)" }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
    </div>
  );
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get all agents first, then fetch wallet for each
      const agentsRes = await getAgentScores();
      const agents: any[] = Array.isArray(agentsRes.data) ? agentsRes.data : [];

      const walletResults = await Promise.allSettled(
        agents.map((a) => apiClient.get(`/v1/wallets/${a.agent_id}`))
      );

      const fetched = walletResults
        .filter((r) => r.status === "fulfilled")
        .map((r: any) => r.value.data);

      setWallets(fetched);
      setLive(true);
    } catch { /* backend unavailable */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const totalBudget  = wallets.reduce((s, w) => s + (w.monthly_budget_co2e_g ?? 0), 0);
  const totalSpent   = wallets.reduce((s, w) => s + (w.current_spend_co2e_g ?? 0), 0);
  const overallPct   = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const atRiskCount  = wallets.filter(w => w.trend === "at_risk" || w.trend === "exceeded").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Carbon Wallets</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Per-agent carbon budgets with policy enforcement
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: live ? "rgba(34,197,94,0.1)" : "rgba(90,117,101,0.15)", color: live ? "var(--green-accent)" : "var(--text-muted)" }}>
              {live ? "● Live" : "○ No data"}
            </span>
          </p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border hover:opacity-80"
          style={{ borderColor: "var(--border-bright)", color: "var(--text-secondary)", backgroundColor: "var(--bg-card)" }}>
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Wallets",    value: wallets.length },
          { label: "Total Budget",     value: `${totalBudget.toFixed(1)}g CO2e` },
          { label: "Total Spent",      value: `${totalSpent.toFixed(3)}g CO2e` },
          { label: "At Risk / Over",   value: atRiskCount },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-4" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            <p className="text-xl font-bold font-mono" style={{ color: "var(--text-primary)" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {wallets.length === 0 ? (
        <div className="rounded-xl border p-16 flex flex-col items-center justify-center gap-3"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
          <Wallet className="w-8 h-8" style={{ color: "var(--text-muted)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            {loading ? "Loading wallets..." : "No wallets found — run queries in the CLI to create one automatically."}
          </p>
        </div>
      ) : (
        <>
          {/* Overall utilization gauge */}
          <div className="rounded-xl border p-5 flex items-center gap-8"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
            <div style={{ width: 160, height: 160, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%"
                  data={[{ value: overallPct, fill: overallPct >= 90 ? "#ef4444" : overallPct >= 70 ? "#f59e0b" : "#22c55e" }]}
                  startAngle={90} endAngle={-270}>
                  <RadialBar dataKey="value" cornerRadius={4} background={{ fill: "var(--bg-secondary)" }} />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
                    style={{ fill: "var(--text-primary)", fontSize: 22, fontWeight: 700, fontFamily: "monospace" }}>
                    {overallPct}%
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Overall Budget Utilization</p>
              <p className="text-2xl font-bold font-mono" style={{ color: "var(--text-primary)" }}>
                {totalSpent.toFixed(3)}g <span className="text-base font-normal" style={{ color: "var(--text-muted)" }}>/ {totalBudget.toFixed(1)}g CO2e</span>
              </p>
              <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                {wallets.length} wallet{wallets.length !== 1 ? "s" : ""} · {atRiskCount} at risk or exceeded
              </p>
            </div>
          </div>

          {/* Per-agent wallets */}
          <div className="grid grid-cols-2 gap-4">
            {wallets.map((w) => {
              const t = trendConfig[w.trend] ?? trendConfig.on_track;
              const pct = w.utilization_pct ?? 0;
              const barColor = pct >= 90 ? "var(--red-accent)" : pct >= 70 ? "var(--amber-accent)" : "var(--green-accent)";
              return (
                <div key={w.id} className="rounded-xl border p-5" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{w.agent_id}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        Policy: {policyLabels[w.on_exceeded] ?? w.on_exceeded}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                      style={{ backgroundColor: `${t.color}15`, color: t.color }}>
                      <t.icon className="w-3 h-3" />
                      {t.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {[
                      { label: "Budget",    value: `${w.monthly_budget_co2e_g?.toFixed(1)}g` },
                      { label: "Spent",     value: `${w.current_spend_co2e_g?.toFixed(3)}g` },
                      { label: "Remaining", value: `${w.remaining_co2e_g?.toFixed(3)}g` },
                    ].map((stat) => (
                      <div key={stat.label}>
                        <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
                        <p className="text-sm font-mono font-medium" style={{ color: "var(--text-primary)" }}>{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>
                      <span>Utilization</span>
                      <span style={{ color: barColor }}>{pct.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: "var(--bg-secondary)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }} />
                    </div>
                  </div>

                  <p className="text-[10px] mt-3" style={{ color: "var(--text-muted)" }}>
                    Period: {new Date(w.period_start).toLocaleDateString()} — {new Date(w.period_end).toLocaleDateString()}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
