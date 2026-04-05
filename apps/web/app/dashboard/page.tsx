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

const DUMMY_EMISSIONS_BY_DAY: Record<string, { co2e: number; energy: number }> = {};
DUMMY_AGENTS.forEach(agent => {
  agent.emissions.forEach(day => {
    if (!DUMMY_EMISSIONS_BY_DAY[day.date]) DUMMY_EMISSIONS_BY_DAY[day.date] = { co2e: 0, energy: 0 };
    DUMMY_EMISSIONS_BY_DAY[day.date].co2e   += day.co2e;
    DUMMY_EMISSIONS_BY_DAY[day.date].energy += day.energy;
  });
});

const DUMMY_RECEIPTS = DUMMY_AGENTS.flatMap(a => a.receipts)
  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

const DUMMY_MODEL_COUNTS: Record<string, number> = {};
DUMMY_RECEIPTS.forEach(r => { DUMMY_MODEL_COUNTS[r.model] = (DUMMY_MODEL_COUNTS[r.model] || 0) + 1; });

const DUMMY_ROUTING = {
  routed:      DUMMY_AGENTS.reduce((s, a) => s + a.decisions.length, 0),
  downgraded:  3,
  co2eAvoided: 1.92,
};

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

        const liveData   = dashRes.data ?? EMPTY_SUMMARY;
        const liveWeight  = liveData.total_inferences || 0;
        const totalWeight = liveWeight + DUMMY_TOTAL_INFERENCES;
        const liveScore   = scoreRes.data?.current_score ?? 0;
        const augScore    = totalWeight > 0
          ? Math.round((liveScore * liveWeight + DUMMY_SCORE * DUMMY_TOTAL_INFERENCES) / totalWeight)
          : DUMMY_SCORE;

        setSummary({
          ...liveData,
          total_inferences: (liveData.total_inferences || 0) + DUMMY_TOTAL_INFERENCES,
          total_co2e_g:     (liveData.total_co2e_g     || 0) + DUMMY_TOTAL_CO2E_G,
          total_energy_wh:  (liveData.total_energy_wh  || 0) + DUMMY_TOTAL_ENERGY_WH,
          active_agents:    (liveData.active_agents    || 0) + DUMMY_AGENTS.length,
        });
        setScore({ ...scoreRes.data, current_score: augScore });

        const liveDowngraded  = raw.filter((r: any) => r.requested_model && r.model && r.requested_model !== r.model).length;
        const liveCo2eAvoided = raw.reduce((sum: number, r: any) =>
          sum + Math.max(0, (r.comparison?.naive_co2e_g ?? 0) - (r.environmental_cost?.co2e_g ?? 0)), 0);
        setRoutingStats({
          routed:      raw.length      + DUMMY_ROUTING.routed,
          downgraded:  liveDowngraded  + DUMMY_ROUTING.downgraded,
          co2eAvoided: liveCo2eAvoided + DUMMY_ROUTING.co2eAvoided,
        });

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

        const byModel: Record<string, number> = {};
        raw.forEach((r: any) => { if (r.model) byModel[r.model] = (byModel[r.model] || 0) + 1; });
        Object.entries(DUMMY_MODEL_COUNTS).forEach(([model, count]) => {
          byModel[model] = (byModel[model] || 0) + count;
        });
        setModelData(Object.entries(byModel).map(([name, value], i) => ({
          name: name.replace("claude-","").replace("gpt-","").replace("gemini-",""),
          value, color: PIE_COLORS[i % PIE_COLORS.length],
        })));

        const allReceipts = [...raw, ...DUMMY_RECEIPTS]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setReceipts(allReceipts);

      } catch {
        setSummary({
          ...EMPTY_SUMMARY,
          total_inferences:         DUMMY_TOTAL_INFERENCES,
          total_co2e_g:             DUMMY_TOTAL_CO2E_G,
          total_energy_wh:          DUMMY_TOTAL_ENERGY_WH,
          active_agents:            DUMMY_AGENTS.length,
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

  const s         = summary;
  const sc        = score;
  const scoreVal  = sc.current_score || 0;
  const scoreColor = getScoreColor(scoreVal);
  const change    = sc.previous_score != null ? scoreVal - sc.previous_score : null;

  const metrics = [
    { label: "CO₂ Emitted",  value: `${Number(s.total_co2e_g).toFixed(3)}g`,             accent: false },
    { label: "Energy Used",  value: `${Number(s.total_energy_wh).toFixed(2)} Wh`,         accent: false },
    { label: "Water Used",   value: `${Number(s.total_water_ml).toFixed(1)} mL`,           accent: false },
    { label: "Carbon Levy",  value: `$${Number(s.total_levy_usd).toFixed(5)}`,             accent: false },
    { label: "CO₂ Savings",  value: `${Number(s.avg_savings_vs_naive_pct).toFixed(1)}%`,  accent: true  },
    { label: "Inferences",   value: Number(s.total_inferences).toLocaleString(),           accent: false },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show">

      {/* ── Page header ─────────────────────────────────────────── */}
      <motion.div variants={item} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2.5rem" }}>
        <div>
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
            Overview
          </h1>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "6px", letterSpacing: "0.04em" }}>
            {s.period_start
              ? `${s.period_start} — ${s.period_end} · ${s.active_agents} active agent${s.active_agents !== 1 ? "s" : ""}`
              : `${s.active_agents || "—"} active agents`
            }
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
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: loading ? "#f59e0b" : live ? "#22c55e" : "var(--text-muted)" }}>
            {loading ? "Connecting" : live ? "Live" : "Offline"}
          </span>
        </div>
      </motion.div>

      {/* ── Hero: grade + score LEFT / 6 metrics RIGHT ──────────── */}
      <motion.div variants={item} style={{ borderTop: "1px solid var(--rule, #1e1e1e)", paddingTop: "2rem", borderBottom: "1px solid var(--rule, #1e1e1e)", paddingBottom: "2rem", marginBottom: "2.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "5fr 7fr", gap: 0 }}>

          {/* LEFT — grade word hero */}
          <div style={{ borderRight: "1px solid var(--rule, #1e1e1e)", paddingRight: "2.5rem", display: "flex", flexDirection: "column", justifyContent: "center", gap: 0 }}>

            {/* The label word */}
            <span
              className="font-condensed"
              style={{
                display: "block",
                fontSize: "clamp(4rem, 10vw, 8rem)",
                color: scoreVal > 0 ? scoreColor : "var(--text-muted)",
                letterSpacing: "-0.01em",
                lineHeight: 0.88,
                marginBottom: "1rem",
              }}
            >
              {scoreVal > 0 ? getLabel(scoreVal).toUpperCase() : "—"}
            </span>

            {/* Score number + grade letter */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "clamp(2rem, 3.5vw, 3rem)",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.06em",
                  lineHeight: 1,
                }}
              >
                {scoreVal}
              </span>
              <span
                className="font-condensed"
                style={{
                  fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)",
                  color: scoreColor,
                  letterSpacing: "-0.01em",
                  lineHeight: 1,
                }}
              >
                {getGrade(scoreVal)}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.04em" }}>
                / 100
              </span>
            </div>

            {/* Change indicator */}
            {change !== null ? (
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: change >= 0 ? "#22c55e" : "#f87171", letterSpacing: "0.02em" }}>
                {change >= 0 ? "↑" : "↓"} {Math.abs(change)} pts vs last period
              </p>
            ) : (
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Sustainability score
              </p>
            )}
          </div>

          {/* RIGHT — 3×2 metrics grid */}
          <div style={{ paddingLeft: "2.5rem", display: "flex", alignItems: "stretch" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", width: "100%" }}>
              {metrics.map((m, i) => {
                const col = i % 3;
                const row = Math.floor(i / 3);
                return (
                  <div
                    key={m.label}
                    style={{
                      borderLeft:   col > 0 ? "1px solid var(--rule, #1e1e1e)" : "none",
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
                );
              })}
            </div>
          </div>

        </div>
      </motion.div>

      {/* ── Green Router ──────────────────────────────────────────── */}
      <motion.div variants={item} style={{ marginBottom: "2.5rem" }}>
        <Sec>Green Router</Sec>
        <RoutingPipeline
          routedCount={routingStats.routed}
          downgradeCount={routingStats.downgraded}
          co2Avoided={routingStats.co2eAvoided}
          lastReceipts={receipts}
        />
      </motion.div>

      {/* ── Emissions chart + model breakdown ─────────────────────── */}
      <motion.div variants={item} style={{ borderTop: "1px solid var(--rule, #1e1e1e)", paddingTop: "2rem", marginBottom: "2.5rem" }}>
        <Sec>Emissions</Sec>
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-8" style={{ height: 440 }}>
            {emissionsData.length > 0
              ? <div style={{ height: "100%" }}><EmissionsChart data={emissionsData} /></div>
              : (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
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
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
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
        <motion.div variants={item} style={{ borderTop: "1px solid var(--rule, #1e1e1e)", paddingTop: "2rem", marginBottom: "2.5rem" }}>
          <Sec>Recent Activity</Sec>
          <ActivityTable receipts={receipts} />
        </motion.div>
      )}

      {/* ── Recommendations ───────────────────────────────────────── */}
      {sc.recommendations?.length > 0 && (
        <motion.div variants={item} style={{ borderTop: "1px solid var(--rule, #1e1e1e)", paddingTop: "2rem" }}>
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
