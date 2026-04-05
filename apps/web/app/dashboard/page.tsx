"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Cloud, Zap, Droplets, DollarSign, TrendingDown, Bot } from "lucide-react";

import StatCard            from "@/components/StatCard";
import SustainabilityGauge from "@/components/SustainabilityGauge";
import EmissionsChart      from "@/components/EmissionsChart";
import ModelPieChart       from "@/components/ModelPieChart";
import RecommendationCard  from "@/components/RecommendationCard";
import RoutingPipeline     from "@/components/RoutingPipeline";
import ActivityTable       from "@/components/ActivityTable";

import { getDashboardSummary, getOrgScore, listReceipts } from "@/lib/greenledger-api";

const EMPTY_SUMMARY = {
  org_id: "", total_inferences: 0, total_co2e_g: 0, total_energy_wh: 0,
  total_water_ml: 0, total_levy_usd: 0, total_carbon_removed_g: 0,
  avg_savings_vs_naive_pct: 0, sustainability_score: 0, active_agents: 0,
  period_start: "", period_end: "",
};
const EMPTY_SCORE = { current_score: 0, previous_score: null, recommendations: [] };

const section = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as const } },
};

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
      <span className="label">{label}</span>
      <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
    </div>
  );
}

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
        setSummary(dashRes.data);
        setScore(scoreRes.data);
        setLive(true);

        const raw: any[] = Array.isArray(receiptsRes.data) ? receiptsRes.data : [];
        setReceipts(raw);

        const byDay: Record<string, { co2e: number; energy: number }> = {};
        raw.forEach((r: any) => {
          const day = new Date(r.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          if (!byDay[day]) byDay[day] = { co2e: 0, energy: 0 };
          byDay[day].co2e   += r.environmental_cost?.co2e_g  ?? 0;
          byDay[day].energy += r.environmental_cost?.energy_wh ?? 0;
        });
        setEmissionsData(Object.entries(byDay).map(([date, v]) => ({
          date,
          co2e:   Math.round(v.co2e   * 1000) / 1000,
          energy: Math.round(v.energy * 100)  / 100,
        })));

        const byModel: Record<string, number> = {};
        raw.forEach((r: any) => { if (r.model) byModel[r.model] = (byModel[r.model] || 0) + 1; });
        const COLORS = ["#22c55e", "#60a5fa", "#a855f7", "#f59e0b", "#f87171", "#ec4899"];
        setModelData(Object.entries(byModel).map(([name, value], i) => ({
          name: name.replace("claude-","").replace("gpt-","").replace("gemini-",""),
          value, color: COLORS[i % COLORS.length],
        })));

        const downgraded  = raw.filter((r: any) => r.requested_model && r.model && r.requested_model !== r.model).length;
        const co2eAvoided = raw.reduce((sum: number, r: any) =>
          sum + Math.max(0, (r.comparison?.naive_co2e_g ?? 0) - (r.environmental_cost?.co2e_g ?? 0)), 0);
        setRoutingStats({ routed: raw.length, downgraded, co2eAvoided });
      } catch { /* offline */ }
      setLoading(false);
    }
    load();
  }, []);

  const s  = summary;
  const sc = score;

  return (
    <motion.div
      className="space-y-8"
      initial="hidden" animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
    >

      {/* ── Header ─────────────────────────────────────────── */}
      <motion.div variants={section}>
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="font-black leading-none"
              style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.04em", color: "var(--text-primary)" }}
            >
              Overview
            </h1>
            {s.period_start && (
              <p className="label mt-1.5">
                {s.period_start} — {s.period_end} · {s.active_agents} active agent{s.active_agents !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          <span
            className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-medium"
            style={{
              backgroundColor: live ? "rgba(34,197,94,0.07)" : "var(--bg-card)",
              border: `1px solid ${live ? "rgba(34,197,94,0.15)" : "var(--border)"}`,
              color: live ? "var(--green-accent)" : "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            <span className={live ? "pulse-live" : ""} style={{ fontSize: "6px" }}>●</span>
            {loading ? "Connecting" : live ? "Live" : "Offline"}
          </span>
        </div>
      </motion.div>

      {/* ── Gauge + Metrics ─────────────────────────────────── */}
      <motion.div variants={section} className="grid grid-cols-12 gap-4">
        <div className="col-span-4">
          <SustainabilityGauge score={sc.current_score} previousScore={sc.previous_score} />
        </div>
        <div className="col-span-8 grid grid-cols-3 gap-4 content-start">
          <StatCard label="Total CO₂e"      value={Number(s.total_co2e_g).toFixed(3)}           unit="g"  icon={Cloud}        />
          <StatCard label="Energy"          value={Number(s.total_energy_wh).toFixed(2)}         unit="Wh" icon={Zap}          />
          <StatCard label="Water"           value={Number(s.total_water_ml).toFixed(1)}           unit="mL" icon={Droplets}     />
          <StatCard label="Carbon Levy"     value={"$" + Number(s.total_levy_usd).toFixed(5)}          icon={DollarSign}  />
          <StatCard label="Avg CO₂ Savings" value={Number(s.avg_savings_vs_naive_pct).toFixed(1)} unit="%" icon={TrendingDown} accent />
          <StatCard label="Inferences"      value={Number(s.total_inferences).toLocaleString()}        icon={Bot}         />
        </div>
      </motion.div>

      {/* ── Routing Pipeline ────────────────────────────────── */}
      <motion.div variants={section} className="space-y-3">
        <Divider label="Green Router" />
        <RoutingPipeline
          routedCount={routingStats.routed}
          downgradeCount={routingStats.downgraded}
          co2Avoided={routingStats.co2eAvoided}
          lastReceipts={receipts}
        />
      </motion.div>

      {/* ── Charts ──────────────────────────────────────────── */}
      <motion.div variants={section} className="space-y-3">
        <Divider label="Emissions data" />
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 flex flex-col">
            {emissionsData.length > 0 ? (
              <EmissionsChart data={emissionsData} />
            ) : (
              <div
                className="rounded-xl flex-1 flex items-center justify-center py-14 text-center"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    No emissions data yet
                  </p>
                  <p className="label">Run a CLI query to populate the timeline</p>
                </div>
              </div>
            )}
          </div>
          <div className="col-span-4 flex flex-col">
            {modelData.length > 0 ? (
              <ModelPieChart data={modelData} />
            ) : (
              <div
                className="rounded-xl flex-1 flex items-center justify-center p-8 text-center"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <p className="label">No model data yet</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Activity ────────────────────────────────────────── */}
      {receipts.length > 0 && (
        <motion.div variants={section} className="space-y-3">
          <Divider label="Recent activity" />
          <ActivityTable receipts={receipts} />
        </motion.div>
      )}

      {/* ── Recommendations ─────────────────────────────────── */}
      {sc.recommendations?.length > 0 && (
        <motion.div variants={section} className="space-y-3">
          <Divider label="Optimization insights" />
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
