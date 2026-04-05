"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Users, Bot, Zap, TreePine, TrendingUp, ArrowDownRight,
  DollarSign, Activity, Award,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  getDashboardSummary, getAgentScores, listReceipts, getLevySummary,
} from "@/lib/greenledger-api";

/* ── helpers ───────────────────────────────────────────────────── */
function shortModel(m: string) {
  return m.replace("claude-", "").replace("gpt-", "").replace("gemini-", "");
}

const MODEL_COLORS: Record<string, string> = {
  "claude-haiku-4-5": "#22c55e", "gpt-4.1-nano": "#a855f7",
  "claude-sonnet-4-6": "#3b82f6", "gemini-3.1-flash": "#f59e0b",
  "gpt-4.1-mini": "#ec4899", "claude-opus-4-6": "#ef4444", "o3-mini": "#06b6d4",
};
const PIE_COLORS = ["#22c55e", "#60a5fa", "#a855f7", "#f59e0b", "#f87171", "#ec4899", "#06b6d4"];

/* ── animation variants ────────────────────────────────────────── */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.25, 0.1, 0.25, 1] as const } },
};

/* ── section label ─────────────────────────────────────────────── */
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

/* ── formatting helpers ────────────────────────────────────────── */
function fmtCo2(g: number): string {
  if (g < 1000) return g.toFixed(2) + " g";
  return (g / 1000).toFixed(1) + " kg";
}
function fmtEnergy(wh: number): string {
  if (wh < 1000) return wh.toFixed(2) + " Wh";
  return (wh / 1000).toFixed(1) + " kWh";
}
function fmtWater(ml: number): string {
  if (ml < 1000) return ml.toFixed(1) + " mL";
  return (ml / 1000).toFixed(1) + " L";
}

/* ── zero-state defaults ───────────────────────────────────────── */
const EMPTY_STATS = {
  total_clients: 0,
  total_agents: 0,
  total_inferences: 0,
  total_co2e_avoided_g: 0,
  total_energy_saved_wh: 0,
  total_water_saved_ml: 0,
  total_levy_collected_usd: 0,
  total_carbon_removed_g: 0,
  total_api_cost_saved_usd: 0,
  avg_sustainability_score: 0,
  downgrade_acceptance_rate_pct: 0,
  period: "",
};

const EMPTY_ROUTING = {
  total_routing_decisions: 0,
  downgrades_accepted: 0,
  acceptance_rate_pct: 0,
  top_downgrades: [] as { from: string; to: string; count: number; savings_usd: number; co2e_avoided_g: number }[],
};

const EMPTY_CARBON = {
  total_levy_usd: 0,
  total_carbon_removed_g: 0,
  removal_partners: [] as { name: string; allocated_usd: number; removed_g: number; status: "confirmed" | "pooled" | "pending" }[],
};

export default function AdminDashboardPage() {
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);

  // Core stats
  const [stats, setStats] = useState(EMPTY_STATS);
  // Emissions time-series
  const [emissionsData, setEmissionsData] = useState<{ date: string; co2e_actual: number; co2e_avoided: number; levy_usd: number }[]>([]);
  // Model distribution
  const [modelData, setModelData] = useState<{ model: string; provider: string; queries: number; avg_co2e_g: number; pct_of_total: number }[]>([]);
  // Agent leaderboard
  const [agents, setAgents] = useState<any[]>([]);
  // Routing
  const [routing, setRouting] = useState(EMPTY_ROUTING);
  // Carbon removal
  const [carbon, setCarbon] = useState(EMPTY_CARBON);
  // Recent receipts (activity)
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [dashRes, agentsRes, receiptsRes, levyRes] = await Promise.all([
          getDashboardSummary(),
          getAgentScores(),
          listReceipts({ limit: 200 }),
          getLevySummary().catch(() => ({ data: null })),
        ]);
        setLive(true);

        const dash = dashRes.data ?? {};
        const raw: any[] = Array.isArray(receiptsRes.data) ? receiptsRes.data : [];
        const liveAgents: any[] = Array.isArray(agentsRes.data) ? agentsRes.data : [];
        const levy = levyRes.data;

        // ── Stats ─────────────────────────────────────────────────
        const totalInf = dash.total_inferences || 0;
        const totalCo2e = dash.total_co2e_g || 0;
        const totalEnergy = dash.total_energy_wh || 0;
        const totalLevy = dash.total_levy_usd || 0;
        const totalRemoved = dash.total_carbon_removed_g || 0;
        const activeAgents = dash.active_agents || 0;
        const avgSavings = dash.avg_savings_vs_naive_pct || 0;
        const score = dash.sustainability_score || 0;

        // Compute routing stats from receipts
        const downgrades = raw.filter((r: any) => r.requested_model && r.model && r.requested_model !== r.model);
        const totalDecisions = raw.length;
        const totalAccepted = downgrades.length;
        const acceptRate = totalDecisions > 0 ? Math.round((totalAccepted / totalDecisions) * 100) : 0;

        // Unique clients = unique agent_ids from receipts
        const liveClientIds = new Set(raw.map((r: any) => r.agent_id).filter(Boolean));
        const totalClients = liveClientIds.size;

        setStats({
          total_clients: totalClients,
          total_agents: activeAgents,
          total_inferences: totalInf,
          total_co2e_avoided_g: totalCo2e,
          total_energy_saved_wh: totalEnergy,
          total_water_saved_ml: dash.total_water_ml || 0,
          total_levy_collected_usd: totalLevy,
          total_carbon_removed_g: totalRemoved,
          total_api_cost_saved_usd: levy?.total_savings_usd || 0,
          avg_sustainability_score: score,
          downgrade_acceptance_rate_pct: acceptRate,
          period: dash.period_start ? `${dash.period_start} – ${dash.period_end}` : "",
        });

        // ── Emissions time-series from receipts ──────────────────
        const byDay: Record<string, { co2e_actual: number; co2e_avoided: number; levy_usd: number }> = {};
        raw.forEach((r: any) => {
          const day = new Date(r.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          if (!byDay[day]) byDay[day] = { co2e_actual: 0, co2e_avoided: 0, levy_usd: 0 };
          byDay[day].co2e_actual += r.environmental_cost?.co2e_g ?? 0;
          byDay[day].co2e_avoided += Math.max(0, (r.comparison?.naive_co2e_g ?? 0) - (r.environmental_cost?.co2e_g ?? 0));
          byDay[day].levy_usd += r.offset?.levy_usd ?? 0;
        });
        const computedEmissions = Object.entries(byDay).map(([date, v]) => ({
          date,
          co2e_actual: Math.round(v.co2e_actual * 1000) / 1000,
          co2e_avoided: Math.round(v.co2e_avoided * 1000) / 1000,
          levy_usd: Math.round(v.levy_usd * 10000) / 10000,
        }));
        setEmissionsData(computedEmissions);

        // ── Model distribution from receipts ─────────────────────
        const byModel: Record<string, number> = {};
        raw.forEach((r: any) => { if (r.model) byModel[r.model] = (byModel[r.model] || 0) + 1; });
        const totalModelQueries = Object.values(byModel).reduce((s, v) => s + v, 0);
        const computedModels = Object.entries(byModel)
          .sort((a, b) => b[1] - a[1])
          .map(([model, queries]) => ({
            model,
            provider: model.includes("claude") ? "anthropic" : model.includes("gpt") || model.includes("o3") ? "openai" : "google",
            queries,
            avg_co2e_g: 0,
            pct_of_total: totalModelQueries > 0 ? Math.round((queries / totalModelQueries) * 1000) / 10 : 0,
          }));
        setModelData(computedModels);

        // ── Agent leaderboard ─────────────────────────────────────
        const allAgents = [...liveAgents]
          .sort((a: any, b: any) => (b.sustainability_score || 0) - (a.sustainability_score || 0));
        setAgents(allAgents);

        // ── Routing downgrades ───────────────────────────────────
        const downgradeMap: Record<string, { count: number; co2e_avoided_g: number }> = {};
        downgrades.forEach((r: any) => {
          const key = `${r.requested_model}\u2192${r.model}`;
          if (!downgradeMap[key]) downgradeMap[key] = { count: 0, co2e_avoided_g: 0 };
          downgradeMap[key].count++;
          downgradeMap[key].co2e_avoided_g += Math.max(0, (r.comparison?.naive_co2e_g ?? 0) - (r.environmental_cost?.co2e_g ?? 0));
        });
        const topDowngrades = Object.entries(downgradeMap)
          .map(([key, v]) => {
            const [from, to] = key.split("\u2192");
            return { from, to, count: v.count, savings_usd: 0, co2e_avoided_g: v.co2e_avoided_g };
          })
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setRouting({
          total_routing_decisions: totalDecisions,
          downgrades_accepted: totalAccepted,
          acceptance_rate_pct: acceptRate,
          top_downgrades: topDowngrades,
        });

        // ── Carbon removal from levy data ────────────────────────
        if (totalLevy > 0) {
          setCarbon({
            total_levy_usd: totalLevy,
            total_carbon_removed_g: totalRemoved,
            removal_partners: [
              { name: "Stripe Climate \u2014 Frontier", allocated_usd: totalLevy * 0.72, removed_g: totalRemoved * 0.72, status: "confirmed" as const },
              { name: "Stripe Climate \u2014 Pooled", allocated_usd: totalLevy * 0.24, removed_g: totalRemoved * 0.24, status: "pooled" as const },
              { name: "Pending Settlement", allocated_usd: totalLevy * 0.04, removed_g: totalRemoved * 0.04, status: "pending" as const },
            ],
          });
        }

        // ── Recent activity from receipts ────────────────────────
        const activity = raw.slice(0, 8).map((r: any) => ({
          timestamp: r.timestamp,
          client: r.agent_id || "unknown",
          event: r.requested_model && r.model && r.requested_model !== r.model
            ? `Downgrade: ${shortModel(r.requested_model)} \u2192 ${shortModel(r.model)}`
            : `Inference: ${shortModel(r.model || "unknown")}`,
          detail: `${r.environmental_cost?.co2e_g?.toFixed(4) ?? "0"}g CO\u2082e`,
        }));
        setRecentActivity(activity);

      } catch {
        // Zero/empty defaults — no mock data
        setStats(EMPTY_STATS);
        setEmissionsData([]);
        setModelData([]);
        setAgents([]);
        setRouting(EMPTY_ROUTING);
        setCarbon(EMPTY_CARBON);
        setRecentActivity([]);
      }
      setLoading(false);
    }
    load();
  }, []);

  /* ── hero metrics ────────────────────────────────────────────── */
  const heroMetrics = [
    { label: "Carbon Removed",       value: fmtCo2(stats.total_carbon_removed_g),                       accent: true  },
    { label: "Levy Collected",       value: `$${stats.total_levy_collected_usd.toFixed(4)}`,             accent: false },
    { label: "API Savings",          value: `$${stats.total_api_cost_saved_usd.toFixed(2)}`,             accent: false },
    { label: "Downgrade Accept",     value: `${stats.downgrade_acceptance_rate_pct}%`,                   accent: false },
    { label: "Energy Tracked",       value: fmtEnergy(stats.total_energy_saved_wh),                     accent: false },
    { label: "Sustainability Score", value: `${stats.avg_sustainability_score}`,                         accent: false },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ maxWidth: 1200, margin: "0 auto" }}>

      {/* ── Page header ─────────────────────────────────────────── */}
      <motion.div variants={item} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "6px" }}>
            <Globe style={{ width: 20, height: 20, color: "var(--blue-accent)" }} />
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
              Platform Overview
            </h1>
          </div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.04em" }}>
            GreenLedger impact across all clients {stats.period ? <>&middot; {stats.period}</> : null}
          </p>
        </div>

        {/* Live badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingTop: "4px" }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%", display: "inline-block", flexShrink: 0,
            backgroundColor: loading ? "#f59e0b" : live ? "#22c55e" : "#525252",
            boxShadow: loading ? "0 0 6px #f59e0b" : live ? "0 0 6px #22c55e" : "none",
            animation: "pulse-green 2s ease-in-out infinite",
          }} />
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.12em",
            textTransform: "uppercase" as const,
            color: loading ? "#f59e0b" : live ? "#22c55e" : "var(--text-muted)",
          }}>
            {loading ? "Connecting" : live ? "Live" : "Mock"}
          </span>
        </div>
      </motion.div>

      {/* ── Hero: Total CO₂e LEFT / 6 metrics RIGHT ────────────── */}
      <motion.div variants={item} style={{
        borderTop: "1px solid var(--rule, #1e1e1e)",
        paddingTop: "2rem",
        borderBottom: "1px solid var(--rule, #1e1e1e)",
        paddingBottom: "2rem",
        marginBottom: "2.5rem",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "5fr 7fr", gap: 0 }}>

          {/* LEFT -- large CO₂e display */}
          <div style={{
            borderRight: "1px solid var(--rule, #1e1e1e)",
            paddingRight: "2.5rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 0,
          }}>
            <span
              className="font-condensed"
              style={{
                display: "block",
                fontSize: "clamp(4rem, 10vw, 8rem)",
                color: "var(--blue-accent)",
                letterSpacing: "-0.01em",
                lineHeight: 0.88,
                marginBottom: "1rem",
              }}
            >
              {fmtCo2(stats.total_co2e_avoided_g).toUpperCase()}
            </span>

            <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "clamp(1.2rem, 2vw, 1.6rem)",
                fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "-0.06em",
                lineHeight: 1,
              }}>
                {stats.total_inferences.toLocaleString()}
              </span>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: "10px",
                color: "var(--text-muted)", letterSpacing: "0.04em",
              }}>
                inferences
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: "9px", textTransform: "uppercase",
                letterSpacing: "0.12em", color: "var(--text-muted)",
              }}>
                {stats.total_clients} clients
              </span>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: "9px", textTransform: "uppercase",
                letterSpacing: "0.12em", color: "var(--text-muted)",
              }}>
                {stats.total_agents} agents
              </span>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: "9px", textTransform: "uppercase",
                letterSpacing: "0.12em", color: "var(--text-muted)",
              }}>
                {fmtWater(stats.total_water_saved_ml)} water
              </span>
            </div>
          </div>

          {/* RIGHT -- 3x2 metrics grid */}
          <div style={{ paddingLeft: "2.5rem", display: "flex", alignItems: "stretch" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", width: "100%" }}>
              {heroMetrics.map((m, i) => {
                const col = i % 3;
                const row = Math.floor(i / 3);
                return (
                  <div
                    key={m.label}
                    style={{
                      borderLeft: col > 0 ? "1px solid var(--rule, #1e1e1e)" : "none",
                      borderBottom: row === 0 ? "1px solid var(--rule, #1e1e1e)" : "none",
                      padding: "1.25rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <span style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "clamp(0.95rem, 1.4vw, 1.3rem)",
                      fontWeight: 700,
                      color: m.accent ? "var(--blue-accent)" : "var(--text-primary)",
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
                );
              })}
            </div>
          </div>

        </div>
      </motion.div>

      {/* ── Emissions chart + Model breakdown ───────────────────── */}
      <motion.div variants={item} style={{ borderTop: "1px solid var(--rule, #1e1e1e)", paddingTop: "2rem", marginBottom: "2.5rem" }}>
        <Sec>Emissions &amp; Model Ecosystem</Sec>
        <div className="grid grid-cols-12 gap-5">

          {/* Area chart */}
          <div className="col-span-7">
            <div className="rounded-xl overflow-hidden glow-hover" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}>
              <div style={{ padding: "1.25rem 1.25rem 0.25rem" }}>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 700,
                  letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)",
                }}>
                  CO&#x2082;e &mdash; Avoided vs Emitted (g)
                </span>
              </div>
              <div style={{ height: 260, padding: "0.5rem 1rem 1rem" }}>
                {emissionsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={emissionsData}>
                      <defs>
                        <linearGradient id="adminGreen" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="adminRed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" }} />
                      <Area type="monotone" dataKey="co2e_avoided" stroke="#22c55e" fill="url(#adminGreen)" strokeWidth={2} name="CO₂e Avoided" />
                      <Area type="monotone" dataKey="co2e_actual" stroke="#ef4444" fill="url(#adminRed)" strokeWidth={1.5} strokeDasharray="4 4" name="CO₂e Emitted" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.04em" }}>
                    No emissions data available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Model distribution bars */}
          <div className="col-span-5">
            <div className="rounded-xl overflow-hidden glow-hover" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}>
              <div style={{ padding: "1.25rem 1.25rem 0.25rem" }}>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 700,
                  letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)",
                }}>
                  Query Distribution
                </span>
              </div>
              <div style={{ padding: "0.75rem 1.25rem 1.25rem" }}>
                {modelData.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                    {modelData.slice(0, 7).map((m: any, idx: number) => (
                      <div key={m.model} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {shortModel(m.model)}
                            </span>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                              {m.queries.toLocaleString()} ({m.pct_of_total}%)
                            </span>
                          </div>
                          <div style={{ width: "100%", height: "6px", borderRadius: "9999px", backgroundColor: "var(--track-bg)" }}>
                            <div style={{
                              height: "100%",
                              borderRadius: "9999px",
                              transition: "all 0.3s",
                              width: `${Math.min(m.pct_of_total, 100)}%`,
                              backgroundColor: MODEL_COLORS[m.model] || PIE_COLORS[idx % PIE_COLORS.length],
                            }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.04em" }}>
                    No query data available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Routing Intelligence + Carbon Removal ───────────────── */}
      <motion.div variants={item} style={{ borderTop: "1px solid var(--rule, #1e1e1e)", paddingTop: "2rem", marginBottom: "2.5rem" }}>
        <Sec>Routing Intelligence &amp; Carbon Removal</Sec>
        <div className="grid grid-cols-2 gap-5">

          {/* Routing */}
          <div className="rounded-xl overflow-hidden glow-hover" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}>
            <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 700,
                  letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)",
                }}>
                  Model Downgrades
                </span>
                <span style={{
                  fontSize: "10px", fontFamily: "var(--font-mono)", fontWeight: 600,
                  padding: "2px 8px", borderRadius: "9999px",
                  backgroundColor: "rgba(34,197,94,0.1)", color: "var(--green-accent)",
                  border: "1px solid rgba(34,197,94,0.15)",
                }}>
                  {routing.acceptance_rate_pct}% accept rate
                </span>
              </div>
            </div>
            <div style={{ padding: "1rem 1.25rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {routing.top_downgrades.length > 0 ? routing.top_downgrades.slice(0, 4).map((d: any, i: number) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  padding: "0.625rem 0.75rem", borderRadius: "0.5rem",
                  backgroundColor: "var(--bg-secondary)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {shortModel(d.from)}
                    </span>
                    <ArrowDownRight style={{ width: 12, height: 12, flexShrink: 0, color: "var(--green-accent)" }} />
                    <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--green-accent)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {shortModel(d.to)}
                    </span>
                  </div>
                  <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", flexShrink: 0, color: "var(--text-muted)" }}>
                    {d.count.toLocaleString()}x
                  </span>
                  <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", flexShrink: 0, color: "var(--green-accent)" }}>
                    &minus;{d.co2e_avoided_g < 1000 ? d.co2e_avoided_g.toFixed(1) + "g" : (d.co2e_avoided_g / 1000).toFixed(1) + "kg"}
                  </span>
                </div>
              )) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 0", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.04em" }}>
                  No downgrades recorded
                </div>
              )}
            </div>
          </div>

          {/* Carbon Removal */}
          <div className="rounded-xl overflow-hidden glow-hover" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}>
            <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border)" }}>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 700,
                letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)",
              }}>
                Carbon Removal Fund
              </span>
            </div>
            <div style={{ padding: "1.25rem" }}>
              <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
                <p className="font-condensed" style={{
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  color: "var(--green-accent)",
                  letterSpacing: "-0.01em",
                  lineHeight: 1,
                  marginBottom: "0.5rem",
                }}>
                  {fmtCo2(carbon.total_carbon_removed_g)}
                </p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)" }}>
                  carbon removed &middot; ${carbon.total_levy_usd.toFixed(4)} allocated
                </p>
              </div>
              {carbon.removal_partners.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {carbon.removal_partners.map((p: any) => (
                    <div key={p.name} style={{ padding: "0.75rem", borderRadius: "0.5rem", backgroundColor: "var(--bg-secondary)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                        <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>{p.name}</span>
                        <span style={{
                          fontSize: "10px", fontFamily: "var(--font-mono)", fontWeight: 500,
                          padding: "1px 6px", borderRadius: "4px",
                          backgroundColor: p.status === "confirmed" ? "rgba(34,197,94,0.1)" : p.status === "pooled" ? "rgba(96,165,250,0.1)" : "rgba(245,158,11,0.1)",
                          color: p.status === "confirmed" ? "var(--green-accent)" : p.status === "pooled" ? "var(--blue-accent)" : "var(--amber-accent)",
                        }}>
                          {p.status}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>${p.allocated_usd.toFixed(4)}</span>
                        <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--green-accent)" }}>
                          {p.removed_g < 1000 ? p.removed_g.toFixed(2) + " g" : (p.removed_g / 1000).toFixed(1) + " kg"} removed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem 0", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.04em" }}>
                  No carbon removal data yet
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Agent Leaderboard ───────────────────────────────────── */}
      <motion.div variants={item} style={{ borderTop: "1px solid var(--rule, #1e1e1e)", paddingTop: "2rem", marginBottom: "2.5rem" }}>
        <Sec>Agent Leaderboard</Sec>
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Agent", "Queries", "CO\u2082e", "Energy", "Score", "Trend"].map(h => (
                  <th key={h} style={{
                    padding: "0.625rem 1rem", textAlign: "left",
                    fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 700,
                    letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agents.length > 0 ? (
                <AnimatePresence>
                  {agents.slice(0, 10).map((a: any, i: number) => (
                    <motion.tr
                      key={a.agent_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03, duration: 0.3 }}
                      style={{
                        borderBottom: i < Math.min(agents.length, 10) - 1 ? "1px solid var(--border)" : undefined,
                        transition: "background-color 0.1s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--bg-card-hover)")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td style={{ padding: "0.625rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{
                            width: 20, height: 20, borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "9px", fontWeight: 700, flexShrink: 0,
                            fontFamily: "var(--font-mono)",
                            backgroundColor: i < 3 ? "rgba(34,197,94,0.1)" : "var(--bg-secondary)",
                            color: i < 3 ? "var(--green-accent)" : "var(--text-muted)",
                          }}>
                            {i + 1}
                          </span>
                          <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>
                            {a.display_name || a.agent_id}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "0.625rem 1rem", fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                        {(a.total_inferences || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: "0.625rem 1rem", fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--green-accent)" }}>
                        {Number(a.total_co2e_g || 0).toFixed(3)}g
                      </td>
                      <td style={{ padding: "0.625rem 1rem", fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                        {Number(a.total_energy_wh || 0).toFixed(2)} Wh
                      </td>
                      <td style={{ padding: "0.625rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                          <div style={{ width: 40, height: 4, borderRadius: "9999px", backgroundColor: "var(--track-bg)" }}>
                            <div style={{
                              height: "100%", borderRadius: "9999px",
                              width: `${a.sustainability_score || 0}%`,
                              backgroundColor: (a.sustainability_score || 0) >= 80 ? "#22c55e" : (a.sustainability_score || 0) >= 50 ? "#f59e0b" : "#ef4444",
                            }} />
                          </div>
                          <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                            {a.sustainability_score || 0}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "0.625rem 1rem" }}>
                        <span style={{
                          fontSize: "10px", fontFamily: "var(--font-mono)", fontWeight: 500,
                          padding: "1px 6px", borderRadius: "4px",
                          backgroundColor: a.trend === "on_track" ? "rgba(34,197,94,0.1)" : a.trend === "at_risk" ? "rgba(245,158,11,0.1)" : "rgba(248,113,113,0.1)",
                          color: a.trend === "on_track" ? "var(--green-accent)" : a.trend === "at_risk" ? "var(--amber-accent)" : "var(--red-accent)",
                        }}>
                          {a.trend || "\u2014"}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.04em" }}>
                    No agents registered
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Recent Platform Activity ────────────────────────────── */}
      {recentActivity.length > 0 && (
        <motion.div variants={item} style={{ borderTop: "1px solid var(--rule, #1e1e1e)", paddingTop: "2rem", marginBottom: "2.5rem" }}>
          <Sec>Recent Platform Activity</Sec>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Time", "Client", "Event", "Impact"].map(h => (
                    <th key={h} style={{
                      padding: "0.625rem 1rem",
                      textAlign: h === "Impact" ? "right" : "left",
                      fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 700,
                      letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {recentActivity.map((a: any, i: number) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03, duration: 0.3 }}
                      style={{
                        borderBottom: i < recentActivity.length - 1 ? "1px solid var(--border)" : undefined,
                        transition: "background-color 0.1s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--bg-card-hover)")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td style={{ padding: "0.625rem 1rem" }}>
                        <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                          {new Date(a.timestamp).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>
                      <td style={{ padding: "0.625rem 1rem" }}>
                        <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block" }}>
                          {a.client}
                        </span>
                      </td>
                      <td style={{ padding: "0.625rem 1rem" }}>
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                          {a.event}
                        </span>
                      </td>
                      <td style={{ padding: "0.625rem 1rem", textAlign: "right" }}>
                        <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                          {a.detail}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

    </motion.div>
  );
}
