"use client";

import { Users, Bot, TrendingUp, Search } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { topOrgs, platformStats } from "@/lib/admin-mock-data";
import { useState } from "react";

export default function AdminOrgsPage() {
  const [search, setSearch] = useState("");
  const filtered = topOrgs.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  const chartData = topOrgs.map(o => ({
    name: o.name.split(" ")[0],
    agents: o.agents,
    queries: Math.round(o.inferences / 1000),
    co2e_kg: +(o.co2e_avoided_g / 1000).toFixed(1),
  }));

  return (
    <div className="max-w-[1200px] mx-auto space-y-8">
      {/* Header */}
      <div className="fade-up">
        <div className="flex items-center gap-3 mb-1">
          <Users className="w-5 h-5" style={{ color: "var(--blue-accent)" }} />
          <h1 className="text-xl font-black" style={{ letterSpacing: "-0.03em" }}>
            Organizations
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {platformStats.total_orgs} organizations &middot; {platformStats.total_agents} agents
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5 fade-up-1">
          <span className="label">Total Organizations</span>
          <p className="text-3xl font-black mt-2" style={{ color: "var(--text-primary)" }}>
            {platformStats.total_orgs}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--green-accent)" }}>
            +9 this month
          </p>
        </div>
        <div className="card p-5 fade-up-2">
          <span className="label">Avg Agents per Org</span>
          <p className="text-3xl font-black mt-2" style={{ color: "var(--text-primary)" }}>
            {(platformStats.total_agents / platformStats.total_orgs).toFixed(1)}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            across all orgs
          </p>
        </div>
        <div className="card p-5 fade-up-3">
          <span className="label">Avg Sustainability Score</span>
          <p className="text-3xl font-black mt-2" style={{ color: "var(--green-accent)" }}>
            {platformStats.avg_sustainability_score}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            platform average
          </p>
        </div>
      </div>

      {/* Chart: Org comparison */}
      <div className="card p-5 fade-up-2">
        <span className="label">Organization Comparison — Queries (k) &amp; CO₂e Avoided (kg)</span>
        <div className="mt-4" style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
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
              <Bar dataKey="queries" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Queries (k)" />
              <Bar dataKey="co2e_kg" fill="#22c55e" radius={[4, 4, 0, 0]} name="CO₂e Avoided (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Search + Table */}
      <div className="card p-5 fade-up-3">
        <div className="flex items-center justify-between mb-4">
          <span className="label">All Organizations</span>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search orgs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 rounded-lg text-xs outline-none"
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
                width: 200,
              }}
            />
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["#", "Organization", "Agents", "Queries", "CO₂e Avoided", "Score", "Levy Contributed"].map(h => (
                <th
                  key={h}
                  className="pb-2 text-left text-[10px] font-mono uppercase"
                  style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((org, i) => (
              <tr
                key={org.name}
                className="transition-colors"
                style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : undefined }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--hover-bg)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <td className="py-2.5 text-xs font-mono" style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                <td className="py-2.5">
                  <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{org.name}</span>
                </td>
                <td className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
                  <div className="flex items-center gap-1.5">
                    <Bot className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
                    {org.agents}
                  </div>
                </td>
                <td className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{org.inferences.toLocaleString()}</td>
                <td className="text-xs font-mono" style={{ color: "var(--green-accent)" }}>{(org.co2e_avoided_g / 1000).toFixed(1)} kg</td>
                <td>
                  <div className="flex items-center gap-1.5">
                    <div className="w-12 h-1.5 rounded-full" style={{ backgroundColor: "var(--track-bg)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${org.score}%`,
                          backgroundColor: org.score >= 80 ? "#22c55e" : org.score >= 70 ? "#f59e0b" : "#ef4444",
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>{org.score}</span>
                  </div>
                </td>
                <td className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>${org.levy_usd.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
