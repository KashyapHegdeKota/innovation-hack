"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
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
import { getAgentScore, listReceipts } from "@/lib/greenledger-api";

function WalletGauge({ pct }: { pct: number | null }) {
  if (pct == null) return <p className="text-sm" style={{ color: "var(--text-muted)" }}>No wallet configured</p>;
  const color = pct >= 80 ? "var(--red-accent)" : pct >= 50 ? "var(--amber-accent)" : "var(--green-accent)";
  return (
    <div className="rounded-xl border p-5" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
      <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
        Carbon Wallet
      </h3>
      <div className="flex items-center gap-4">
        <div className="flex-1 h-3 rounded-full" style={{ backgroundColor: "var(--border)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
        </div>
        <span className="font-mono text-lg font-bold" style={{ color }}>{pct}%</span>
      </div>
      <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
        {pct < 50 ? "Healthy budget remaining" : pct < 80 ? "Budget getting tight" : "Approaching budget limit"}
      </p>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

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

        // Build emissions chart from real receipts
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
      <div className="space-y-4">
        <Link href="/dashboard/agents" className="flex items-center gap-1 text-sm" style={{ color: "var(--green-accent)" }}>
          <ArrowLeft className="w-4 h-4" /> Back to Agents
        </Link>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading...</p>
      </div>
    );
  }

  if (!agent || agent.total_inferences === 0) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/agents" className="flex items-center gap-1 text-sm" style={{ color: "var(--green-accent)" }}>
          <ArrowLeft className="w-4 h-4" /> Back to Agents
        </Link>
        <p style={{ color: "var(--text-muted)" }}>No data found for agent <span className="font-mono">{id}</span>.</p>
      </div>
    );
  }

  const score = agent.sustainability_score ?? 0;
  const radarData = [
    { metric: "Carbon Eff.", score: Math.min(100, score + 10), fullMark: 100 },
    { metric: "Budget Adh.", score: Math.min(100, score + 5), fullMark: 100 },
    { metric: "Offset Cov.", score: Math.max(0, score - 5), fullMark: 100 },
    { metric: "Opt. Adopt.", score, fullMark: 100 },
    { metric: "Trend", score: Math.min(100, score + 8), fullMark: 100 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/agents" className="flex items-center gap-1 text-sm mb-3 hover:opacity-80 transition-opacity" style={{ color: "var(--green-accent)" }}>
          <ArrowLeft className="w-4 h-4" /> Back to Agents
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          {agent.display_name || agent.agent_id}
        </h1>
        <p className="text-sm font-mono mt-1" style={{ color: "var(--text-muted)" }}>{agent.agent_id}</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Sustainability Score" value={String(score)} icon={Bot} />
        <StatCard label="Total CO2e" value={Number(agent.total_co2e_g).toFixed(3)} unit="g" icon={Cloud} />
        <StatCard label="Energy" value={Number(agent.total_energy_wh).toFixed(2)} unit="Wh" icon={Zap} />
        <StatCard label="Inferences" value={String(agent.total_inferences)} icon={Droplets} />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5 rounded-xl border p-5" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
          <h3 className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
            Score Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
              <Radar dataKey="score" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="col-span-7 space-y-4">
          <WalletGauge pct={agent.wallet_utilization_pct} />
          {emissionsData.length > 0
            ? <EmissionsChart data={emissionsData} title={`${agent.display_name || agent.agent_id} — Emissions`} />
            : <div className="rounded-xl border p-6 text-center text-sm" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-muted)" }}>No emissions data yet.</div>
          }
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
          Recent Receipts
        </h2>
        {receipts.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No receipts for this agent yet.</p>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
            {receipts.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3 border-b text-xs"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                <span className="font-mono">{formatDate(r.timestamp)}</span>
                <span>{r.model}</span>
                <span className="font-mono">{Number(r.environmental_cost.co2e_g).toFixed(4)}g CO2e</span>
                <span className="font-mono">{Number(r.environmental_cost.energy_wh).toFixed(3)} Wh</span>
                <span style={{ color: r.comparison?.savings_pct > 0 ? "var(--green-accent)" : "var(--text-muted)" }}>
                  {r.comparison?.savings_pct > 0 ? `+${r.comparison.savings_pct}%` : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
