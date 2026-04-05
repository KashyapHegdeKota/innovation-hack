"use client";

import { useEffect, useState } from "react";
import { Cloud, Zap, Droplets, DollarSign, TrendingDown, Bot } from "lucide-react";
import StatCard from "@/components/StatCard";
import SustainabilityGauge from "@/components/SustainabilityGauge";
import EmissionsChart from "@/components/EmissionsChart";
import ModelPieChart from "@/components/ModelPieChart";
import RecommendationCard from "@/components/RecommendationCard";
import { getDashboardSummary, getOrgScore, listReceipts } from "@/lib/greenledger-api";
import { dashboardSummary as mockSummary, orgScore as mockScore, emissionsOverTime, modelUsage } from "@/lib/mock-data";

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(mockSummary);
  const [score, setScore] = useState<any>(mockScore);
  const [emissionsData, setEmissionsData] = useState(emissionsOverTime);
  const [modelData, setModelData] = useState(modelUsage);
  const [live, setLive] = useState(false);

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

        // Build emissions over time from receipts
        const receipts: any[] = Array.isArray(receiptsRes.data) ? receiptsRes.data : [];
        if (receipts.length > 0) {
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

          // Build model pie from receipts
          const byModel: Record<string, number> = {};
          receipts.forEach((r: any) => { byModel[r.model] = (byModel[r.model] || 0) + 1; });
          const colors = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444", "#ec4899"];
          setModelData(Object.entries(byModel).map(([name, value], i) => ({
            name: name.replace("claude-", "").replace("gpt-", ""),
            value,
            color: colors[i % colors.length],
          })));
        }
      } catch {
        // Backend not running — stay on mock data
      }
    }
    fetchAll();
  }, []);

  const s = summary;
  const sc = score;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {s.period_start} — {s.period_end} &middot; {s.active_agents} active agents
          </p>
        </div>
        <span
          className="text-xs px-2.5 py-1 rounded-full font-medium"
          style={{
            backgroundColor: live ? "rgba(34,197,94,0.1)" : "rgba(90,117,101,0.15)",
            color: live ? "var(--green-accent)" : "var(--text-muted)",
          }}
        >
          {live ? "● Live" : "○ Mock data"}
        </span>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <SustainabilityGauge score={sc.current_score} previousScore={sc.previous_score} />
        </div>
        <div className="col-span-9 grid grid-cols-3 gap-4">
          <StatCard label="Total CO2e" value={Number(s.total_co2e_g).toFixed(1)} unit="g" icon={Cloud} trend={-12.4} trendInverted />
          <StatCard label="Energy Consumed" value={Number(s.total_energy_wh).toFixed(1)} unit="Wh" icon={Zap} trend={-8.2} trendInverted />
          <StatCard label="Water Usage" value={Number(s.total_water_ml).toFixed(0)} unit="mL" icon={Droplets} trend={-5.1} trendInverted />
          <StatCard label="Carbon Levy" value={"$" + Number(s.total_levy_usd).toFixed(4)} icon={DollarSign} />
          <StatCard label="Avg Savings vs Naive" value={Number(s.avg_savings_vs_naive_pct).toFixed(1)} unit="%" icon={TrendingDown} trend={4.2} />
          <StatCard label="Total Inferences" value={Number(s.total_inferences).toLocaleString()} icon={Bot} trend={15.8} />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8">
          <EmissionsChart data={emissionsData} />
        </div>
        <div className="col-span-4">
          <ModelPieChart data={modelData} />
        </div>
      </div>

      {sc.recommendations?.length > 0 && (
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
            Recommendations
          </h2>
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
        </div>
      )}
    </div>
  );
}
