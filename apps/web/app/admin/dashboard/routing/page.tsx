"use client";

import { ArrowDownRight, GitBranch, CheckCircle, XCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { routingIntelligence, modelEcosystem } from "@/lib/admin-mock-data";

function shortModel(m: string) {
  return m.replace("claude-", "").replace("gpt-", "").replace("gemini-", "");
}

const REJECTION_COLORS = ["#f59e0b", "#3b82f6", "#a855f7", "#ef4444"];

export default function AdminRoutingPage() {
  const downgradeSavingsChart = routingIntelligence.top_downgrades.map(d => ({
    route: `${shortModel(d.from)} → ${shortModel(d.to)}`,
    savings_usd: d.savings_usd,
    count: d.count,
    co2e_kg: +(d.co2e_avoided_g / 1000).toFixed(1),
  }));

  return (
    <div className="max-w-[1200px] mx-auto space-y-8">
      {/* Header */}
      <div className="fade-up">
        <div className="flex items-center gap-3 mb-1">
          <GitBranch className="w-5 h-5" style={{ color: "var(--blue-accent)" }} />
          <h1 className="text-xl font-black" style={{ letterSpacing: "-0.03em" }}>
            Routing Intelligence
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          How the Green Router is optimizing model selection across the platform
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-5 fade-up-1">
          <span className="label">Total Decisions</span>
          <p className="text-2xl font-black mt-2" style={{ color: "var(--text-primary)" }}>
            {(routingIntelligence.total_routing_decisions / 1000).toFixed(0)}k
          </p>
        </div>
        <div className="card p-5 fade-up-2">
          <span className="label">Downgrades Suggested</span>
          <p className="text-2xl font-black mt-2" style={{ color: "var(--amber-accent)" }}>
            {(routingIntelligence.downgrades_suggested / 1000).toFixed(0)}k
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {((routingIntelligence.downgrades_suggested / routingIntelligence.total_routing_decisions) * 100).toFixed(0)}% of all
          </p>
        </div>
        <div className="card p-5 fade-up-3">
          <span className="label">Accepted</span>
          <p className="text-2xl font-black mt-2" style={{ color: "var(--green-accent)" }}>
            {(routingIntelligence.downgrades_accepted / 1000).toFixed(0)}k
          </p>
          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "var(--green-accent)" }}>
            <CheckCircle className="w-3 h-3" />
            {routingIntelligence.acceptance_rate_pct}% rate
          </p>
        </div>
        <div className="card p-5 fade-up-4">
          <span className="label">Rejected</span>
          <p className="text-2xl font-black mt-2" style={{ color: "var(--red-accent)" }}>
            {((routingIntelligence.downgrades_suggested - routingIntelligence.downgrades_accepted) / 1000).toFixed(0)}k
          </p>
          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "var(--red-accent)" }}>
            <XCircle className="w-3 h-3" />
            {(100 - routingIntelligence.acceptance_rate_pct).toFixed(1)}% rate
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Downgrade Routes by Savings */}
        <div className="card p-5 fade-up-1">
          <span className="label">Top Downgrade Routes — by API Savings ($)</span>
          <div className="mt-4" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={downgradeSavingsChart} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis dataKey="route" type="category" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} tickLine={false} axisLine={false} width={130} />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--text-primary)",
                  }}
                />
                <Bar dataKey="savings_usd" fill="#22c55e" radius={[0, 4, 4, 0]} name="Savings ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rejection Reasons Pie */}
        <div className="card p-5 fade-up-2">
          <span className="label">Why Users Reject Downgrades</span>
          <div className="flex items-center mt-4">
            <div style={{ width: 180, height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={routingIntelligence.rejection_reasons}
                    dataKey="pct"
                    nameKey="reason"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    stroke="var(--bg-card)"
                    strokeWidth={2}
                  >
                    {routingIntelligence.rejection_reasons.map((_, i) => (
                      <Cell key={i} fill={REJECTION_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "var(--text-primary)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3 pl-4">
              {routingIntelligence.rejection_reasons.map((r, i) => (
                <div key={r.reason} className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: REJECTION_COLORS[i] }} />
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{r.reason}</span>
                  <span className="text-xs font-mono ml-auto" style={{ color: "var(--text-muted)" }}>{r.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed downgrade table */}
      <div className="card p-5 fade-up-3">
        <span className="label">All Downgrade Routes — Detailed Breakdown</span>
        <div className="mt-4">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["From → To", "Count", "API Savings", "CO₂e Avoided", "Avg Savings/Query"].map(h => (
                  <th key={h} className="pb-2 text-left text-[10px] font-mono uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {routingIntelligence.top_downgrades.map((d, i) => (
                <tr
                  key={i}
                  className="transition-colors"
                  style={{ borderBottom: i < routingIntelligence.top_downgrades.length - 1 ? "1px solid var(--border)" : undefined }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--hover-bg)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td className="py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
                        {shortModel(d.from)}
                      </span>
                      <ArrowDownRight className="w-3 h-3" style={{ color: "var(--green-accent)" }} />
                      <span className="text-xs font-mono" style={{ color: "var(--green-accent)" }}>
                        {shortModel(d.to)}
                      </span>
                    </div>
                  </td>
                  <td className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{d.count.toLocaleString()}</td>
                  <td className="text-xs font-mono" style={{ color: "var(--green-accent)" }}>${d.savings_usd.toFixed(2)}</td>
                  <td className="text-xs font-mono" style={{ color: "var(--green-accent)" }}>{(d.co2e_avoided_g / 1000).toFixed(1)} kg</td>
                  <td className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                    ${(d.savings_usd / d.count * 1000).toFixed(2)}/k
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
