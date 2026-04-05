"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, RefreshCcw } from "lucide-react";
import { getAgentScores } from "@/lib/greenledger-api";
import { agentScores as mockAgents } from "@/lib/mock-data";

function ScoreBadge({ score }: { score: number | null }) {
  if (score == null) return <span style={{ color: "var(--text-muted)" }}>—</span>;
  const color = score >= 75 ? "var(--green-accent)" : score >= 50 ? "var(--amber-accent)" : "var(--red-accent)";
  return <span className="font-mono font-bold text-sm" style={{ color }}>{score}</span>;
}

function TrendBadge({ trend }: { trend: string | null }) {
  if (!trend) return <span style={{ color: "var(--text-muted)" }}>—</span>;
  const config: Record<string, { label: string; color: string }> = {
    on_track: { label: "On Track", color: "var(--green-accent)" },
    at_risk: { label: "At Risk", color: "var(--amber-accent)" },
    exceeded: { label: "Exceeded", color: "var(--red-accent)" },
  };
  const c = config[trend] || { label: trend, color: "var(--text-muted)" };
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium uppercase"
      style={{ color: c.color, backgroundColor: "var(--bg-secondary)" }}>{c.label}</span>
  );
}

function WalletBar({ pct }: { pct: number | null }) {
  if (pct == null) return <span className="text-xs" style={{ color: "var(--text-muted)" }}>No budget</span>;
  const color = pct >= 80 ? "var(--red-accent)" : pct >= 50 ? "var(--amber-accent)" : "var(--green-accent)";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "var(--border)" }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-mono w-8 text-right" style={{ color }}>{pct}%</span>
    </div>
  );
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>(mockAgents);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await getAgentScores();
      const data = Array.isArray(res.data) ? res.data : [];
      if (data.length > 0) { setAgents(data); setLive(true); }
    } catch { /* stay on mock */ }
    setLoading(false);
  };

  useEffect(() => { fetchAgents(); }, []);

  const sorted = [...agents].sort((a, b) => (b.sustainability_score ?? 0) - (a.sustainability_score ?? 0));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Agents</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Sustainability leaderboard across all AI agents
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: live ? "rgba(34,197,94,0.1)" : "rgba(90,117,101,0.15)", color: live ? "var(--green-accent)" : "var(--text-muted)" }}>
              {live ? "● Live" : "○ Mock"}
            </span>
          </p>
        </div>
        <button onClick={fetchAgents} className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border hover:opacity-80"
          style={{ borderColor: "var(--border-bright)", color: "var(--text-secondary)", backgroundColor: "var(--bg-card)" }}>
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
        <div className="grid grid-cols-[40px_1fr_100px_100px_100px_140px_100px_40px] px-5 py-3 text-xs font-medium uppercase tracking-wider border-b"
          style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}>
          <span>#</span><span>Agent</span><span className="text-right">Score</span>
          <span className="text-right">Inferences</span><span className="text-right">CO2e (g)</span>
          <span>Wallet Usage</span><span>Status</span><span></span>
        </div>

        {sorted.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            No agents yet — run queries in the CLI to see agents here.
          </div>
        ) : sorted.map((agent, i) => (
          <Link key={agent.agent_id} href={`/dashboard/agents/${agent.agent_id}`}
            className="grid grid-cols-[40px_1fr_100px_100px_100px_140px_100px_40px] px-5 py-3.5 text-sm items-center border-b transition-colors hover:brightness-110"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
            <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
            <div>
              <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{agent.display_name}</p>
              <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{agent.agent_id}</p>
            </div>
            <span className="text-right"><ScoreBadge score={agent.sustainability_score} /></span>
            <span className="text-right font-mono text-xs">{agent.total_inferences?.toLocaleString()}</span>
            <span className="text-right font-mono text-xs">{Number(agent.total_co2e_g).toFixed(1)}</span>
            <WalletBar pct={agent.wallet_utilization_pct} />
            <TrendBadge trend={agent.trend} />
            <span className="flex justify-end" style={{ color: "var(--text-muted)" }}><ArrowUpRight className="w-4 h-4" /></span>
          </Link>
        ))}
      </div>
    </div>
  );
}
