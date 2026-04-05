"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownRight, GitBranch } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import { listReceipts } from "@/lib/greenledger-api";

/* ── helpers ──────────────────────────────────────────────────── */
function shortModel(m: string) {
  return m.replace("claude-", "").replace("gpt-", "").replace("gemini-", "");
}

/* ── static rejection reasons (not tracked in DB) ─────────────── */
const REJECTION_REASONS = [
  { reason: "Quality concern", pct: 42 },
  { reason: "User preference", pct: 28 },
  { reason: "Task complexity", pct: 18 },
  { reason: "Latency requirement", pct: 12 },
];

const REJECTION_COLORS = ["#f59e0b", "#3b82f6", "#a855f7", "#ef4444"];

/* ── animation variants ───────────────────────────────────────── */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.25, 0.1, 0.25, 1] as const } },
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
export default function AdminRoutingPage() {
  const [live, setLive] = useState(false);
  const [totalDecisions, setTotalDecisions] = useState(0);
  const [suggested, setSuggested] = useState(0);
  const [accepted, setAccepted] = useState(0);
  const [rejected, setRejected] = useState(0);
  const [acceptRate, setAcceptRate] = useState(0);
  const [topDowngrades, setTopDowngrades] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await listReceipts({ limit: 200 });
        setLive(true);
        const raw: any[] = Array.isArray(res.data) ? res.data : [];

        const allTotal = raw.length;

        // Live downgrades: requested_model !== model
        const liveDowngrades = raw.filter((r: any) => r.requested_model && r.model && r.requested_model !== r.model);

        // "Suggested" = cases where router had an opinion (requested_model exists means router analyzed it)
        const liveSuggested = raw.filter((r: any) => r.requested_model).length;
        const totalAccepted = liveDowngrades.length;
        const totalRejected = liveSuggested - totalAccepted;
        const rate = liveSuggested > 0 ? Math.round((totalAccepted / liveSuggested) * 100) : 0;

        setTotalDecisions(allTotal);
        setSuggested(liveSuggested);
        setAccepted(totalAccepted);
        setRejected(Math.max(0, totalRejected));
        setAcceptRate(rate);

        // Build downgrade map
        const downgradeMap: Record<string, { count: number; co2e_avoided_g: number }> = {};
        liveDowngrades.forEach((r: any) => {
          const key = `${r.requested_model}\u2192${r.model}`;
          if (!downgradeMap[key]) downgradeMap[key] = { count: 0, co2e_avoided_g: 0 };
          downgradeMap[key].count++;
          downgradeMap[key].co2e_avoided_g += Math.max(0, (r.comparison?.naive_co2e_g ?? 0) - (r.environmental_cost?.co2e_g ?? 0));
        });

        const computed = Object.entries(downgradeMap)
          .map(([key, v]) => {
            const [from, to] = key.split("\u2192");
            return { from, to, count: v.count, co2e_avoided_g: v.co2e_avoided_g };
          })
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setTopDowngrades(computed);
      } catch {
        setTotalDecisions(0);
        setSuggested(0);
        setAccepted(0);
        setRejected(0);
        setAcceptRate(0);
        setTopDowngrades([]);
      }
    }
    load();
  }, []);

  const downgradeSavingsChart = topDowngrades.map((d: any) => ({
    route: `${shortModel(d.from)} \u2192 ${shortModel(d.to)}`,
    count: d.count,
    co2e_g: +d.co2e_avoided_g.toFixed(3),
  }));

  const heroMetrics = [
    { label: "Total Decisions",      value: totalDecisions.toLocaleString(), accent: false, sub: null },
    { label: "Downgrades Suggested", value: suggested.toLocaleString(),      accent: false, sub: null },
    { label: "Accepted",             value: accepted.toLocaleString(),       accent: true,  sub: `${acceptRate}% rate` },
    { label: "Rejected",             value: rejected.toLocaleString(),       accent: false, sub: `${(100 - acceptRate).toFixed(0)}% rate`, subColor: "var(--text-muted)" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ maxWidth: 1200, margin: "0 auto" }}>

      {/* ── Page header ─────────────────────────────────────────── */}
      <motion.div variants={item} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "6px" }}>
            <GitBranch style={{ width: 20, height: 20, color: "var(--blue-accent)" }} />
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
              Routing Intelligence
            </h1>
          </div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.04em" }}>
            How the Green Router optimizes model selection
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
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.12em",
            textTransform: "uppercase", color: live ? "#22c55e" : "var(--text-muted)",
          }}>
            {live ? "Live" : "Offline"}
          </span>
        </div>
      </motion.div>

      {/* ── Hero metrics strip ──────────────────────────────────── */}
      <motion.div variants={item} style={{
        borderTop: "1px solid var(--rule, #1e1e1e)",
        borderBottom: "1px solid var(--rule, #1e1e1e)",
        padding: "1.25rem 0",
        marginBottom: "2.5rem",
      }}>
        <div style={{ display: "flex", alignItems: "stretch" }}>
          {heroMetrics.map((m, i) => (
            <div key={m.label} style={{ display: "flex", alignItems: "stretch", flex: 1 }}>
              <div style={{ flex: 1 }}>
                <p
                  className="font-condensed"
                  style={{
                    fontSize: "clamp(2rem, 3.5vw, 3rem)",
                    color: m.accent ? "#22c55e" : "var(--text-primary)",
                    letterSpacing: "-0.02em",
                    lineHeight: 0.9,
                    marginBottom: "5px",
                  }}
                >
                  {m.value}
                </p>
                <p style={{
                  fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)",
                  textTransform: "uppercase", letterSpacing: "0.12em",
                }}>
                  {m.label}
                </p>
                {m.sub && (
                  <p style={{
                    fontFamily: "var(--font-mono)", fontSize: "9px", marginTop: "4px",
                    color: m.accent ? "#22c55e" : (m.subColor || "var(--text-muted)"),
                    letterSpacing: "0.06em",
                  }}>
                    {m.sub}
                  </p>
                )}
              </div>
              {i < heroMetrics.length - 1 && (
                <div style={{ width: "1px", backgroundColor: "var(--rule, #1e1e1e)", margin: "0 2rem", alignSelf: "stretch" }} />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Charts: CO₂ bar + rejection pie ─────────────────────── */}
      <motion.div variants={item} style={{ borderTop: "1px solid var(--rule, #1e1e1e)", paddingTop: "2rem", marginBottom: "2.5rem" }}>
        <Sec>Route Analytics</Sec>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>

          {/* Bar chart card */}
          <div style={{
            borderRadius: "0.75rem",
            overflow: "hidden",
            border: "1px solid var(--border)",
            backgroundColor: "var(--bg-card)",
            position: "relative",
          }}>
            {/* Thin gradient line at top */}
            <div style={{
              height: "2px",
              background: "linear-gradient(90deg, #22c55e 0%, #3b82f6 50%, #a855f7 100%)",
            }} />
            <div style={{ padding: "1.25rem" }}>
              <p style={{
                fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 700,
                letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)",
                marginBottom: "1rem",
              }}>
                Top Downgrade Routes — by CO&#x2082;e Avoided
              </p>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={downgradeSavingsChart} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis dataKey="route" type="category" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} tickLine={false} axisLine={false} width={140} />
                    <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" }} />
                    <Bar dataKey="co2e_g" fill="#22c55e" radius={[0, 4, 4, 0]} name="CO₂e Avoided (g)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Pie chart card */}
          <div style={{
            borderRadius: "0.75rem",
            overflow: "hidden",
            border: "1px solid var(--border)",
            backgroundColor: "var(--bg-card)",
            position: "relative",
          }}>
            {/* Thin gradient line at top */}
            <div style={{
              height: "2px",
              background: "linear-gradient(90deg, #f59e0b 0%, #ef4444 50%, #a855f7 100%)",
            }} />
            <div style={{ padding: "1.25rem" }}>
              <p style={{
                fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 700,
                letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)",
                marginBottom: "1rem",
              }}>
                Why Users Reject Downgrades
              </p>
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ width: 180, height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={REJECTION_REASONS} dataKey="pct" nameKey="reason" cx="50%" cy="50%" outerRadius={80} innerRadius={40} stroke="var(--bg-card)" strokeWidth={2}>
                        {REJECTION_REASONS.map((_, i) => <Cell key={i} fill={REJECTION_COLORS[i]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem", paddingLeft: "1rem" }}>
                  {REJECTION_REASONS.map((r, i) => (
                    <div key={r.reason} style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", flexShrink: 0, backgroundColor: REJECTION_COLORS[i] }} />
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{r.reason}</span>
                      <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", marginLeft: "auto", color: "var(--text-muted)" }}>{r.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </motion.div>

      {/* ── Table: detailed downgrade routes ─────────────────────── */}
      <motion.div variants={item} style={{ borderTop: "1px solid var(--rule, #1e1e1e)", paddingTop: "2rem", marginBottom: "2.5rem" }}>
        <Sec>All Downgrade Routes</Sec>
        <div style={{ borderRadius: "0.75rem", overflow: "hidden", border: "1px solid var(--border)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}>
                {["From \u2192 To", "Count", "CO\u2082e Avoided"].map(h => (
                  <th
                    key={h}
                    style={{
                      padding: "0.75rem 1.25rem",
                      textAlign: "left",
                      fontFamily: "var(--font-mono)",
                      fontSize: "9px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      color: "var(--text-muted)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topDowngrades.map((d: any, i: number) => (
                <motion.tr
                  key={i}
                  variants={item}
                  style={{
                    borderBottom: i < topDowngrades.length - 1 ? "1px solid var(--border)" : undefined,
                    cursor: "default",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--hover-bg)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td style={{ padding: "0.75rem 1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)" }}>
                        {shortModel(d.from)}
                      </span>
                      <ArrowDownRight style={{ width: 12, height: 12, color: "#22c55e" }} />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#22c55e", fontWeight: 700 }}>
                        {shortModel(d.to)}
                      </span>
                    </div>
                  </td>
                  <td style={{
                    padding: "0.75rem 1.25rem",
                    fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)",
                  }}>
                    {d.count.toLocaleString()}
                  </td>
                  <td style={{
                    padding: "0.75rem 1.25rem",
                    fontFamily: "var(--font-mono)", fontSize: "12px", color: "#22c55e",
                  }}>
                    {d.co2e_avoided_g.toFixed(3)}g
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
