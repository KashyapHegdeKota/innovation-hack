"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Search } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { getAgentScores, listReceipts } from "@/lib/greenledger-api";

/* ── animation variants ───────────────────────────────────────── */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.25, 0.1, 0.25, 1] as const } },
};

/* ── tiny section label ───────────────────────────────────────── */
function Sec({ children }: { children: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 700,
        letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)",
        whiteSpace: "nowrap",
      }}>
        {children}
      </span>
      <div style={{ flex: 1, height: "1px", backgroundColor: "var(--rule, #1e1e1e)" }} />
    </div>
  );
}

/* ── main page ────────────────────────────────────────────────── */
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

        const allClients = Object.values(clientMap)
          .sort((a, b) => b.sustainability_score - a.sustainability_score);

        setClients(allClients);
        setTotalClients(allClients.length);
        const scores = allClients.map(c => c.sustainability_score);
        setAvgScore(scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0);
      } catch {
        setClients([]);
        setTotalClients(0);
        setAvgScore(0);
      }
    }
    load();
  }, []);

  const filtered = clients.filter(c =>
    c.user_id.toLowerCase().includes(search.toLowerCase())
  );

  const chartData = clients.slice(0, 8).map(c => ({
    name: c.user_id.length > 14 ? c.user_id.slice(0, 14) + "\u2026" : c.user_id,
    queries: c.total_inferences || 0,
    co2e_g: Number(c.total_co2e_g || 0).toFixed(2),
  }));

  const heroMetrics = [
    { label: "Total Clients", value: String(totalClients), accent: false },
    { label: "Avg Sustainability", value: String(avgScore), accent: true },
    { label: "Total Queries", value: clients.reduce((s, c) => s + (c.total_inferences || 0), 0).toLocaleString(), accent: false },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ maxWidth: 1200, margin: "0 auto" }}>

      {/* ── Page header ─────────────────────────────────────────── */}
      <motion.div variants={item} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "6px" }}>
            <Users style={{ width: 20, height: 20, color: "var(--blue-accent)" }} />
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.8rem",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                color: "var(--text-primary)",
                lineHeight: 1,
                textTransform: "uppercase",
              }}
            >
              Clients
            </h1>
          </div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "6px", letterSpacing: "0.04em" }}>
            {totalClients} unique clients (by user ID)
          </p>
        </div>

        {/* Live badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingTop: "4px" }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%", display: "inline-block", flexShrink: 0,
            backgroundColor: live ? "#22c55e" : "#525252",
            boxShadow: live ? "0 0 6px #22c55e" : "none",
            animation: "pulse-green 2s ease-in-out infinite",
          }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase" as const, color: live ? "#22c55e" : "var(--text-muted)" }}>
            {live ? "Live" : "Mock"}
          </span>
        </div>
      </motion.div>

      {/* ── Hero metrics row ─────────────────────────────────────── */}
      <motion.div variants={item} style={{ marginBottom: "2.5rem" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          borderTop: "1px solid var(--rule, #1e1e1e)",
          borderBottom: "1px solid var(--rule, #1e1e1e)",
        }}>
          {heroMetrics.map((m, i) => (
            <div
              key={m.label}
              style={{
                borderLeft: i > 0 ? "1px solid var(--rule, #1e1e1e)" : "none",
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "clamp(1.2rem, 2vw, 1.8rem)",
                fontWeight: 700,
                color: m.accent ? "#22c55e" : "var(--text-primary)",
                letterSpacing: "-0.04em",
                lineHeight: 1,
              }}>
                {m.value}
              </span>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}>
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Client Comparison Chart ──────────────────────────────── */}
      <motion.div variants={item} style={{ borderTop: "1px solid var(--rule, #1e1e1e)", paddingTop: "2rem", marginBottom: "2.5rem" }}>
        <Sec>Client Comparison</Sec>
        <div
          className="rounded-xl overflow-hidden"
          style={{
            position: "relative",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            padding: "1.25rem",
          }}
        >
          {/* Gradient accent line */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(96,165,250,0.3), transparent)",
            }}
          />
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "9px",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}>
            Queries &amp; CO&#x2082;e (g)
          </span>
          <div style={{ height: 240, marginTop: "0.75rem" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" }} />
                <Bar dataKey="queries" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Queries" />
                <Bar dataKey="co2e_g" fill="#22c55e" radius={[4, 4, 0, 0]} name="CO&#x2082;e (g)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* ── All Clients Table ────────────────────────────────────── */}
      <motion.div variants={item} style={{ borderTop: "1px solid var(--rule, #1e1e1e)", paddingTop: "2rem", marginBottom: "2.5rem" }}>
        <Sec>All Clients</Sec>

        {/* Search */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
          <div style={{ position: "relative" }}>
            <Search style={{ width: 14, height: 14, position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search by user ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                paddingLeft: 36,
                paddingRight: 16,
                paddingTop: 6,
                paddingBottom: 6,
                borderRadius: 8,
                fontSize: 12,
                outline: "none",
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
                width: 220,
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                {["#", "User ID", "Queries", "CO\u2082e", "Energy", "Score", "Trend"].map(h => (
                  <th
                    key={h}
                    className="label"
                    style={{
                      padding: "0.625rem 1rem",
                      textAlign: "left",
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--text-muted)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "3rem 1rem",
                      textAlign: "center",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--text-muted)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    No clients found. Data will appear once agents begin sending inferences.
                  </td>
                </tr>
              )}
              {filtered.map((c, i) => (
                <motion.tr
                  key={c.user_id}
                  variants={item}
                  style={{
                    borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : undefined,
                    transition: "background-color 150ms",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--hover-bg)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td style={{ padding: "0.625rem 1rem", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>
                    {i + 1}
                  </td>
                  <td style={{ padding: "0.625rem 1rem" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-primary)" }}>
                      {c.user_id}
                    </span>
                  </td>
                  <td style={{ padding: "0.625rem 1rem", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-secondary)" }}>
                    {(c.total_inferences || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: "0.625rem 1rem", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--green-accent)" }}>
                    {Number(c.total_co2e_g || 0).toFixed(3)}g
                  </td>
                  <td style={{ padding: "0.625rem 1rem", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-secondary)" }}>
                    {Number(c.total_energy_wh || 0).toFixed(2)} Wh
                  </td>
                  <td style={{ padding: "0.625rem 1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 48, height: 6, borderRadius: 9999, backgroundColor: "var(--track-bg)" }}>
                        <div style={{
                          height: "100%",
                          borderRadius: 9999,
                          width: `${c.sustainability_score || 0}%`,
                          backgroundColor: (c.sustainability_score || 0) >= 80 ? "#22c55e" : (c.sustainability_score || 0) >= 50 ? "#f59e0b" : "#ef4444",
                        }} />
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)" }}>
                        {c.sustainability_score || 0}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "0.625rem 1rem" }}>
                    <span style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      padding: "2px 6px",
                      borderRadius: 4,
                      backgroundColor: c.trend === "on_track" ? "rgba(34,197,94,0.1)" : c.trend === "at_risk" ? "rgba(245,158,11,0.1)" : "rgba(248,113,113,0.1)",
                      color: c.trend === "on_track" ? "var(--green-accent)" : c.trend === "at_risk" ? "var(--amber-accent)" : "var(--red-accent)",
                    }}>
                      {c.trend || "\u2014"}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

    </motion.div>
  );
}
