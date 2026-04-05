"use client";

import {
  Cloud,
  Zap,
  Droplets,
  DollarSign,
  TrendingDown,
  Bot,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import SustainabilityGauge from "@/components/SustainabilityGauge";
import EmissionsChart from "@/components/EmissionsChart";
import ModelPieChart from "@/components/ModelPieChart";
import RecommendationCard from "@/components/RecommendationCard";
import {
  dashboardSummary,
  orgScore,
  emissionsOverTime,
  modelUsage,
} from "@/lib/mock-data";

export default function DashboardPage() {
  const s = dashboardSummary;
  const score = orgScore;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {s.period_start} — {s.period_end} &middot; {s.active_agents} active agents
        </p>
      </div>

      {/* Top row: Score + Stat cards */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <SustainabilityGauge
            score={score.current_score}
            previousScore={score.previous_score}
          />
        </div>
        <div className="col-span-9 grid grid-cols-3 gap-4">
          <StatCard
            label="Total CO2e"
            value={s.total_co2e_g.toFixed(1)}
            unit="g"
            icon={Cloud}
            trend={-12.4}
            trendInverted
          />
          <StatCard
            label="Energy Consumed"
            value={s.total_energy_wh.toFixed(1)}
            unit="Wh"
            icon={Zap}
            trend={-8.2}
            trendInverted
          />
          <StatCard
            label="Water Usage"
            value={s.total_water_ml.toFixed(0)}
            unit="mL"
            icon={Droplets}
            trend={-5.1}
            trendInverted
          />
          <StatCard
            label="Carbon Levy"
            value={"$" + s.total_levy_usd.toFixed(2)}
            icon={DollarSign}
          />
          <StatCard
            label="Avg Savings vs Naive"
            value={s.avg_savings_vs_naive_pct.toFixed(1)}
            unit="%"
            icon={TrendingDown}
            trend={4.2}
          />
          <StatCard
            label="Total Inferences"
            value={s.total_inferences.toLocaleString()}
            icon={Bot}
            trend={15.8}
          />
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8">
          <EmissionsChart data={emissionsOverTime} />
        </div>
        <div className="col-span-4">
          <ModelPieChart data={modelUsage} />
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h2 className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
          Recommendations
        </h2>
        <div className="space-y-2">
          {score.recommendations.map((rec) => (
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
    </div>
  );
}
