"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, RefreshCcw } from "lucide-react";
import { getAgentScores } from "@/lib/greenledger-api";

function getScoreColor(s: number | null) {
  if (s == null) return "var(--text-dim)";
  if (s >= 75) return "#22c55e";
  if (s >= 50) return "#f59e0b";
  return "#f87171";
}
function getGrade(s: number | null) {
  if (s == null) return "—";
  if (s >= 90) return "A+";
  if (s >= 80) return "A";
  if (s >= 70) return "B";
  if (s >= 55) return "C";
  if (s >= 40) return "D";
  return "F";
}
const TREND: Record<string, { label: string; color: string }> = {
  on_track: { label: "On Track", color: "#22c55e" },
  at_risk:  { label: "At Risk",  color: "#f59e0b" },
  exceeded: { label: "Exceeded", color: "#f87171" },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export default function AgentsPage() {
  const [agents,  setAgents]  = useState<any[]>([]);
  const [live,    setLive]    = useState(false);
  const [loading, setLoading] = useState(true);

  const fetch_ = async () => {
    setLoading(true);
    try {
      const res = await getAgentScores();
      setAgents(Array.isArray(res.data) ? res.data : []);
      setLive(true);
    } catch { /* offline */ }
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const sorted = [...agents].sort((a, b) => (b.sustainability_score ?? 0) - (a.sustainability_score ?? 0));
  const best   = sorted[0]?.sustainability_score ?? 0;
  const worst  = sorted[sorted.length - 1]?.sustainability_score ?? 0;
  const avgScore = agents.length
    ? Math.round(agents.reduce((a, ag) => a + (ag.sustainability_score ?? 0), 0) / agents.length)
    : 0;
  const totalInferences = agents.reduce((a, ag) => a + (ag.total_inferences ?? 0), 0);

  return (
    <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <motion.div variants={item} className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-black" style={{ fontSize: "1.75rem", letterSpacing: "-0.04em", color: "var(--text-primary)", lineHeight: 1 }}>
            Agents
          </h1>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "5px" }}>
            Sustainability leaderboard across all AI agents
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5" style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: live ? "#22c55e" : "var(--text-muted)" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: live ? "#22c55e" : "var(--text-muted)", display: "inline-block", animation: "pulse-green 2s ease-in-out infinite" }} />
            {live ? "Live" : "Offline"}
          </span>
          <button onClick={fetch_} className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70"
            style={{ border: "1px solid var(--border)", color: "var(--text-muted)", backgroundColor: "transparent", fontFamily: "var(--font-mono)" }}>
            <RefreshCcw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </motion.div>

      {/* ── Stat strip ─────────────────────────────────────────── */}
      <motion.div variants={item} style={{ borderTop: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)", padding: "1.25rem 0", marginBottom: "2rem" }}>
        <div className="flex items-stretch">
          {[
            { label: "Total Agents",      value: String(agents.length),          grade: null,            accent: false },
            { label: "Avg Score",         value: String(avgScore),               grade: null,            accent: false },
            { label: "Total Inferences",  value: totalInferences.toLocaleString(), grade: null,          accent: false },
            { label: "Top Score",         value: best > 0 ? String(best) : "—", grade: best > 0 ? getGrade(best) : null, accent: true  },
          ].map((s, i) => (
            <div key={s.label} className="flex items-stretch gap-0 flex-1">
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <p style={{ fontFamily: "var(--font-condensed)", fontSize: "clamp(2rem, 3.5vw, 3rem)", color: s.accent ? "#22c55e" : "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 0.9 }}>
                    {s.value}
                  </p>
                  {s.grade && (
                    <p style={{ fontFamily: "var(--font-condensed)", fontSize: "1.4rem", color: "#22c55e", letterSpacing: "-0.02em", lineHeight: 1 }}>
                      {s.grade}
                    </p>
                  )}
                </div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "6px" }}>
                  {s.label}
                </p>
              </div>
              {i < 3 && <div style={{ width: "1px", backgroundColor: "var(--rule)", margin: "0 2rem", alignSelf: "stretch" }} />}
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Agent list ─────────────────────────────────────────── */}
      <motion.div variants={item}>
        {sorted.length === 0 ? (
          <div style={{ padding: "4rem 0", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
              No agents yet — run queries via CLI to populate
            </p>
          </div>
        ) : (
          <div style={{ borderTop: "1px solid var(--rule)" }}>
            {/* Column labels */}
            <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 80px 100px 80px 160px 90px 20px", gap: "1rem", padding: "0.5rem 0", borderBottom: "1px solid var(--rule)" }}>
              {["#", "Agent", "Score", "Inferences", "CO₂e", "Wallet", "Status", ""].map((h, i) => (
                <span key={i} style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: i >= 2 && i <= 4 ? "right" : "left" }}>
                  {h}
                </span>
              ))}
            </div>

            {sorted.map((agent, i) => {
              const score = agent.sustainability_score;
              const color = getScoreColor(score);
              const trend = TREND[agent.trend] || null;
              const walletPct = agent.wallet_utilization_pct;
              const walletColor = walletPct >= 80 ? "#f87171" : walletPct >= 50 ? "#f59e0b" : "#22c55e";

              return (
                <Link
                  key={agent.agent_id}
                  href={`/dashboard/agents/${agent.agent_id}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "32px 1fr 80px 100px 80px 160px 90px 20px",
                    gap: "1rem",
                    alignItems: "center",
                    padding: "0.9rem 0",
                    borderBottom: "1px solid var(--rule)",
                    borderLeft: i === 0 ? `2px solid ${color}` : "2px solid transparent",
                    paddingLeft: i === 0 ? "0.75rem" : "2px",
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "var(--hover-bg)";
                    (e.currentTarget as HTMLElement).style.borderLeftColor = color;
                    (e.currentTarget as HTMLElement).style.paddingLeft = "0.75rem";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                    (e.currentTarget as HTMLElement).style.borderLeftColor = i === 0 ? color : "transparent";
                    (e.currentTarget as HTMLElement).style.paddingLeft = i === 0 ? "0.75rem" : "2px";
                  }}
                >
                  {/* Rank */}
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: i === 0 ? color : "var(--text-muted)" }}>
                    {i + 1}
                  </span>

                  {/* Agent name + id */}
                  <div>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>
                      {agent.display_name}
                    </p>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)" }}>
                      {agent.agent_id}
                    </p>
                  </div>

                  {/* Score */}
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontFamily: "var(--font-condensed)", fontSize: "1.4rem", color, letterSpacing: "-0.02em", lineHeight: 1 }}>
                      {score ?? "—"}
                    </span>
                    {score != null && (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color, display: "block", letterSpacing: "0.05em" }}>
                        {getGrade(score)}
                      </span>
                    )}
                  </div>

                  {/* Inferences */}
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", textAlign: "right" }}>
                    {agent.total_inferences?.toLocaleString() ?? "—"}
                  </span>

                  {/* CO₂e */}
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", textAlign: "right" }}>
                    {Number(agent.total_co2e_g).toFixed(2)}g
                  </span>

                  {/* Wallet bar */}
                  <div>
                    {walletPct != null ? (
                      <div>
                        <div style={{ height: "2px", borderRadius: "1px", backgroundColor: "var(--track-bg)", marginBottom: "4px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min(walletPct, 100)}%`, backgroundColor: walletColor, borderRadius: "1px", transition: "width 0.8s ease" }} />
                        </div>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: walletColor }}>{walletPct}% used</span>
                      </div>
                    ) : (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)" }}>no budget</span>
                    )}
                  </div>

                  {/* Trend */}
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: trend?.color ?? "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {trend?.label ?? "—"}
                  </span>

                  {/* Arrow */}
                  <ArrowUpRight className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                </Link>
              );
            })}
          </div>
        )}
      </motion.div>

    </motion.div>
  );
}
