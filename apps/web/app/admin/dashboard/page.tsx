"use client";

import {
  Globe,
  Users,
  Bot,
  Zap,
  TreePine,
  TrendingUp,
  ArrowDownRight,
  DollarSign,
  Activity,
  Award,
} from "lucide-react";
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
  Cell,
} from "recharts";
import {
  platformStats,
  platformGrowth,
  platformEmissions,
  topOrgs,
  modelEcosystem,
  routingIntelligence,
  carbonRemoval,
  recentPlatformActivity,
} from "@/lib/admin-mock-data";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  delay,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
  delay: string;
}) {
  return (
    <div
      className={`card p-5 glow-hover fade-up-${delay}`}
      style={{ borderTop: `2px solid ${color}20` }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="label">{label}</span>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}10`, border: `1px solid ${color}18` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
      </div>
      <p
        className="text-2xl font-black data-flicker"
        style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

const MODEL_COLORS: Record<string, string> = {
  "claude-haiku-4-5": "#22c55e",
  "gpt-4.1-nano": "#a855f7",
  "claude-sonnet-4-6": "#3b82f6",
  "gemini-3.1-flash": "#f59e0b",
  "gpt-4.1-mini": "#ec4899",
  "claude-opus-4-6": "#ef4444",
  "o3-mini": "#06b6d4",
};

function shortModel(m: string) {
  return m.replace("claude-", "").replace("gpt-", "").replace("gemini-", "");
}

export default function AdminDashboardPage() {
  return (
    <div className="max-w-[1200px] mx-auto space-y-8">
      {/* Header */}
      <div className="fade-up">
        <div className="flex items-center gap-3 mb-1">
          <Globe className="w-5 h-5" style={{ color: "var(--blue-accent)" }} />
          <h1
            className="text-xl font-black"
            style={{ letterSpacing: "-0.03em", color: "var(--text-primary)" }}
          >
            Platform Overview
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          GreenLedger impact across all organizations &middot; {platformStats.period}
        </p>
      </div>

      {/* Hero stats — 2 rows of 4 */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total CO₂e Avoided"
          value={`${(platformStats.total_co2e_avoided_g / 1000).toFixed(1)} kg`}
          sub={`${platformStats.total_inferences.toLocaleString()} inferences`}
          icon={TreePine}
          color="#22c55e"
          delay="1"
        />
        <StatCard
          label="Carbon Removed"
          value={`${(platformStats.total_carbon_removed_g / 1000).toFixed(1)} kg`}
          sub="via Stripe Climate"
          icon={Award}
          color="#22c55e"
          delay="2"
        />
        <StatCard
          label="API Cost Saved"
          value={`$${platformStats.total_api_cost_saved_usd.toFixed(2)}`}
          sub={`$${platformStats.total_levy_collected_usd.toFixed(2)} levy collected`}
          icon={DollarSign}
          color="#f59e0b"
          delay="3"
        />
        <StatCard
          label="Downgrade Acceptance"
          value={`${platformStats.downgrade_acceptance_rate_pct}%`}
          sub={`${platformStats.avg_sustainability_score} avg score`}
          icon={TrendingUp}
          color="#3b82f6"
          delay="4"
        />
        <StatCard
          label="Organizations"
          value={platformStats.total_orgs.toString()}
          sub="active this period"
          icon={Users}
          color="#a855f7"
          delay="1"
        />
        <StatCard
          label="AI Agents"
          value={platformStats.total_agents.toString()}
          sub="registered"
          icon={Bot}
          color="#ec4899"
          delay="2"
        />
        <StatCard
          label="Energy Saved"
          value={`${(platformStats.total_energy_saved_wh / 1000).toFixed(1)} kWh`}
          sub={`${(platformStats.total_water_saved_ml / 1000).toFixed(1)} L water`}
          icon={Zap}
          color="#06b6d4"
          delay="3"
        />
        <StatCard
          label="Total Queries"
          value={(platformStats.total_inferences / 1000).toFixed(0) + "k"}
          sub="routed through GreenLedger"
          icon={Activity}
          color="#60a5fa"
          delay="4"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Environmental Impact Over Time */}
        <div className="card p-5 fade-up-1">
          <span className="label">CO₂e Avoided vs Actual (g) — March</span>
          <div className="mt-4" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={platformEmissions}>
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
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--text-primary)",
                  }}
                />
                <Area type="monotone" dataKey="co2e_avoided" stroke="#22c55e" fill="url(#adminGreen)" strokeWidth={2} name="CO₂e Avoided" />
                <Area type="monotone" dataKey="co2e_actual" stroke="#ef4444" fill="url(#adminRed)" strokeWidth={1.5} strokeDasharray="4 4" name="CO₂e Emitted" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Growth */}
        <div className="card p-5 fade-up-2">
          <span className="label">Platform Growth — Orgs &amp; Agents</span>
          <div className="mt-4" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" tick={{ fill: "var(--text-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
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
                <Bar dataKey="orgs" fill="#a855f7" radius={[4, 4, 0, 0]} name="Orgs" />
                <Bar dataKey="agents" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Agents" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Model Ecosystem + Routing Intelligence */}
      <div className="grid grid-cols-2 gap-4">
        {/* Model Distribution */}
        <div className="card p-5 fade-up-1">
          <span className="label">Model Ecosystem — Query Distribution</span>
          <div className="mt-4 space-y-2.5">
            {modelEcosystem.map((m) => (
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
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${m.pct_of_total}%`,
                        backgroundColor: MODEL_COLORS[m.model] || "#888",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Routing Intelligence */}
        <div className="card p-5 fade-up-2">
          <div className="flex items-center justify-between mb-4">
            <span className="label">Routing Intelligence</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: "rgba(34,197,94,0.1)",
                color: "var(--green-accent)",
                border: "1px solid rgba(34,197,94,0.15)",
              }}
            >
              {routingIntelligence.acceptance_rate_pct}% accept rate
            </span>
          </div>
          <div className="space-y-2">
            {routingIntelligence.top_downgrades.slice(0, 4).map((d, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2.5 rounded-lg"
                style={{ backgroundColor: "var(--bg-secondary)" }}
              >
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-xs font-mono truncate" style={{ color: "var(--text-secondary)" }}>
                    {shortModel(d.from)}
                  </span>
                  <ArrowDownRight className="w-3 h-3 shrink-0" style={{ color: "var(--green-accent)" }} />
                  <span className="text-xs font-mono truncate" style={{ color: "var(--green-accent)" }}>
                    {shortModel(d.to)}
                  </span>
                </div>
                <span className="text-[10px] font-mono shrink-0" style={{ color: "var(--text-muted)" }}>
                  {d.count.toLocaleString()}x
                </span>
                <span className="text-[10px] font-mono shrink-0" style={{ color: "var(--green-accent)" }}>
                  −{(d.co2e_avoided_g / 1000).toFixed(1)}kg
                </span>
              </div>
            ))}
          </div>
          {/* Rejection reasons */}
          <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
            <span className="label">Rejection Reasons</span>
            <div className="flex gap-3 mt-2">
              {routingIntelligence.rejection_reasons.map((r) => (
                <div key={r.reason} className="flex-1 text-center">
                  <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{r.pct}%</p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{r.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Org Leaderboard + Carbon Removal */}
      <div className="grid grid-cols-5 gap-4">
        {/* Leaderboard — 3 columns wide */}
        <div className="col-span-3 card p-5 fade-up-1">
          <span className="label">Organization Leaderboard — Top Performers</span>
          <div className="mt-4">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Org", "Agents", "Queries", "CO₂e Avoided", "Score", "Levy"].map((h) => (
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
                {topOrgs.map((org, i) => (
                  <tr
                    key={org.name}
                    className="transition-colors"
                    style={{ borderBottom: i < topOrgs.length - 1 ? "1px solid var(--border)" : undefined }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--hover-bg)")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                          style={{
                            backgroundColor: i < 3 ? "rgba(34,197,94,0.1)" : "var(--bg-secondary)",
                            color: i < 3 ? "var(--green-accent)" : "var(--text-muted)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {i + 1}
                        </span>
                        <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                          {org.name}
                        </span>
                      </div>
                    </td>
                    <td className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{org.agents}</td>
                    <td className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{org.inferences.toLocaleString()}</td>
                    <td className="text-xs font-mono" style={{ color: "var(--green-accent)" }}>{(org.co2e_avoided_g / 1000).toFixed(1)} kg</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--track-bg)" }}>
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

        {/* Carbon Removal — 2 columns wide */}
        <div className="col-span-2 card p-5 fade-up-2">
          <span className="label">Carbon Removal Fund</span>
          <div className="mt-4 text-center mb-4">
            <p className="text-3xl font-black" style={{ color: "var(--green-accent)", letterSpacing: "-0.03em" }}>
              {(carbonRemoval.total_carbon_removed_g / 1000).toFixed(1)} kg
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              carbon removed &middot; ${carbonRemoval.total_levy_usd.toFixed(2)} allocated
            </p>
          </div>

          <div className="space-y-2.5">
            {carbonRemoval.removal_partners.map((p) => (
              <div
                key={p.name}
                className="p-3 rounded-lg"
                style={{ backgroundColor: "var(--bg-secondary)" }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                    {p.name}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                    style={{
                      backgroundColor:
                        p.status === "confirmed" ? "rgba(34,197,94,0.1)" :
                        p.status === "pooled" ? "rgba(96,165,250,0.1)" :
                        "rgba(245,158,11,0.1)",
                      color:
                        p.status === "confirmed" ? "var(--green-accent)" :
                        p.status === "pooled" ? "var(--blue-accent)" :
                        "var(--amber-accent)",
                    }}
                  >
                    {p.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                    ${p.allocated_usd.toFixed(2)}
                  </span>
                  <span className="text-[10px] font-mono" style={{ color: "var(--green-accent)" }}>
                    {(p.removed_g / 1000).toFixed(1)} kg removed
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Monthly trend */}
          <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
            <span className="label">Monthly Levy Growth</span>
            <div className="mt-3" style={{ height: 80 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={carbonRemoval.monthly_trend}>
                  <XAxis dataKey="month" tick={{ fill: "var(--text-muted)", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 11,
                      color: "var(--text-primary)",
                    }}
                  />
                  <Bar dataKey="levy_usd" fill="#22c55e" radius={[3, 3, 0, 0]} name="Levy ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-5 fade-up-3">
        <span className="label">Recent Platform Activity</span>
        <div className="mt-4 space-y-0">
          {recentPlatformActivity.map((a, i) => (
            <div
              key={i}
              className="flex items-center gap-4 py-2.5 transition-colors"
              style={{ borderBottom: i < recentPlatformActivity.length - 1 ? "1px solid var(--border)" : undefined }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--hover-bg)")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <span className="text-[10px] font-mono shrink-0 w-14" style={{ color: "var(--text-muted)" }}>
                {new Date(a.timestamp).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="text-xs font-medium w-28 truncate" style={{ color: "var(--text-primary)" }}>
                {a.org}
              </span>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {a.event}
              </span>
              <span className="text-xs font-mono ml-auto" style={{ color: "var(--text-muted)" }}>
                {a.detail}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
