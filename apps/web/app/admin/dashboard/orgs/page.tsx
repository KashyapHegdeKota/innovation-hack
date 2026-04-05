"use client";

import { useEffect, useState } from "react";
import { Users, Bot, TrendingUp, Search } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { getAgentScores, getDashboardSummary } from "@/lib/greenledger-api";
import { DUMMY_AGENTS } from "@/lib/dummy-agents";
import { topOrgs as mockOrgs, platformStats as mockStats } from "@/lib/admin-mock-data";

export default function AdminOrgsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [totalAgents, setTotalAgents] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [live, setLive] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [agentsRes, dashRes] = await Promise.all([
          getAgentScores(), getDashboardSummary(),
        ]);
        setLive(true);
        const liveAgents: any[] = Array.isArray(agentsRes.data) ? agentsRes.data : [];
        const dash = dashRes.data ?? {};

        const allAgents = [
          ...liveAgents,
          ...DUMMY_AGENTS.map(a => ({
            agent_id: a.agent_id, display_name: a.display_name,
            total_inferences: a.total_inferences, total_co2e_g: a.total_co2e_g,
            total_energy_wh: a.total_energy_wh, wallet_utilization_pct: a.wallet_utilization_pct,
            sustainability_score: a.sustainability_score, trend: a.trend,
          })),
        ].sort((a: any, b: any) => (b.sustainability_score || 0) - (a.sustainability_score || 0));

        setAgents(allAgents);
        setTotalAgents(allAgents.length);
        const scores = allAgents.map((a: any) => a.sustainability_score || 0);
        setAvgScore(scores.length > 0 ? Math.round(scores.reduce((s: number, v: number) => s + v, 0) / scores.length) : 0);
      } catch {
        const fallback = mockOrgs.map(o => ({
          agent_id: o.name, display_name: o.name, total_inferences: o.inferences,
          total_co2e_g: o.co2e_avoided_g, total_energy_wh: 0,
          wallet_utilization_pct: null, sustainability_score: o.score, trend: "on_track",
        }));
        setAgents(fallback);
        setTotalAgents(fallback.length);
        setAvgScore(mockStats.avg_sustainability_score);
      }
    }
    load();
  }, []);

  const filtered = agents.filter((a: any) =>
    (a.display_name || a.agent_id || "").toLowerCase().includes(search.toLowerCase())
  );

  const chartData = agents.slice(0, 8).map((a: any) => ({
    name: (a.display_name || a.agent_id || "").split(" ")[0].slice(0, 10),
    queries: a.total_inferences || 0,
    co2e_g: Number(a.total_co2e_g || 0).toFixed(2),
  }));

  return (
    <div className="max-w-[1200px] mx-auto space-y-8">
      <div className="fade-up">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Users className="w-5 h-5" style={{ color: "var(--blue-accent)" }} />
              <h1 className="text-xl font-black" style={{ letterSpacing: "-0.03em" }}>Agents &amp; Organizations</h1>
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{totalAgents} agents across the platform</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: live ? "#22c55e" : "#525252", boxShadow: live ? "0 0 6px #22c55e" : "none", animation: "pulse-green 2s ease-in-out infinite" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase" as const, color: live ? "#22c55e" : "var(--text-muted)" }}>
              {live ? "Live" : "Mock"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5 fade-up-1">
          <span className="label">Total Agents</span>
          <p className="text-3xl font-black mt-2" style={{ color: "var(--text-primary)" }}>{totalAgents}</p>
        </div>
        <div className="card p-5 fade-up-2">
          <span className="label">Avg Sustainability Score</span>
          <p className="text-3xl font-black mt-2" style={{ color: "var(--green-accent)" }}>{avgScore}</p>
        </div>
        <div className="card p-5 fade-up-3">
          <span className="label">Total Queries</span>
          <p className="text-3xl font-black mt-2" style={{ color: "var(--text-primary)" }}>
            {agents.reduce((s: number, a: any) => s + (a.total_inferences || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="card p-5 fade-up-2">
        <span className="label">Agent Comparison — Queries &amp; CO₂e (g)</span>
        <div className="mt-4" style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" }} />
              <Bar dataKey="queries" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Queries" />
              <Bar dataKey="co2e_g" fill="#22c55e" radius={[4, 4, 0, 0]} name="CO₂e (g)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5 fade-up-3">
        <div className="flex items-center justify-between mb-4">
          <span className="label">All Agents</span>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input type="text" placeholder="Search agents..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 rounded-lg text-xs outline-none" style={{
                backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)",
                fontFamily: "var(--font-display)", width: 200,
              }} />
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["#", "Agent", "Queries", "CO₂e", "Energy", "Score", "Trend"].map(h => (
                <th key={h} className="pb-2 text-left text-[10px] font-mono uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a: any, i: number) => (
              <tr key={a.agent_id} className="transition-colors"
                style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : undefined }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--hover-bg)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                <td className="py-2.5 text-xs font-mono" style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                <td className="py-2.5"><span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{a.display_name || a.agent_id}</span></td>
                <td className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{(a.total_inferences || 0).toLocaleString()}</td>
                <td className="text-xs font-mono" style={{ color: "var(--green-accent)" }}>{Number(a.total_co2e_g || 0).toFixed(3)}g</td>
                <td className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{Number(a.total_energy_wh || 0).toFixed(2)} Wh</td>
                <td>
                  <div className="flex items-center gap-1.5">
                    <div className="w-12 h-1.5 rounded-full" style={{ backgroundColor: "var(--track-bg)" }}>
                      <div className="h-full rounded-full" style={{
                        width: `${a.sustainability_score || 0}%`,
                        backgroundColor: (a.sustainability_score || 0) >= 80 ? "#22c55e" : (a.sustainability_score || 0) >= 50 ? "#f59e0b" : "#ef4444",
                      }} />
                    </div>
                    <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>{a.sustainability_score || 0}</span>
                  </div>
                </td>
                <td>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{
                    backgroundColor: a.trend === "on_track" ? "rgba(34,197,94,0.1)" : a.trend === "at_risk" ? "rgba(245,158,11,0.1)" : "rgba(248,113,113,0.1)",
                    color: a.trend === "on_track" ? "var(--green-accent)" : a.trend === "at_risk" ? "var(--amber-accent)" : "var(--red-accent)",
                  }}>{a.trend || "—"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
