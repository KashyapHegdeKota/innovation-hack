"use client";

import { useEffect, useState } from "react";
import { Users, Bot, TrendingUp, Search } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { getAgentScores, getDashboardSummary, listReceipts } from "@/lib/greenledger-api";
import { DUMMY_AGENTS } from "@/lib/dummy-agents";
import { topClients as mockClients, platformStats as mockStats } from "@/lib/admin-mock-data";

export default function AdminClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [live, setLive] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [agentsRes, receiptsRes] = await Promise.all([
          getAgentScores(),
          listReceipts({ limit: 200 }),
        ]);
        setLive(true);
        const liveAgents: any[] = Array.isArray(agentsRes.data) ? agentsRes.data : [];
        const raw: any[] = Array.isArray(receiptsRes.data) ? receiptsRes.data : [];

        // Build client map from unique agent_ids (agent_id = user_id in our system)
        const clientMap: Record<string, {
          user_id: string;
          total_inferences: number;
          total_co2e_g: number;
          total_energy_wh: number;
          sustainability_score: number;
          trend: string;
        }> = {};

        // From live agent scores
        liveAgents.forEach((a: any) => {
          const uid = a.agent_id || a.display_name || "unknown";
          if (!clientMap[uid]) {
            clientMap[uid] = {
              user_id: uid,
              total_inferences: a.total_inferences || 0,
              total_co2e_g: a.total_co2e_g || 0,
              total_energy_wh: a.total_energy_wh || 0,
              sustainability_score: a.sustainability_score || 0,
              trend: a.trend || "on_track",
            };
          }
        });

        // From receipts (in case agent scores misses some)
        raw.forEach((r: any) => {
          const uid = r.agent_id || "unknown";
          if (!clientMap[uid]) {
            clientMap[uid] = {
              user_id: uid,
              total_inferences: 0,
              total_co2e_g: 0,
              total_energy_wh: 0,
              sustainability_score: 0,
              trend: "on_track",
            };
          }
          clientMap[uid].total_inferences++;
          clientMap[uid].total_co2e_g += r.environmental_cost?.co2e_g ?? 0;
          clientMap[uid].total_energy_wh += r.environmental_cost?.energy_wh ?? 0;
        });

        // Add dummy agents as demo clients
        DUMMY_AGENTS.forEach(a => {
          clientMap[a.agent_id] = {
            user_id: a.agent_id,
            total_inferences: a.total_inferences,
            total_co2e_g: a.total_co2e_g,
            total_energy_wh: a.total_energy_wh,
            sustainability_score: a.sustainability_score,
            trend: a.trend,
          };
        });

        const allClients = Object.values(clientMap)
          .sort((a, b) => b.sustainability_score - a.sustainability_score);

        setClients(allClients);
        setTotalClients(allClients.length);
        const scores = allClients.map(c => c.sustainability_score);
        setAvgScore(scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0);
      } catch {
        const fallback = mockClients.map(c => ({
          user_id: c.user_id,
          total_inferences: c.inferences,
          total_co2e_g: c.co2e_g,
          total_energy_wh: 0,
          sustainability_score: c.score,
          trend: "on_track",
        }));
        setClients(fallback);
        setTotalClients(fallback.length);
        setAvgScore(mockStats.avg_sustainability_score);
      }
    }
    load();
  }, []);

  const filtered = clients.filter(c =>
    c.user_id.toLowerCase().includes(search.toLowerCase())
  );

  const chartData = clients.slice(0, 8).map(c => ({
    name: c.user_id.length > 14 ? c.user_id.slice(0, 14) + "…" : c.user_id,
    queries: c.total_inferences || 0,
    co2e_g: Number(c.total_co2e_g || 0).toFixed(2),
  }));

  return (
    <div className="max-w-[1200px] mx-auto space-y-8">
      <div className="fade-up">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Users className="w-5 h-5" style={{ color: "var(--blue-accent)" }} />
              <h1 className="text-xl font-black" style={{ letterSpacing: "-0.03em" }}>Clients</h1>
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{totalClients} unique clients (by user ID)</p>
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
          <span className="label">Total Clients</span>
          <p className="text-3xl font-black mt-2" style={{ color: "var(--text-primary)" }}>{totalClients}</p>
        </div>
        <div className="card p-5 fade-up-2">
          <span className="label">Avg Sustainability Score</span>
          <p className="text-3xl font-black mt-2" style={{ color: "var(--green-accent)" }}>{avgScore}</p>
        </div>
        <div className="card p-5 fade-up-3">
          <span className="label">Total Queries</span>
          <p className="text-3xl font-black mt-2" style={{ color: "var(--text-primary)" }}>
            {clients.reduce((s, c) => s + (c.total_inferences || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="card p-5 fade-up-2">
        <span className="label">Client Comparison — Queries &amp; CO₂e (g)</span>
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
          <span className="label">All Clients</span>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input type="text" placeholder="Search by user ID..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 rounded-lg text-xs outline-none" style={{
                backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)",
                fontFamily: "var(--font-display)", width: 220,
              }} />
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["#", "User ID", "Queries", "CO₂e", "Energy", "Score", "Trend"].map(h => (
                <th key={h} className="pb-2 text-left text-[10px] font-mono uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={c.user_id} className="transition-colors"
                style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : undefined }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--hover-bg)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                <td className="py-2.5 text-xs font-mono" style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                <td className="py-2.5">
                  <span className="text-xs font-mono" style={{ color: "var(--text-primary)" }}>{c.user_id}</span>
                </td>
                <td className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{(c.total_inferences || 0).toLocaleString()}</td>
                <td className="text-xs font-mono" style={{ color: "var(--green-accent)" }}>{Number(c.total_co2e_g || 0).toFixed(3)}g</td>
                <td className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{Number(c.total_energy_wh || 0).toFixed(2)} Wh</td>
                <td>
                  <div className="flex items-center gap-1.5">
                    <div className="w-12 h-1.5 rounded-full" style={{ backgroundColor: "var(--track-bg)" }}>
                      <div className="h-full rounded-full" style={{
                        width: `${c.sustainability_score || 0}%`,
                        backgroundColor: (c.sustainability_score || 0) >= 80 ? "#22c55e" : (c.sustainability_score || 0) >= 50 ? "#f59e0b" : "#ef4444",
                      }} />
                    </div>
                    <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>{c.sustainability_score || 0}</span>
                  </div>
                </td>
                <td>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{
                    backgroundColor: c.trend === "on_track" ? "rgba(34,197,94,0.1)" : c.trend === "at_risk" ? "rgba(245,158,11,0.1)" : "rgba(248,113,113,0.1)",
                    color: c.trend === "on_track" ? "var(--green-accent)" : c.trend === "at_risk" ? "var(--amber-accent)" : "var(--red-accent)",
                  }}>{c.trend || "—"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
