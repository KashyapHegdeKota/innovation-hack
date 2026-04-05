"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Cloud, Zap, Droplets, Bot } from "lucide-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import StatCard from "@/components/StatCard";
import EmissionsChart from "@/components/EmissionsChart";
import { agentScores, recentReceipts, emissionsOverTime } from "@/lib/mock-data";

const agentScoreComponents: Record<string, Record<string, number>> = {
  "procurement-agent-1": { "Carbon Eff.": 90, "Budget Adh.": 95, "Offset Cov.": 80, "Opt. Adopt.": 85, Trend: 90 },
  "research-agent-2": { "Carbon Eff.": 70, "Budget Adh.": 80, "Offset Cov.": 60, "Opt. Adopt.": 68, Trend: 82 },
  "research-agent-3": { "Carbon Eff.": 35, "Budget Adh.": 40, "Offset Cov.": 30, "Opt. Adopt.": 55, Trend: 65 },
  "support-agent-4": { "Carbon Eff.": 95, "Budget Adh.": 98, "Offset Cov.": 90, "Opt. Adopt.": 92, Trend: 95 },
};

function WalletGauge({ pct }: { pct: number | null }) {
  if (pct == null) return <p className="text-sm" style={{ color: "var(--text-muted)" }}>No wallet configured</p>;
  const color = pct >= 80 ? "var(--red-accent)" : pct >= 50 ? "var(--amber-accent)" : "var(--green-accent)";
  return (
    <div
      className="rounded-xl border p-5"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
        Carbon Wallet
      </h3>
      <div className="flex items-center gap-4">
        <div className="flex-1 h-3 rounded-full" style={{ backgroundColor: "var(--border)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
          />
        </div>
        <span className="font-mono text-lg font-bold" style={{ color }}>
          {pct}%
        </span>
      </div>
      <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
        {pct < 50 ? "Healthy budget remaining" : pct < 80 ? "Budget getting tight" : "Approaching budget limit"}
      </p>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AgentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const agent = agentScores.find((a) => a.agent_id === id);
  const agentReceipts = recentReceipts.filter((r) => r.agent_id === id);
  const components = agentScoreComponents[id] || {};
  const radarData = Object.entries(components).map(([key, value]) => ({
    metric: key,
    score: value,
    fullMark: 100,
  }));

  if (!agent) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/agents" className="flex items-center gap-1 text-sm" style={{ color: "var(--green-accent)" }}>
          <ArrowLeft className="w-4 h-4" /> Back to Agents
        </Link>
        <p style={{ color: "var(--text-muted)" }}>Agent not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/agents"
          className="flex items-center gap-1 text-sm mb-3 hover:opacity-80 transition-opacity"
          style={{ color: "var(--green-accent)" }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Agents
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          {agent.display_name}
        </h1>
        <p className="text-sm font-mono mt-1" style={{ color: "var(--text-muted)" }}>
          {agent.agent_id}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Sustainability Score" value={String(agent.sustainability_score ?? "—")} icon={Bot} />
        <StatCard label="Total CO2e" value={agent.total_co2e_g.toFixed(1)} unit="g" icon={Cloud} />
        <StatCard label="Energy" value={agent.total_energy_wh.toFixed(1)} unit="Wh" icon={Zap} />
        <StatCard label="Inferences" value={agent.total_inferences.toLocaleString()} icon={Droplets} />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div
          className="col-span-5 rounded-xl border p-5"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <h3 className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
            Score Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              />
              <Radar
                dataKey="score"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="col-span-7 space-y-4">
          <WalletGauge pct={agent.wallet_utilization_pct} />
          <EmissionsChart data={emissionsOverTime} title={`${agent.display_name} — Emissions`} />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
          Recent Receipts
        </h2>
        {agentReceipts.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No receipts for this agent yet.</p>
        ) : (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            {agentReceipts.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between px-5 py-3 border-b text-xs"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                <span className="font-mono">{formatDate(r.timestamp)}</span>
                <span>{r.model}</span>
                <span className="font-mono">{r.environmental_cost.co2e_g.toFixed(3)}g CO2e</span>
                <span className="font-mono">{r.environmental_cost.energy_wh.toFixed(2)} Wh</span>
                <span style={{ color: r.comparison?.savings_pct ? "var(--green-accent)" : "var(--text-muted)" }}>
                  {r.comparison?.savings_pct ? `-${r.comparison.savings_pct}%` : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
