"use client";

import { TreePine, DollarSign, CheckCircle, Clock } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { carbonRemoval, platformStats, platformEmissions } from "@/lib/admin-mock-data";

export default function AdminCarbonPage() {
  const confirmedPct = (
    (carbonRemoval.removal_partners.find(p => p.status === "confirmed")?.allocated_usd || 0) /
    carbonRemoval.total_levy_usd * 100
  ).toFixed(0);

  return (
    <div className="max-w-[1200px] mx-auto space-y-8">
      {/* Header */}
      <div className="fade-up">
        <div className="flex items-center gap-3 mb-1">
          <TreePine className="w-5 h-5" style={{ color: "var(--green-accent)" }} />
          <h1 className="text-xl font-black" style={{ letterSpacing: "-0.03em" }}>
            Carbon Removal
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Tracking how GreenLedger levies fund real carbon removal
        </p>
      </div>

      {/* Hero number */}
      <div className="card p-8 text-center fade-up-1" style={{ borderTop: "2px solid rgba(34,197,94,0.2)" }}>
        <p className="text-5xl font-black" style={{ color: "var(--green-accent)", letterSpacing: "-0.04em" }}>
          {(carbonRemoval.total_carbon_removed_g / 1000).toFixed(1)} kg
        </p>
        <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
          total carbon removed from the atmosphere via GreenLedger
        </p>
        <div className="flex items-center justify-center gap-8 mt-6">
          <div className="text-center">
            <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              ${carbonRemoval.total_levy_usd.toFixed(2)}
            </p>
            <p className="text-[10px] mt-0.5 label">Levy Collected</p>
          </div>
          <div style={{ width: 1, height: 32, backgroundColor: "var(--border)" }} />
          <div className="text-center">
            <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              {confirmedPct}%
            </p>
            <p className="text-[10px] mt-0.5 label">Confirmed</p>
          </div>
          <div style={{ width: 1, height: 32, backgroundColor: "var(--border)" }} />
          <div className="text-center">
            <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              {(platformStats.total_co2e_avoided_g / 1000).toFixed(1)} kg
            </p>
            <p className="text-[10px] mt-0.5 label">CO₂e Avoided</p>
          </div>
        </div>
      </div>

      {/* Removal Partners */}
      <div className="grid grid-cols-3 gap-4">
        {carbonRemoval.removal_partners.map((p) => (
          <div
            key={p.name}
            className="card p-5 fade-up-2"
            style={{
              borderTop: `2px solid ${
                p.status === "confirmed" ? "rgba(34,197,94,0.3)" :
                p.status === "pooled" ? "rgba(96,165,250,0.3)" :
                "rgba(245,158,11,0.3)"
              }`,
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              {p.status === "confirmed" ? (
                <CheckCircle className="w-4 h-4" style={{ color: "var(--green-accent)" }} />
              ) : (
                <Clock className="w-4 h-4" style={{ color: p.status === "pooled" ? "var(--blue-accent)" : "var(--amber-accent)" }} />
              )}
              <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                {p.name}
              </span>
            </div>
            <p className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
              {(p.removed_g / 1000).toFixed(1)} kg
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              ${p.allocated_usd.toFixed(2)} allocated
            </p>
            <div className="mt-3">
              <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: "var(--track-bg)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(p.allocated_usd / carbonRemoval.total_levy_usd) * 100}%`,
                    backgroundColor:
                      p.status === "confirmed" ? "#22c55e" :
                      p.status === "pooled" ? "#60a5fa" : "#f59e0b",
                  }}
                />
              </div>
              <p className="text-[10px] font-mono mt-1" style={{ color: "var(--text-muted)" }}>
                {((p.allocated_usd / carbonRemoval.total_levy_usd) * 100).toFixed(0)}% of total fund
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Monthly levy growth */}
        <div className="card p-5 fade-up-1">
          <span className="label">Monthly Levy Collection Growth</span>
          <div className="mt-4" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={carbonRemoval.monthly_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fill: "var(--text-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--text-primary)",
                  }}
                />
                <Bar dataKey="levy_usd" fill="#22c55e" radius={[4, 4, 0, 0]} name="Levy ($)" />
                <Bar dataKey="removed_g" fill="#4ade80" radius={[4, 4, 0, 0]} name="Removed (g)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CO₂e avoided over time */}
        <div className="card p-5 fade-up-2">
          <span className="label">CO₂e Avoided Over Time (g)</span>
          <div className="mt-4" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={platformEmissions}>
                <defs>
                  <linearGradient id="carbonGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--text-primary)",
                  }}
                />
                <Area type="monotone" dataKey="co2e_avoided" stroke="#22c55e" fill="url(#carbonGreen)" strokeWidth={2} name="CO₂e Avoided" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="card p-6 fade-up-3">
        <span className="label">How the Carbon Levy Works</span>
        <div className="flex items-center justify-between mt-5 gap-3">
          {[
            { step: "1", title: "Agent Queries", desc: "AI agents send inference requests through GreenLedger" },
            { step: "2", title: "Router Optimizes", desc: "Green Router picks the most carbon-efficient model" },
            { step: "3", title: "Savings Calculated", desc: "We compare original vs routed model API cost" },
            { step: "4", title: "20% Levy Applied", desc: "One-fifth of savings goes to carbon removal" },
            { step: "5", title: "Stripe Climate", desc: "Funds go to permanent carbon removal projects" },
          ].map((s, i) => (
            <div key={s.step} className="flex-1 text-center">
              <div className="flex items-center justify-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: "rgba(34,197,94,0.1)",
                    color: "var(--green-accent)",
                    fontFamily: "var(--font-mono)",
                    border: "1px solid rgba(34,197,94,0.15)",
                  }}
                >
                  {s.step}
                </div>
                {i < 4 && (
                  <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
                )}
              </div>
              <p className="text-xs font-medium mt-2" style={{ color: "var(--text-primary)" }}>{s.title}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
