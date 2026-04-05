"use client";

import { useEffect, useState } from "react";
import { Cloud, Zap, Droplets, DollarSign, TrendingDown, Bot } from "lucide-react";
import StatCard from "@/components/StatCard";
import SustainabilityGauge from "@/components/SustainabilityGauge";
import EmissionsChart from "@/components/EmissionsChart";
import ModelPieChart from "@/components/ModelPieChart";
import RecommendationCard from "@/components/RecommendationCard";
import { getDashboardSummary, getOrgScore, listReceipts } from "@/lib/greenledger-api";

const EMPTY_SUMMARY = {
  org_id: "", total_inferences: 0, total_co2e_g: 0, total_energy_wh: 0,
  total_water_ml: 0, total_levy_usd: 0, total_carbon_removed_g: 0,
  avg_savings_vs_naive_pct: 0, sustainability_score: 0, active_agents: 0,
  period_start: "", period_end: "",
};
const EMPTY_SCORE = { current_score: 0, previous_score: null, change: null, components: {}, recommendations: [] };

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(EMPTY_SUMMARY);
  const [score, setScore] = useState<any>(EMPTY_SCORE);
  const [emissionsData, setEmissionsData] = useState<any[]>([]);
  const [modelData, setModelData] = useState<any[]>([]);
  const [routingStats, setRoutingStats] = useState({ routed: 0, downgraded: 0, co2eAvoided: 0 });
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [dashRes, scoreRes, receiptsRes] = await Promise.all([
          getDashboardSummary(),
          getOrgScore(),
          listReceipts({ limit: 200 }),
        ]);
        setSummary(dashRes.data);
        setScore(scoreRes.data);
        setLive(true);

        const receipts: any[] = Array.isArray(receiptsRes.data) ? receiptsRes.data : [];

        // Build emissions over time from real receipts
        const byDay: Record<string, { co2e: number; energy: number }> = {};
        receipts.forEach((r: any) => {
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

        // Build model usage pie from real receipts
        const byModel: Record<string, number> = {};
        receipts.forEach((r: any) => { if (r.model) byModel[r.model] = (byModel[r.model] || 0) + 1; });
        const colors = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444", "#ec4899"];
        setModelData(Object.entries(byModel).map(([name, value], i) => ({
          name: name.replace("claude-", "").replace("gpt-", "").replace("gemini-", ""),
          value,
          color: colors[i % colors.length],
        })));

        // Compute routing impact from real receipts
        const downgraded = receipts.filter((r: any) =>
          r.requested_model && r.model && r.requested_model !== r.model
        ).length;
        const co2eAvoided = receipts.reduce((sum: number, r: any) =>
          sum + Math.max(0, (r.comparison?.naive_co2e_g ?? 0) - (r.environmental_cost?.co2e_g ?? 0)), 0
        );
        setRoutingStats({ routed: receipts.length, downgraded, co2eAvoided });
      } catch {
        // backend unavailable
      }
      setLoading(false);
    }
    fetchAll();
  }, []);

  const s = summary;
  const sc = score;
  const downgradePct = routingStats.routed > 0
    ? Math.round((routingStats.downgraded / routingStats.routed) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Overview</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {s.period_start && s.period_end ? `${s.period_start} — ${s.period_end} · ` : ""}
            {s.active_agents} active agent{s.active_agents !== 1 ? "s" : ""}
          </p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5"
          style={{ backgroundColor: live ? "rgba(34,197,94,0.1)" : "rgba(90,117,101,0.15)", color: live ? "var(--green-accent)" : "var(--text-muted)", border: `1px solid ${live ? "rgba(34,197,94,0.2)" : "rgba(90,117,101,0.2)"}` }}>
          <span className={live ? "pulse-live" : ""}>{loading ? "○" : live ? "●" : "○"}</span>
          {loading ? "Loading..." : live ? "Live" : "No data"}
        </span>
      </div>

      <div className="grid grid-cols-12 gap-4 items-stretch">
        <div className="col-span-3">
          <SustainabilityGauge score={sc.current_score} previousScore={sc.previous_score} />
        </div>
        <div className="col-span-9 grid grid-cols-3 gap-4 content-start">
          <StatCard label="Total CO2e"       value={Number(s.total_co2e_g).toFixed(3)}            unit="g"  icon={Cloud} />
          <StatCard label="Energy Consumed"  value={Number(s.total_energy_wh).toFixed(2)}          unit="Wh" icon={Zap} />
          <StatCard label="Water Usage"      value={Number(s.total_water_ml).toFixed(1)}            unit="mL" icon={Droplets} />
          <StatCard label="Carbon Levy"      value={"$" + Number(s.total_levy_usd).toFixed(5)}            icon={DollarSign} />
          <StatCard label="Avg CO2 Savings"  value={Number(s.avg_savings_vs_naive_pct).toFixed(1)}  unit="%" icon={TrendingDown} />
          <StatCard label="Total Inferences" value={Number(s.total_inferences).toLocaleString()}          icon={Bot} />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 items-stretch">
        <div className="col-span-8 flex flex-col">
          {emissionsData.length > 0
            ? <EmissionsChart data={emissionsData} />
            : <div className="rounded-xl border p-8 text-center text-sm flex-1 flex items-center justify-center"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                No emissions data yet — run a CLI query to see the chart.
              </div>
          }
        </div>
        <div className="col-span-4 flex flex-col">
          {modelData.length > 0
            ? <ModelPieChart data={modelData} />
            : <div className="rounded-xl border p-8 text-center text-sm flex-1 flex items-center justify-center"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                No model data yet.
              </div>
          }
        </div>
      </div>

      {/* Green Routing Impact banner */}
      {routingStats.routed > 0 && (
        <div className="relative rounded-xl border overflow-hidden p-5"
          style={{ backgroundColor: "rgba(34,197,94,0.04)", borderColor: "rgba(34,197,94,0.2)", boxShadow: "0 0 40px rgba(34,197,94,0.05) inset" }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(34,197,94,0.5), transparent)" }} />
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold" style={{ color: "var(--green-accent)" }}>⚡ Green Routing Impact</h3>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                {routingStats.downgraded} of {routingStats.routed} queries rerouted to greener models · 20% of savings funds carbon removal
              </p>
            </div>
            <div className="flex gap-8">
              {[
                { label: "Queries Rerouted", value: String(routingStats.downgraded) },
                { label: "CO2e Avoided",     value: `${routingStats.co2eAvoided.toFixed(3)}g` },
                { label: "Downgrade Rate",   value: `${downgradePct}%` },
              ].map((stat) => (
                <div key={stat.label} className="text-right">
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
                  <p className="text-xl font-bold font-mono gradient-text">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {sc.recommendations?.length > 0 && (
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Recommendations</h2>
          <div className="space-y-2">
            {sc.recommendations.map((rec: any) => (
              <RecommendationCard key={rec.id} title={rec.title} description={rec.description}
                savingsPct={rec.estimated_savings_pct} savingsCo2e={rec.estimated_savings_co2e_g} priority={rec.priority} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
