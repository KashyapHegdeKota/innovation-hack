"use client";

import { useEffect, useState } from "react";
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
import { DUMMY_AGENTS } from "@/lib/dummy-agents";
import {
  platformStats as mockStats,
  platformEmissions as mockEmissions,
  platformGrowth as mockGrowth,
  topClients as mockClients,
  modelEcosystem as mockModels,
  routingIntelligence as mockRouting,
  carbonRemoval as mockCarbon,
  recentPlatformActivity as mockActivity,
} from "@/lib/admin-mock-data";

/* ── dummy aggregates ───────────────────────��──────────────────── */
const DUMMY_TOTAL_INF = DUMMY_AGENTS.reduce((s, a) => s + a.total_inferences, 0);
const DUMMY_TOTAL_CO2E = DUMMY_AGENTS.reduce((s, a) => s + a.total_co2e_g, 0);
const DUMMY_TOTAL_ENERGY = DUMMY_AGENTS.reduce((s, a) => s + a.total_energy_wh, 0);

/* ── helpers ───────────────────────��───────────────────────────── */
function shortModel(m: string) {
  return m.replace("claude-", "").replace("gpt-", "").replace("gemini-", "");
}

const MODEL_COLORS: Record<string, string> = {
  "claude-haiku-4-5": "#22c55e", "gpt-4.1-nano": "#a855f7",
  "claude-sonnet-4-6": "#3b82f6", "gemini-3.1-flash": "#f59e0b",
  "gpt-4.1-mini": "#ec4899", "claude-opus-4-6": "#ef4444", "o3-mini": "#06b6d4",
};
const PIE_COLORS = ["#22c55e", "#60a5fa", "#a855f7", "#f59e0b", "#f87171", "#ec4899", "#06b6d4"];

function StatCard({ label, value, sub, icon: Icon, color, delay }: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string; delay: string;
}) {
  return (
    <div className={`card p-5 glow-hover fade-up-${delay}`} style={{ borderTop: `2px solid ${color}20` }}>
      <div className="flex items-start justify-between mb-3">
        <span className="label">{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}10`, border: `1px solid ${color}18` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-black data-flicker" style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
        {value}
      </p>
      {sub && <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{sub}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);

  // Core stats
  const [stats, setStats] = useState(mockStats);
  // Emissions time-series
  const [emissionsData, setEmissionsData] = useState(mockEmissions);
  // Model distribution
  const [modelData, setModelData] = useState(mockModels);
  // Agent leaderboard
  const [agents, setAgents] = useState<any[]>([]);
  // Routing
  const [routing, setRouting] = useState(mockRouting);
  // Carbon removal
  const [carbon, setCarbon] = useState(mockCarbon);
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

        // ── Stats ───────────────────────────��────────────────────
        const totalInf = (dash.total_inferences || 0) + DUMMY_TOTAL_INF;
        const totalCo2e = (dash.total_co2e_g || 0) + DUMMY_TOTAL_CO2E;
        const totalEnergy = (dash.total_energy_wh || 0) + DUMMY_TOTAL_ENERGY;
        const totalLevy = dash.total_levy_usd || 0;
        const totalRemoved = dash.total_carbon_removed_g || 0;
        const activeAgents = (dash.active_agents || 0) + DUMMY_AGENTS.length;
        const avgSavings = dash.avg_savings_vs_naive_pct || 0;
        const score = dash.sustainability_score || 0;

        // Compute routing stats from receipts
        const downgrades = raw.filter((r: any) => r.requested_model && r.model && r.requested_model !== r.model);
        const dummyDowngrades = DUMMY_AGENTS.flatMap(a => a.decisions.filter(d => !d.accepted_recommendation || d.assessment === "overkill"));
        const totalDecisions = raw.length + DUMMY_AGENTS.reduce((s, a) => s + a.decisions.length, 0);
        const totalAccepted = downgrades.length + DUMMY_AGENTS.flatMap(a => a.decisions.filter(d => d.accepted_recommendation)).length;
        const acceptRate = totalDecisions > 0 ? Math.round((totalAccepted / totalDecisions) * 100) : mockRouting.acceptance_rate_pct;

        // Unique clients = unique agent_ids from receipts + dummy agents
        const liveClientIds = new Set(raw.map((r: any) => r.agent_id).filter(Boolean));
        DUMMY_AGENTS.forEach(a => liveClientIds.add(a.agent_id));
        const totalClients = liveClientIds.size;

        setStats({
          total_clients: totalClients,
          total_agents: activeAgents,
          total_inferences: totalInf,
          total_co2e_avoided_g: totalCo2e,
          total_energy_saved_wh: totalEnergy,
          total_water_saved_ml: dash.total_water_ml || mockStats.total_water_saved_ml,
          total_levy_collected_usd: totalLevy,
          total_carbon_removed_g: totalRemoved,
          total_api_cost_saved_usd: levy?.total_savings_usd || mockStats.total_api_cost_saved_usd,
          avg_sustainability_score: score,
          downgrade_acceptance_rate_pct: acceptRate,
          period: dash.period_start ? `${dash.period_start} – ${dash.period_end}` : mockStats.period,
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
        // Merge dummy emissions
        DUMMY_AGENTS.forEach(agent => {
          agent.emissions.forEach(day => {
            if (!byDay[day.date]) byDay[day.date] = { co2e_actual: 0, co2e_avoided: 0, levy_usd: 0 };
            byDay[day.date].co2e_actual += day.co2e;
          });
        });
        const computedEmissions = Object.entries(byDay).map(([date, v]) => ({
          date,
          co2e_actual: Math.round(v.co2e_actual * 1000) / 1000,
          co2e_avoided: Math.round(v.co2e_avoided * 1000) / 1000,
          levy_usd: Math.round(v.levy_usd * 10000) / 10000,
        }));
        if (computedEmissions.length > 0) setEmissionsData(computedEmissions as any);

        // ── Model distribution from receipts ─────────────────────
        const byModel: Record<string, number> = {};
        raw.forEach((r: any) => { if (r.model) byModel[r.model] = (byModel[r.model] || 0) + 1; });
        DUMMY_AGENTS.forEach(a => a.receipts.forEach(r => { byModel[r.model] = (byModel[r.model] || 0) + 1; }));
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
        if (computedModels.length > 0) setModelData(computedModels);

        // ── Agent leaderboard ──────────────────��─────────────────
        const allAgents = [
          ...liveAgents,
          ...DUMMY_AGENTS.map(a => ({
            agent_id: a.agent_id,
            display_name: a.display_name,
            total_inferences: a.total_inferences,
            total_co2e_g: a.total_co2e_g,
            total_energy_wh: a.total_energy_wh,
            wallet_utilization_pct: a.wallet_utilization_pct,
            sustainability_score: a.sustainability_score,
            trend: a.trend,
          })),
        ].sort((a: any, b: any) => (b.sustainability_score || 0) - (a.sustainability_score || 0));
        setAgents(allAgents);

        // ── Routing downgrades ───────────────────────────────────
        const downgradeMap: Record<string, { count: number; co2e_avoided_g: number }> = {};
        downgrades.forEach((r: any) => {
          const key = `${r.requested_model}→${r.model}`;
          if (!downgradeMap[key]) downgradeMap[key] = { count: 0, co2e_avoided_g: 0 };
          downgradeMap[key].count++;
          downgradeMap[key].co2e_avoided_g += Math.max(0, (r.comparison?.naive_co2e_g ?? 0) - (r.environmental_cost?.co2e_g ?? 0));
        });
        const topDowngrades = Object.entries(downgradeMap)
          .map(([key, v]) => {
            const [from, to] = key.split("→");
            return { from, to, count: v.count, savings_usd: 0, co2e_avoided_g: v.co2e_avoided_g };
          })
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        if (topDowngrades.length > 0) {
          setRouting({
            ...mockRouting,
            total_routing_decisions: totalDecisions,
            downgrades_accepted: totalAccepted,
            acceptance_rate_pct: acceptRate,
            top_downgrades: topDowngrades.length >= 2 ? topDowngrades : mockRouting.top_downgrades,
          });
        }

        // ── Carbon removal from levy data ────────────────────────
        if (totalLevy > 0) {
          setCarbon({
            total_levy_usd: totalLevy,
            total_carbon_removed_g: totalRemoved,
            removal_partners: [
              { name: "Stripe Climate — Frontier", allocated_usd: totalLevy * 0.72, removed_g: totalRemoved * 0.72, status: "confirmed" as const },
              { name: "Stripe Climate — Pooled", allocated_usd: totalLevy * 0.24, removed_g: totalRemoved * 0.24, status: "pooled" as const },
              { name: "Pending Settlement", allocated_usd: totalLevy * 0.04, removed_g: totalRemoved * 0.04, status: "pending" as const },
            ],
            monthly_trend: mockCarbon.monthly_trend,
          });
        }

        // ── Recent activity from receipts ────────────────────────
        const activity = raw.slice(0, 8).map((r: any) => ({
          timestamp: r.timestamp,
          client: r.agent_id || "unknown",
          event: r.requested_model && r.model && r.requested_model !== r.model
            ? `Downgrade: ${shortModel(r.requested_model)} → ${shortModel(r.model)}`
            : `Inference: ${shortModel(r.model || "unknown")}`,
          detail: `${r.environmental_cost?.co2e_g?.toFixed(4) ?? "0"}g CO₂e`,
        }));
        if (activity.length > 0) setRecentActivity(activity);
        else setRecentActivity(mockActivity as any);

      } catch {
        // All mock data already set as defaults
        setAgents(mockClients.map(c => ({
          agent_id: c.user_id, display_name: c.user_id, total_inferences: c.inferences,
          total_co2e_g: c.co2e_g, sustainability_score: c.score, trend: "on_track",
          total_energy_wh: 0, wallet_utilization_pct: null,
        })));
        setRecentActivity(mockActivity as any);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="max-w-[1200px] mx-auto space-y-8">
      {/* Header */}
      <div className="fade-up">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Globe className="w-5 h-5" style={{ color: "var(--blue-accent)" }} />
              <h1 className="text-xl font-black" style={{ letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
                Platform Overview
              </h1>
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              GreenLedger impact across all clients &middot; {stats.period}
            </p>
          </div>
          {/* Live badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%", display: "inline-block",
              backgroundColor: loading ? "#f59e0b" : live ? "#22c55e" : "#525252",
              boxShadow: loading ? "0 0 6px #f59e0b" : live ? "0 0 6px #22c55e" : "none",
              animation: "pulse-green 2s ease-in-out infinite",
            }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase" as const, color: loading ? "#f59e0b" : live ? "#22c55e" : "var(--text-muted)" }}>
              {loading ? "Connecting" : live ? "Live" : "Mock"}
            </span>
          </div>
        </div>
      </div>

      {/* Hero stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total CO₂e Tracked" value={`${stats.total_co2e_avoided_g < 1000 ? stats.total_co2e_avoided_g.toFixed(2) + " g" : (stats.total_co2e_avoided_g / 1000).toFixed(1) + " kg"}`}
          sub={`${stats.total_inferences.toLocaleString()} inferences`} icon={TreePine} color="#22c55e" delay="1" />
        <StatCard label="Carbon Removed" value={`${stats.total_carbon_removed_g < 1000 ? stats.total_carbon_removed_g.toFixed(2) + " g" : (stats.total_carbon_removed_g / 1000).toFixed(1) + " kg"}`}
          sub="via Stripe Climate" icon={Award} color="#22c55e" delay="2" />
        <StatCard label="Levy Collected" value={`$${stats.total_levy_collected_usd.toFixed(4)}`}
          sub={`$${stats.total_api_cost_saved_usd.toFixed(2)} API savings`} icon={DollarSign} color="#f59e0b" delay="3" />
        <StatCard label="Downgrade Acceptance" value={`${stats.downgrade_acceptance_rate_pct}%`}
          sub={`${stats.avg_sustainability_score} avg score`} icon={TrendingUp} color="#3b82f6" delay="4" />
        <StatCard label="Clients" value={stats.total_clients.toString()} sub="unique user IDs" icon={Users} color="#a855f7" delay="1" />
        <StatCard label="AI Agents" value={stats.total_agents.toString()} sub="registered" icon={Bot} color="#ec4899" delay="2" />
        <StatCard label="Energy Used" value={`${stats.total_energy_saved_wh < 1000 ? stats.total_energy_saved_wh.toFixed(2) + " Wh" : (stats.total_energy_saved_wh / 1000).toFixed(1) + " kWh"}`}
          sub={`${stats.total_water_saved_ml < 1000 ? stats.total_water_saved_ml.toFixed(1) + " mL" : (stats.total_water_saved_ml / 1000).toFixed(1) + " L"} water`} icon={Zap} color="#06b6d4" delay="3" />
        <StatCard label="Total Queries" value={stats.total_inferences >= 1000 ? (stats.total_inferences / 1000).toFixed(0) + "k" : stats.total_inferences.toString()}
          sub="routed through GreenLedger" icon={Activity} color="#60a5fa" delay="4" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5 fade-up-1">
          <span className="label">CO₂e — Avoided vs Emitted (g)</span>
          <div className="mt-4" style={{ height: 220 }}>
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
          </div>
        </div>

        <div className="card p-5 fade-up-2">
          <span className="label">Model Ecosystem — Query Distribution</span>
          <div className="mt-4 space-y-2.5">
            {modelData.slice(0, 7).map((m: any) => (
              <div key={m.model} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {shortModel(m.model)}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                      {m.queries.toLocaleString()} ({m.pct_of_total}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: "var(--track-bg)" }}>
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${Math.min(m.pct_of_total, 100)}%`,
                      backgroundColor: MODEL_COLORS[m.model] || PIE_COLORS[modelData.indexOf(m) % PIE_COLORS.length],
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Routing Intelligence + Agent Leaderboard */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5 fade-up-1">
          <div className="flex items-center justify-between mb-4">
            <span className="label">Routing Intelligence</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
              backgroundColor: "rgba(34,197,94,0.1)", color: "var(--green-accent)", border: "1px solid rgba(34,197,94,0.15)",
            }}>
              {routing.acceptance_rate_pct}% accept rate
            </span>
          </div>
          <div className="space-y-2">
            {routing.top_downgrades.slice(0, 4).map((d: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ backgroundColor: "var(--bg-secondary)" }}>
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-xs font-mono truncate" style={{ color: "var(--text-secondary)" }}>{shortModel(d.from)}</span>
                  <ArrowDownRight className="w-3 h-3 shrink-0" style={{ color: "var(--green-accent)" }} />
                  <span className="text-xs font-mono truncate" style={{ color: "var(--green-accent)" }}>{shortModel(d.to)}</span>
                </div>
                <span className="text-[10px] font-mono shrink-0" style={{ color: "var(--text-muted)" }}>{d.count.toLocaleString()}x</span>
                <span className="text-[10px] font-mono shrink-0" style={{ color: "var(--green-accent)" }}>
                  −{d.co2e_avoided_g < 1000 ? d.co2e_avoided_g.toFixed(1) + "g" : (d.co2e_avoided_g / 1000).toFixed(1) + "kg"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Carbon Removal */}
        <div className="card p-5 fade-up-2">
          <span className="label">Carbon Removal Fund</span>
          <div className="mt-4 text-center mb-4">
            <p className="text-3xl font-black" style={{ color: "var(--green-accent)", letterSpacing: "-0.03em" }}>
              {carbon.total_carbon_removed_g < 1000
                ? carbon.total_carbon_removed_g.toFixed(2) + " g"
                : (carbon.total_carbon_removed_g / 1000).toFixed(1) + " kg"}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              carbon removed &middot; ${carbon.total_levy_usd.toFixed(4)} allocated
            </p>
          </div>
          <div className="space-y-2.5">
            {carbon.removal_partners.map((p: any) => (
              <div key={p.name} className="p-3 rounded-lg" style={{ backgroundColor: "var(--bg-secondary)" }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{p.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{
                    backgroundColor: p.status === "confirmed" ? "rgba(34,197,94,0.1)" : p.status === "pooled" ? "rgba(96,165,250,0.1)" : "rgba(245,158,11,0.1)",
                    color: p.status === "confirmed" ? "var(--green-accent)" : p.status === "pooled" ? "var(--blue-accent)" : "var(--amber-accent)",
                  }}>
                    {p.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>${p.allocated_usd.toFixed(4)}</span>
                  <span className="text-[10px] font-mono" style={{ color: "var(--green-accent)" }}>
                    {p.removed_g < 1000 ? p.removed_g.toFixed(2) + " g" : (p.removed_g / 1000).toFixed(1) + " kg"} removed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Leaderboard */}
      <div className="card p-5 fade-up-1">
        <span className="label">Agent Leaderboard — Top Performers</span>
        <div className="mt-4">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Agent", "Queries", "CO₂e", "Energy", "Score", "Trend"].map(h => (
                  <th key={h} className="pb-2 text-left text-[10px] font-mono uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agents.slice(0, 10).map((a: any, i: number) => (
                <tr key={a.agent_id} className="transition-colors"
                  style={{ borderBottom: i < Math.min(agents.length, 10) - 1 ? "1px solid var(--border)" : undefined }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--hover-bg)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{
                        backgroundColor: i < 3 ? "rgba(34,197,94,0.1)" : "var(--bg-secondary)",
                        color: i < 3 ? "var(--green-accent)" : "var(--text-muted)", fontFamily: "var(--font-mono)",
                      }}>{i + 1}</span>
                      <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{a.display_name || a.agent_id}</span>
                    </div>
                  </td>
                  <td className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{(a.total_inferences || 0).toLocaleString()}</td>
                  <td className="text-xs font-mono" style={{ color: "var(--green-accent)" }}>{Number(a.total_co2e_g || 0).toFixed(3)}g</td>
                  <td className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{Number(a.total_energy_wh || 0).toFixed(2)} Wh</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--track-bg)" }}>
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
                    }}>
                      {a.trend || "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-5 fade-up-3">
        <span className="label">Recent Platform Activity</span>
        <div className="mt-4 space-y-0">
          {recentActivity.map((a: any, i: number) => (
            <div key={i} className="flex items-center gap-4 py-2.5 transition-colors"
              style={{ borderBottom: i < recentActivity.length - 1 ? "1px solid var(--border)" : undefined }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--hover-bg)")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
              <span className="text-[10px] font-mono shrink-0 w-14" style={{ color: "var(--text-muted)" }}>
                {new Date(a.timestamp).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="text-xs font-medium w-28 truncate" style={{ color: "var(--text-primary)" }}>{a.client}</span>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{a.event}</span>
              <span className="text-xs font-mono ml-auto" style={{ color: "var(--text-muted)" }}>{a.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
