"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import EmissionsChart from "@/components/EmissionsChart";
import { getAgentScore, listReceipts } from "@/lib/greenledger-api";

function getGrade(s: number) {
  if (s >= 90) return "A+";
  if (s >= 80) return "A";
  if (s >= 70) return "B";
  if (s >= 55) return "C";
  if (s >= 40) return "D";
  return "F";
}
function getLabel(s: number) {
  if (s >= 90) return "Excellent";
  if (s >= 75) return "Good";
  if (s >= 50) return "Fair";
  if (s >= 25) return "Poor";
  return "Critical";
}
function getScoreColor(s: number) {
  if (s >= 75) return "#22c55e";
  if (s >= 50) return "#f59e0b";
  return "#f87171";
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Sec({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-dim)" }}>
        {children}
      </span>
      <div style={{ flex: 1, height: "1px", backgroundColor: "var(--rule)" }} />
    </div>
  );
}

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export default function AgentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [agent, setAgent] = useState<any | null>(null);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [emissionsData, setEmissionsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [agentRes, receiptsRes] = await Promise.all([
          getAgentScore(id),
          listReceipts({ agent_id: id, limit: 100 }),
        ]);
        setAgent(agentRes.data);
        const recs = Array.isArray(receiptsRes.data) ? receiptsRes.data : [];
        setReceipts(recs.slice(0, 20));

        const byDay: Record<string, { co2e: number; energy: number }> = {};
        recs.forEach((r: any) => {
          const day = new Date(r.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          if (!byDay[day]) byDay[day] = { co2e: 0, energy: 0 };
          byDay[day].co2e += r.environmental_cost?.co2e_g ?? 0;
          byDay[day].energy += r.environmental_cost?.energy_wh ?? 0;
        });
        setEmissionsData(Object.entries(byDay).map(([date, v]) => ({
          date,
          co2e: Math.round(v.co2e * 1000) / 1000,
          energy: Math.round(v.energy * 100) / 100,
        })));
      } catch { /* agent stays null */ }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div>
        <Link href="/dashboard/agents" className="flex items-center gap-1 text-xs mb-6 hover:opacity-70 transition-opacity"
          style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
          <ArrowLeft className="w-3 h-3" /> Back to Agents
        </Link>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>Loading…</p>
      </div>
    );
  }

  if (!agent || agent.total_inferences === 0) {
    return (
      <div>
        <Link href="/dashboard/agents" className="flex items-center gap-1 text-xs mb-6 hover:opacity-70 transition-opacity"
          style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
          <ArrowLeft className="w-3 h-3" /> Back to Agents
        </Link>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
          No data found for agent <span style={{ color: "var(--text-primary)" }}>{id}</span>.
        </p>
      </div>
    );
  }

  const score = agent.sustainability_score ?? 0;
  const scoreColor = getScoreColor(score);
  const walletPct = agent.wallet_utilization_pct;
  const walletColor = walletPct >= 80 ? "#f87171" : walletPct >= 50 ? "#f59e0b" : "#22c55e";

  const radarData = [
    { metric: "Carbon Eff.", score: Math.min(100, score + 10) },
    { metric: "Budget Adh.", score: Math.min(100, score + 5) },
    { metric: "Offset Cov.", score: Math.max(0, score - 5) },
    { metric: "Opt. Adopt.", score },
    { metric: "Trend", score: Math.min(100, score + 8) },
  ];

  const metrics = [
    { label: "CO₂ Emitted",  value: `${Number(agent.total_co2e_g).toFixed(3)}g` },
    { label: "Energy Used",  value: `${Number(agent.total_energy_wh).toFixed(2)} Wh` },
    { label: "Inferences",   value: Number(agent.total_inferences).toLocaleString() },
  ];

  return (
    <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}>

      {/* ── Back link ─────────────────────────────────────────────── */}
      <motion.div variants={item}>
        <Link href="/dashboard/agents" className="inline-flex items-center gap-1.5 mb-6 hover:opacity-70 transition-opacity"
          style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textDecoration: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          <ArrowLeft className="w-3 h-3" /> Agents
        </Link>
      </motion.div>

      {/* ── Hero: grade word + score / metrics ────────────────────── */}
      <motion.div variants={item} style={{ borderBottom: "1px solid var(--rule)", paddingBottom: "2.5rem", marginBottom: "2.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "5fr 7fr", gap: 0 }}>

          {/* LEFT — grade + agent name */}
          <div style={{ borderRight: "1px solid var(--rule)", paddingRight: "2.5rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span className="font-condensed block" style={{
              fontSize: "clamp(3rem, 7vw, 6rem)",
              color: scoreColor,
              letterSpacing: "-0.02em",
              lineHeight: 0.85,
              marginBottom: "0.75rem",
            }}>
              {getLabel(score)}
            </span>
            <div className="flex items-baseline gap-3" style={{ marginBottom: "0.5rem" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.05em", lineHeight: 1 }}>
                {score}
              </span>
              <span className="font-condensed" style={{ fontSize: "1.6rem", color: scoreColor, letterSpacing: "-0.02em", lineHeight: 1 }}>
                {getGrade(score)}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>/ 100</span>
            </div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
              {agent.display_name || agent.agent_id}
            </p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-dim)", marginTop: "2px" }}>
              {agent.agent_id}
            </p>
          </div>

          {/* RIGHT — 3 metrics inline */}
          <div style={{ paddingLeft: "2.5rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", height: "100%" }}>
              {metrics.map((m, i) => (
                <div key={m.label} style={{
                  borderLeft: i > 0 ? "1px solid var(--rule)" : "none",
                  paddingLeft: i > 0 ? "1.5rem" : 0,
                  paddingRight: i < 2 ? "1.5rem" : 0,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(1rem, 1.4vw, 1.25rem)", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.04em", lineHeight: 1, display: "block", marginBottom: "5px" }}>
                    {m.value}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </motion.div>

      {/* ── Score breakdown + wallet ──────────────────────────────── */}
      <motion.div variants={item} style={{ marginBottom: "2.5rem" }}>
        <Sec>Score Breakdown</Sec>
        <div style={{ display: "grid", gridTemplateColumns: "5fr 7fr", gap: "2.5rem" }}>

          {/* Radar */}
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                <PolarGrid stroke="var(--rule)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "monospace" }} />
                <Radar dataKey="score" stroke={scoreColor} fill={scoreColor} fillOpacity={0.15} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Carbon wallet */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: "1rem" }}>
              Carbon Wallet
            </p>
            {walletPct != null ? (
              <>
                <div style={{ height: "3px", borderRadius: "2px", backgroundColor: "var(--rule)", marginBottom: "10px", overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(walletPct, 100)}%` }}
                    transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
                    style={{ height: "100%", borderRadius: "2px", backgroundColor: walletColor }}
                  />
                </div>
                <div className="flex items-baseline gap-3">
                  <span style={{ fontFamily: "var(--font-condensed)", fontSize: "2.5rem", color: walletColor, letterSpacing: "-0.02em", lineHeight: 1 }}>
                    {walletPct}%
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>used</span>
                </div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "6px" }}>
                  {walletPct < 50 ? "Healthy budget remaining" : walletPct < 80 ? "Budget getting tight" : "Approaching budget limit"}
                </p>
              </>
            ) : (
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>No wallet configured</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Emissions chart ───────────────────────────────────────── */}
      {emissionsData.length > 0 && (
        <motion.div variants={item} style={{ borderTop: "1px solid var(--rule)", paddingTop: "2rem", marginBottom: "2.5rem" }}>
          <Sec>{`${agent.display_name || agent.agent_id} — Emissions`}</Sec>
          <div style={{ height: 320 }}>
            <EmissionsChart data={emissionsData} />
          </div>
        </motion.div>
      )}

      {/* ── Recent receipts ───────────────────────────────────────── */}
      {receipts.length > 0 && (
        <motion.div variants={item} style={{ borderTop: "1px solid var(--rule)", paddingTop: "2rem" }}>
          <Sec>Recent Receipts</Sec>

          {/* Header row */}
          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 110px 90px 60px", gap: "1rem", padding: "0.5rem 0", borderBottom: "1px solid var(--rule)" }}>
            {["Time", "Model", "CO₂e", "Energy", "Saved"].map((h, i) => (
              <span key={h} style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: i >= 2 ? "right" : "left" }}>
                {h}
              </span>
            ))}
          </div>

          {receipts.map((r) => (
            <div key={r.id} style={{ display: "grid", gridTemplateColumns: "140px 1fr 110px 90px 60px", gap: "1rem", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid var(--rule)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                {formatDate(r.timestamp)}
              </span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "12px", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.model}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", textAlign: "right" }}>
                {Number(r.environmental_cost?.co2e_g ?? 0).toFixed(4)}g
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", textAlign: "right" }}>
                {Number(r.environmental_cost?.energy_wh ?? 0).toFixed(3)} Wh
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", textAlign: "right", color: r.comparison?.savings_pct > 0 ? "#22c55e" : "var(--text-muted)" }}>
                {r.comparison?.savings_pct > 0 ? `+${r.comparison.savings_pct}%` : "—"}
              </span>
            </div>
          ))}
        </motion.div>
      )}

    </motion.div>
  );
}
