"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import EmissionsChart     from "@/components/EmissionsChart";
import ModelPieChart      from "@/components/ModelPieChart";
import RecommendationCard from "@/components/RecommendationCard";
import RoutingPipeline    from "@/components/RoutingPipeline";
import ActivityTable      from "@/components/ActivityTable";
import { getDashboardSummary, getOrgScore, listReceipts } from "@/lib/greenledger-api";
import { DUMMY_AGENTS } from "@/lib/dummy-agents";

/* ── dummy aggregate constants (computed once at module load) ──── */
const DUMMY_TOTAL_INFERENCES = DUMMY_AGENTS.reduce((s, a) => s + a.total_inferences, 0);
const DUMMY_TOTAL_CO2E_G     = DUMMY_AGENTS.reduce((s, a) => s + a.total_co2e_g, 0);
const DUMMY_TOTAL_ENERGY_WH  = DUMMY_AGENTS.reduce((s, a) => s + a.total_energy_wh, 0);

// Per-day emissions summed across all dummy agents
const DUMMY_EMISSIONS_BY_DAY: Record<string, { co2e: number; energy: number }> = {};
DUMMY_AGENTS.forEach(agent => {
  agent.emissions.forEach(day => {
    if (!DUMMY_EMISSIONS_BY_DAY[day.date]) DUMMY_EMISSIONS_BY_DAY[day.date] = { co2e: 0, energy: 0 };
    DUMMY_EMISSIONS_BY_DAY[day.date].co2e   += day.co2e;
    DUMMY_EMISSIONS_BY_DAY[day.date].energy += day.energy;
  });
});

// All dummy receipts sorted newest-first
const DUMMY_RECEIPTS = DUMMY_AGENTS.flatMap(a => a.receipts)
  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

// Dummy model usage counts
const DUMMY_MODEL_COUNTS: Record<string, number> = {};
DUMMY_RECEIPTS.forEach(r => { DUMMY_MODEL_COUNTS[r.model] = (DUMMY_MODEL_COUNTS[r.model] || 0) + 1; });

// Dummy routing stats (decisions where final_model !== user_selected.model)
const DUMMY_ROUTING = {
  routed:      DUMMY_AGENTS.reduce((s, a) => s + a.decisions.length, 0),
  downgraded:  3,   // cr-2 (haiku), da-4 (haiku), cw-1 (haiku)
  co2eAvoided: 1.92,
};

// Weighted average sustainability score
const DUMMY_SCORE = Math.round(
  DUMMY_AGENTS.reduce((s, a) => s + a.sustainability_score * a.total_inferences, 0) / DUMMY_TOTAL_INFERENCES
);

const PIE_COLORS = ["#22c55e", "#60a5fa", "#a855f7", "#f59e0b", "#f87171", "#ec4899"];

/* ── helpers ──────────────────────────────────────────────────── */
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

const EMPTY_SUMMARY = {
  org_id: "", total_inferences: 0, total_co2e_g: 0, total_energy_wh: 0,
  total_water_ml: 0, total_levy_usd: 0, total_carbon_removed_g: 0,
  avg_savings_vs_naive_pct: 0, sustainability_score: 0, active_agents: 0,
  period_start: "", period_end: "",
};
const EMPTY_SCORE = { current_score: 0, previous_score: null, recommendations: [] };

/* ── animation variants ───────────────────────────────────────── */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
};

/* ── tiny section label ───────────────────────────────────────── */
function Sec({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700,
        letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-dim)",
      }}>
        {children}
      </span>
      <div style={{ flex: 1, height: "1px", backgroundColor: "var(--rule)" }} />
    </div>
  );
}

/* ── main page ────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [summary,       setSummary]       = useState<any>(EMPTY_SUMMARY);
  const [score,         setScore]         = useState<any>(EMPTY_SCORE);
  const [emissionsData, setEmissionsData] = useState<any[]>([]);
  const [modelData,     setModelData]     = useState<any[]>([]);
  const [receipts,      setReceipts]      = useState<any[]>([]);
  const [routingStats,  setRoutingStats]  = useState({ routed: 0, downgraded: 0, co2eAvoided: 0 });
  const [live,          setLive]          = useState(false);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [dashRes, scoreRes, receiptsRes] = await Promise.all([
          getDashboardSummary(), getOrgScore(), listReceipts({ limit: 200 }),
        ]);
        setLive(true);

        const raw: any[] = Array.isArray(receiptsRes.data) ? receiptsRes.data : [];

        // ── merge dummy agent data into live summary ────────────────
        const live = dashRes.data ?? EMPTY_SUMMARY;
        const liveWeight  = live.total_inferences || 0;
        const totalWeight = liveWeight + DUMMY_TOTAL_INFERENCES;
        const liveScore   = scoreRes.data?.current_score ?? 0;
        const augScore    = totalWeight > 0
          ? Math.round((liveScore * liveWeight + DUMMY_SCORE * DUMMY_TOTAL_INFERENCES) / totalWeight)
          : DUMMY_SCORE;

        setSummary({
          ...live,
          total_inferences: (live.total_inferences || 0) + DUMMY_TOTAL_INFERENCES,
          total_co2e_g:     (live.total_co2e_g     || 0) + DUMMY_TOTAL_CO2E_G,
          total_energy_wh:  (live.total_energy_wh  || 0) + DUMMY_TOTAL_ENERGY_WH,
          active_agents:    (live.active_agents    || 0) + DUMMY_AGENTS.length,
        });
        setScore({ ...scoreRes.data, current_score: augScore });

        // ── routing stats ─────────────────────────────────────────
        const liveDowngraded  = raw.filter((r: any) => r.requested_model && r.model && r.requested_model !== r.model).length;
        const liveCo2eAvoided = raw.reduce((sum: number, r: any) =>
          sum + Math.max(0, (r.comparison?.naive_co2e_g ?? 0) - (r.environmental_cost?.co2e_g ?? 0)), 0);
        setRoutingStats({
          routed:      raw.length      + DUMMY_ROUTING.routed,
          downgraded:  liveDowngraded  + DUMMY_ROUTING.downgraded,
          co2eAvoided: liveCo2eAvoided + DUMMY_ROUTING.co2eAvoided,
        });

        // ── emissions chart: live + dummy merged by day ────────────
        const byDay: Record<string, { co2e: number; energy: number }> = {};
        raw.forEach((r: any) => {
          const day = new Date(r.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          if (!byDay[day]) byDay[day] = { co2e: 0, energy: 0 };
          byDay[day].co2e   += r.environmental_cost?.co2e_g   ?? 0;
          byDay[day].energy += r.environmental_cost?.energy_wh ?? 0;
        });
        Object.entries(DUMMY_EMISSIONS_BY_DAY).forEach(([date, v]) => {
          if (!byDay[date]) byDay[date] = { co2e: 0, energy: 0 };
          byDay[date].co2e   += v.co2e;
          byDay[date].energy += v.energy;
        });
        setEmissionsData(Object.entries(byDay).map(([date, v]) => ({
          date,
          co2e:   Math.round(v.co2e   * 1000) / 1000,
          energy: Math.round(v.energy * 100)  / 100,
        })));

        // ── model pie chart: live + dummy merged ───────────────────
        const byModel: Record<string, number> = {};
        raw.forEach((r: any) => { if (r.model) byModel[r.model] = (byModel[r.model] || 0) + 1; });
        Object.entries(DUMMY_MODEL_COUNTS).forEach(([model, count]) => {
          byModel[model] = (byModel[model] || 0) + count;
        });
        setModelData(Object.entries(byModel).map(([name, value], i) => ({
          name: name.replace("claude-","").replace("gpt-","").replace("gemini-",""),
          value, color: PIE_COLORS[i % PIE_COLORS.length],
        })));

        // ── activity table: live + dummy receipts ─────────────────
        const allReceipts = [...raw, ...DUMMY_RECEIPTS]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setReceipts(allReceipts);

      } catch {
        // ── fully offline: dummy data only ────────────────────────
        setSummary({
          ...EMPTY_SUMMARY,
          total_inferences:      DUMMY_TOTAL_INFERENCES,
          total_co2e_g:          DUMMY_TOTAL_CO2E_G,
          total_energy_wh:       DUMMY_TOTAL_ENERGY_WH,
          active_agents:         DUMMY_AGENTS.length,
          avg_savings_vs_naive_pct: 19,
        });
        setScore({ current_score: DUMMY_SCORE, previous_score: null, recommendations: [] });
        setRoutingStats(DUMMY_ROUTING);
        setReceipts(DUMMY_RECEIPTS);
        setEmissionsData(
          Object.entries(DUMMY_EMISSIONS_BY_DAY).map(([date, v]) => ({
            date,
            co2e:   Math.round(v.co2e   * 1000) / 1000,
            energy: Math.round(v.energy * 100)  / 100,
          }))
        );
        setModelData(Object.entries(DUMMY_MODEL_COUNTS).map(([name, value], i) => ({
          name: name.replace("claude-","").replace("gpt-","").replace("gemini-",""),
          value, color: PIE_COLORS[i % PIE_COLORS.length],
        })));
      }
      setLoading(false);
    }
    load();
  }, []);

  const s  = summary;
  const sc = score;
  const scoreColor = getScoreColor(sc.current_score);
  const change = sc.previous_score != null ? sc.current_score - sc.previous_score : null;

  const metrics = [
    { label: "CO₂ Emitted",   value: `${Number(s.total_co2e_g).toFixed(3)}g`,              accent: false },
    { label: "Energy Used",   value: `${Number(s.total_energy_wh).toFixed(2)} Wh`,          accent: false },
    { label: "Water Used",    value: `${Number(s.total_water_ml).toFixed(1)} mL`,            accent: false },
    { label: "Carbon Levy",   value: `$${Number(s.total_levy_usd).toFixed(5)}`,              accent: false },
    { label: "CO₂ Savings",   value: `${Number(s.avg_savings_vs_naive_pct).toFixed(1)}%`,   accent: true  },
    { label: "Inferences",    value: Number(s.total_inferences).toLocaleString(),            accent: false },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show">

      {/* ── Header ──────────────────────────────────────────────── */}
      <motion.div variants={item} className="flex items-start justify-between mb-8">
        <div>
          <h1
            className="font-black"
            style={{ fontSize: "1.75rem", letterSpacing: "-0.04em", color: "var(--text-primary)", lineHeight: 1 }}
          >
            Overview
          </h1>
          {s.period_start && (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "5px" }}>
              {s.period_start} — {s.period_end} · {s.active_agents} active agent{s.active_agents !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <div
          className="flex items-center gap-1.5"
          style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: live ? "#22c55e" : "var(--text-muted)" }}
        >
          <span style={{
            width: 6, height: 6, borderRadius: "50%", display: "inline-block",
            backgroundColor: loading ? "#f59e0b" : live ? "#22c55e" : "var(--text-muted)",
            animation: "pulse-green 2s ease-in-out infinite",
          }} />
          {loading ? "Connecting" : live ? "Live" : "Offline"}
        </div>
      </motion.div>

      {/* ── Hero: grade word + score left / metrics right ────────── */}
      <motion.div
        variants={item}
        style={{ borderBottom: "1px solid var(--rule)", paddingBottom: "2.5rem", marginBottom: "2.5rem" }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "5fr 7fr", gap: 0 }}>

          {/* LEFT — grade word dominates */}
          <div style={{ borderRight: "1px solid var(--rule)", paddingRight: "2.5rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>

            {/* The word: EXCELLENT / GOOD / FAIR etc */}
            <span
              className="font-condensed block"
              style={{
                fontSize: "clamp(3.5rem, 8vw, 7rem)",
                color: scoreColor,
                letterSpacing: "-0.02em",
                lineHeight: 0.85,
                marginBottom: "0.75rem",
              }}
            >
              {sc.current_score > 0 ? getLabel(sc.current_score) : "—"}
            </span>

            {/* Score number row */}
            <div className="flex items-baseline gap-3" style={{ marginBottom: "0.5rem" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.05em",
                  lineHeight: 1,
                }}
              >
                {sc.current_score || 0}
              </span>
              <span
                className="font-condensed"
                style={{ fontSize: "1.8rem", color: scoreColor, letterSpacing: "-0.02em", lineHeight: 1 }}
              >
                {getGrade(sc.current_score)}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                / 100
              </span>
            </div>

            {/* Change indicator */}
            {change !== null && (
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: change >= 0 ? "#22c55e" : "#f87171" }}>
                {change >= 0 ? "↑" : "↓"} {Math.abs(change)} pts vs last period
              </p>
            )}
          </div>

          {/* RIGHT — 3×2 metrics grid, internal rules only */}
          <div style={{ paddingLeft: "2.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", height: "100%" }}>
              {metrics.map((m, i) => (
                <div
                  key={m.label}
                  style={{
                    borderLeft:   i % 3 !== 0 ? "1px solid var(--rule)" : "none",
                    borderBottom: i < 3        ? "1px solid var(--rule)" : "none",
                    padding: `${i < 3 ? "0" : "1.25rem"} ${i % 3 !== 2 ? "1.25rem" : "0"} ${i < 3 ? "1.25rem" : "0"} ${i % 3 !== 0 ? "1.25rem" : "0"}`,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "clamp(1rem, 1.5vw, 1.35rem)",
                      fontWeight: 700,
                      color: m.accent ? "#22c55e" : "var(--text-primary)",
                      letterSpacing: "-0.04em",
                      lineHeight: 1,
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    {m.value}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "9px",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </motion.div>

      {/* ── Green Router ──────────────────────────────────────────── */}
      <motion.div variants={item} style={{ borderTop: "1px solid var(--rule)", paddingTop: "2rem", marginBottom: "2.5rem" }}>
        <Sec>Green Router</Sec>
        <RoutingPipeline
          routedCount={routingStats.routed}
          downgradeCount={routingStats.downgraded}
          co2Avoided={routingStats.co2eAvoided}
          lastReceipts={receipts}
        />
      </motion.div>

      {/* ── Emissions chart + model breakdown ─────────────────────── */}
      <motion.div variants={item} style={{ borderTop: "1px solid var(--rule)", paddingTop: "2rem", marginBottom: "2.5rem" }}>
        <Sec>Emissions</Sec>
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-8" style={{ height: 440 }}>
            {emissionsData.length > 0
              ? <div style={{ height: "100%" }}><EmissionsChart data={emissionsData} /></div>
              : (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-dim)" }}>
                    No data yet — run a CLI query to populate
                  </p>
                </div>
              )
            }
          </div>
          <div className="col-span-4" style={{ height: 440 }}>
            {modelData.length > 0
              ? <div style={{ height: "100%" }}><ModelPieChart data={modelData} /></div>
              : (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-dim)" }}>
                    No model data yet
                  </p>
                </div>
              )
            }
          </div>
        </div>
      </motion.div>

      {/* ── Recent activity ───────────────────────────────────────── */}
      {receipts.length > 0 && (
        <motion.div variants={item} style={{ borderTop: "1px solid var(--rule)", paddingTop: "2rem", marginBottom: "2.5rem" }}>
          <Sec>Recent Activity</Sec>
          <ActivityTable receipts={receipts} />
        </motion.div>
      )}

      {/* ── Recommendations ───────────────────────────────────────── */}
      {sc.recommendations?.length > 0 && (
        <motion.div variants={item} style={{ borderTop: "1px solid var(--rule)", paddingTop: "2rem" }}>
          <Sec>Optimization Insights</Sec>
          <div className="space-y-2">
            {sc.recommendations.map((rec: any) => (
              <RecommendationCard
                key={rec.id}
                title={rec.title}
                description={rec.description}
                savingsPct={rec.estimated_savings_pct}
                savingsCo2e={rec.estimated_savings_co2e_g}
                priority={rec.priority}
              />
            ))}
          </div>
        </motion.div>
      )}

    </motion.div>
  );
}
