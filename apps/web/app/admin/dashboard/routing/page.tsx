"use client";

import { useEffect, useState } from "react";
import { ArrowDownRight, GitBranch, CheckCircle, XCircle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import { listReceipts } from "@/lib/greenledger-api";
import { DUMMY_AGENTS } from "@/lib/dummy-agents";
import { routingIntelligence as mockRouting } from "@/lib/admin-mock-data";

function shortModel(m: string) {
  return m.replace("claude-", "").replace("gpt-", "").replace("gemini-", "");
}

const REJECTION_COLORS = ["#f59e0b", "#3b82f6", "#a855f7", "#ef4444"];

export default function AdminRoutingPage() {
  const [live, setLive] = useState(false);
  const [totalDecisions, setTotalDecisions] = useState(0);
  const [suggested, setSuggested] = useState(0);
  const [accepted, setAccepted] = useState(0);
  const [rejected, setRejected] = useState(0);
  const [acceptRate, setAcceptRate] = useState(0);
  const [topDowngrades, setTopDowngrades] = useState<any[]>([]);
  const [rejectionReasons] = useState(mockRouting.rejection_reasons);

  useEffect(() => {
    async function load() {
      try {
        const res = await listReceipts({ limit: 200 });
        setLive(true);
        const raw: any[] = Array.isArray(res.data) ? res.data : [];

        // Compute from live + dummy
        const dummyDecisions = DUMMY_AGENTS.flatMap(a => a.decisions);
        const allTotal = raw.length + dummyDecisions.length;

        // Live downgrades: requested_model !== model
        const liveDowngrades = raw.filter((r: any) => r.requested_model && r.model && r.requested_model !== r.model);
        const dummyAccepted = dummyDecisions.filter(d => d.accepted_recommendation);
        const totalAccepted = liveDowngrades.length + dummyAccepted.length;
        // "Suggested" = cases where router had an opinion (for live, if requested_model exists it means router analyzed it)
        const liveSuggested = raw.filter((r: any) => r.requested_model).length;
        const dummySuggested = dummyDecisions.filter(d => d.assessment === "overkill" || d.assessment === "underpowered").length;
        const totalSuggested = liveSuggested + dummySuggested;
        const totalRejected = totalSuggested - totalAccepted;
        const rate = totalSuggested > 0 ? Math.round((totalAccepted / totalSuggested) * 100) : mockRouting.acceptance_rate_pct;

        setTotalDecisions(allTotal);
        setSuggested(totalSuggested);
        setAccepted(totalAccepted);
        setRejected(Math.max(0, totalRejected));
        setAcceptRate(rate);

        // Build downgrade map
        const downgradeMap: Record<string, { count: number; co2e_avoided_g: number }> = {};
        liveDowngrades.forEach((r: any) => {
          const key = `${r.requested_model}→${r.model}`;
          if (!downgradeMap[key]) downgradeMap[key] = { count: 0, co2e_avoided_g: 0 };
          downgradeMap[key].count++;
          downgradeMap[key].co2e_avoided_g += Math.max(0, (r.comparison?.naive_co2e_g ?? 0) - (r.environmental_cost?.co2e_g ?? 0));
        });
        // Add dummy downgrades
        dummyDecisions.filter(d => d.accepted_recommendation && d.assessment === "overkill").forEach(d => {
          const key = `${d.user_selected.model}→${d.final_model}`;
          if (!downgradeMap[key]) downgradeMap[key] = { count: 0, co2e_avoided_g: 0 };
          downgradeMap[key].count++;
          downgradeMap[key].co2e_avoided_g += Math.max(0, d.user_selected.co2e_g - d.recommended.co2e_g);
        });

        const computed = Object.entries(downgradeMap)
          .map(([key, v]) => {
            const [from, to] = key.split("→");
            return { from, to, count: v.count, co2e_avoided_g: v.co2e_avoided_g, savings_usd: 0 };
          })
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setTopDowngrades(computed.length > 0 ? computed : mockRouting.top_downgrades);
      } catch {
        setTotalDecisions(mockRouting.total_routing_decisions);
        setSuggested(mockRouting.downgrades_suggested);
        setAccepted(mockRouting.downgrades_accepted);
        setRejected(mockRouting.downgrades_suggested - mockRouting.downgrades_accepted);
        setAcceptRate(mockRouting.acceptance_rate_pct);
        setTopDowngrades(mockRouting.top_downgrades);
      }
    }
    load();
  }, []);

  const downgradeSavingsChart = topDowngrades.map((d: any) => ({
    route: `${shortModel(d.from)} → ${shortModel(d.to)}`,
    count: d.count,
    co2e_g: +d.co2e_avoided_g.toFixed(3),
  }));

  return (
    <div className="max-w-[1200px] mx-auto space-y-8">
      <div className="fade-up">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <GitBranch className="w-5 h-5" style={{ color: "var(--blue-accent)" }} />
              <h1 className="text-xl font-black" style={{ letterSpacing: "-0.03em" }}>Routing Intelligence</h1>
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>How the Green Router optimizes model selection</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: live ? "#22c55e" : "#525252", boxShadow: live ? "0 0 6px #22c55e" : "none", animation: "pulse-green 2s ease-in-out infinite" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase" as const, color: live ? "#22c55e" : "var(--text-muted)" }}>
              {live ? "Live" : "Mock"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card p-5 fade-up-1">
          <span className="label">Total Decisions</span>
          <p className="text-2xl font-black mt-2" style={{ color: "var(--text-primary)" }}>{totalDecisions.toLocaleString()}</p>
        </div>
        <div className="card p-5 fade-up-2">
          <span className="label">Downgrades Suggested</span>
          <p className="text-2xl font-black mt-2" style={{ color: "var(--amber-accent)" }}>{suggested.toLocaleString()}</p>
        </div>
        <div className="card p-5 fade-up-3">
          <span className="label">Accepted</span>
          <p className="text-2xl font-black mt-2" style={{ color: "var(--green-accent)" }}>{accepted.toLocaleString()}</p>
          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "var(--green-accent)" }}>
            <CheckCircle className="w-3 h-3" />{acceptRate}% rate
          </p>
        </div>
        <div className="card p-5 fade-up-4">
          <span className="label">Rejected</span>
          <p className="text-2xl font-black mt-2" style={{ color: "var(--red-accent)" }}>{rejected.toLocaleString()}</p>
          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "var(--red-accent)" }}>
            <XCircle className="w-3 h-3" />{(100 - acceptRate).toFixed(0)}% rate
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5 fade-up-1">
          <span className="label">Top Downgrade Routes — by CO₂e Avoided</span>
          <div className="mt-4" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={downgradeSavingsChart} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis dataKey="route" type="category" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} tickLine={false} axisLine={false} width={140} />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" }} />
                <Bar dataKey="co2e_g" fill="#22c55e" radius={[0, 4, 4, 0]} name="CO₂e Avoided (g)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5 fade-up-2">
          <span className="label">Why Users Reject Downgrades</span>
          <div className="flex items-center mt-4">
            <div style={{ width: 180, height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={rejectionReasons} dataKey="pct" nameKey="reason" cx="50%" cy="50%" outerRadius={80} innerRadius={40} stroke="var(--bg-card)" strokeWidth={2}>
                    {rejectionReasons.map((_: any, i: number) => <Cell key={i} fill={REJECTION_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3 pl-4">
              {rejectionReasons.map((r: any, i: number) => (
                <div key={r.reason} className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: REJECTION_COLORS[i] }} />
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{r.reason}</span>
                  <span className="text-xs font-mono ml-auto" style={{ color: "var(--text-muted)" }}>{r.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5 fade-up-3">
        <span className="label">All Downgrade Routes — Detailed</span>
        <div className="mt-4">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["From → To", "Count", "CO₂e Avoided"].map(h => (
                  <th key={h} className="pb-2 text-left text-[10px] font-mono uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topDowngrades.map((d: any, i: number) => (
                <tr key={i} className="transition-colors"
                  style={{ borderBottom: i < topDowngrades.length - 1 ? "1px solid var(--border)" : undefined }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--hover-bg)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                  <td className="py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{shortModel(d.from)}</span>
                      <ArrowDownRight className="w-3 h-3" style={{ color: "var(--green-accent)" }} />
                      <span className="text-xs font-mono" style={{ color: "var(--green-accent)" }}>{shortModel(d.to)}</span>
                    </div>
                  </td>
                  <td className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{d.count.toLocaleString()}</td>
                  <td className="text-xs font-mono" style={{ color: "var(--green-accent)" }}>{d.co2e_avoided_g.toFixed(3)}g</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
