"use client";

import { useState, useEffect } from "react";
import { Leaf, DollarSign, CheckCircle, Clock, AlertCircle, ArrowRight, PiggyBank, TrendingDown, RefreshCcw } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import StatCard from "@/components/StatCard";
import { listReceipts, getDashboardSummary } from "@/lib/greenledger-api";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  confirmed: { label: "Confirmed", color: "var(--green-accent)",  icon: CheckCircle },
  pooled:    { label: "Pooled",    color: "var(--amber-accent)",  icon: Clock },
  pending:   { label: "Pending",   color: "var(--text-muted)",    icon: AlertCircle },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function LevyPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [receiptsRes, summaryRes] = await Promise.all([
        listReceipts({ limit: 200 }),
        getDashboardSummary(),
      ]);
      const data: any[] = Array.isArray(receiptsRes.data) ? receiptsRes.data : [];
      setReceipts(data);
      setSummary(summaryRes.data);
      setLive(true);
    } catch { /* backend unavailable */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Compute levy stats from receipts
  const totalLevyUsd = receipts.reduce((s, r) => s + (r.offset?.levy_usd ?? 0), 0);
  const totalCo2eAvoided = receipts.reduce((s, r) => {
    const naive = r.comparison?.naive_co2e_g ?? 0;
    const actual = r.environmental_cost?.co2e_g ?? 0;
    return s + Math.max(0, naive - actual);
  }, 0);
  const totalSavingsUsd = receipts.reduce((s, r) => s + (r.savings?.savings_usd ?? 0), 0);
  const confirmedPct = receipts.length > 0
    ? Math.round((receipts.filter(r => r.offset?.status === "confirmed").length / receipts.length) * 100)
    : 0;

  // Levy over time (by day)
  const byDay: Record<string, number> = {};
  receipts.forEach(r => {
    const day = new Date(r.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    byDay[day] = (byDay[day] ?? 0) + (r.offset?.levy_usd ?? 0);
  });
  const levyOverTime = Object.entries(byDay).map(([date, levy]) => ({
    date, levy: Math.round(levy * 1e6) / 1e6,
    removed: Math.round(levy * 0.2 * 1e3) / 1e3,
  }));

  // Pie — levy status breakdown
  const statusCounts = { confirmed: 0, pooled: 0, pending: 0 };
  receipts.forEach(r => {
    const s = r.offset?.status as keyof typeof statusCounts;
    if (s in statusCounts) statusCounts[s]++;
  });
  const total = receipts.length || 1;
  const pieData = [
    { name: "Confirmed", value: Math.round((statusCounts.confirmed / total) * 100), color: "#22c55e" },
    { name: "Pooled",    value: Math.round((statusCounts.pooled    / total) * 100), color: "#f59e0b" },
    { name: "Pending",   value: Math.round((statusCounts.pending   / total) * 100), color: "#5a7565" },
  ].filter(d => d.value > 0);

  // Top model downgrade routes by levy generated
  const routeMap: Record<string, { from: string; to: string; savings_usd: number; levy_usd: number }> = {};
  receipts.forEach(r => {
    if (r.requested_model && r.model && r.requested_model !== r.model) {
      const key = `${r.requested_model}→${r.model}`;
      if (!routeMap[key]) routeMap[key] = { from: r.requested_model, to: r.model, savings_usd: 0, levy_usd: 0 };
      routeMap[key].levy_usd += r.offset?.levy_usd ?? 0;
      routeMap[key].savings_usd += r.savings?.savings_usd ?? 0;
    }
  });
  const topRoutes = Object.values(routeMap)
    .sort((a, b) => b.levy_usd - a.levy_usd)
    .slice(0, 5)
    .map(r => ({
      from: r.from.replace("claude-", "").replace("gpt-", ""),
      to:   r.to.replace("claude-", "").replace("gpt-", ""),
      levy_usd: Math.round(r.levy_usd * 1e6) / 1e6,
    }));

  // Destinations from receipts
  const destMap: Record<string, { name: string; amount_usd: number; status: string; co2_removed: number }> = {};
  receipts.forEach(r => {
    const dest = r.offset?.destination ?? "unknown";
    if (!destMap[dest]) destMap[dest] = { name: dest.replace(/_/g, " "), amount_usd: 0, status: r.offset?.status ?? "pending", co2_removed: 0 };
    destMap[dest].amount_usd += r.offset?.levy_usd ?? 0;
    destMap[dest].co2_removed += (r.offset?.levy_usd ?? 0) * 200; // ~200g removed per $1
  });
  const destinations = Object.values(destMap);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Carbon Levy</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Micro-levies routed to verified carbon removal via Stripe Climate
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: live ? "rgba(34,197,94,0.1)" : "rgba(90,117,101,0.15)", color: live ? "var(--green-accent)" : "var(--text-muted)" }}>
              {live ? "● Live" : "○ Mock"}
            </span>
          </p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border hover:opacity-80"
          style={{ borderColor: "var(--border-bright)", color: "var(--text-secondary)", backgroundColor: "var(--bg-card)" }}>
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Levy"    value={`$${totalLevyUsd.toFixed(6)}`}           icon={DollarSign} />
        <StatCard label="API Cost Saved" value={`$${totalSavingsUsd.toFixed(4)}`}        icon={PiggyBank} />
        <StatCard label="CO2e Avoided"  value={totalCo2eAvoided.toFixed(3)}  unit="g"  icon={TrendingDown} />
        <StatCard label="Confirmed"     value={`${confirmedPct}%`}                        icon={CheckCircle} />
      </div>

      {/* How the Levy Works */}
      <div className="rounded-xl border p-5" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
        <h3 className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
          How the Carbon Levy Works
        </h3>
        <div className="flex items-center justify-between gap-3">
          {[
            { label: "User Selects",   value: "Opus 4.6",       sub: "$0.075/query",      color: "var(--text-secondary)" },
            { label: "Router Picks",   value: "Haiku 4.5",      sub: "$0.002/query",       color: "var(--green-accent)" },
            { label: "You Save",       value: "$0.073",          sub: "per query",          color: "var(--green-accent)" },
            { label: "20% Levy",       value: "$0.0146",         sub: "to carbon removal",  color: "var(--amber-accent)" },
            { label: "Stripe Climate", value: "Carbon Removed",  sub: "Frontier portfolio", color: "var(--green-accent)" },
          ].map((step, i, arr) => (
            <div key={step.label} className="flex items-center gap-3">
              <div className="rounded-lg border p-3 text-center min-w-[120px]"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-secondary)" }}>
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>{step.label}</p>
                <p className="text-sm font-bold font-mono" style={{ color: step.color }}>{step.value}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{step.sub}</p>
              </div>
              {i < arr.length - 1 && <ArrowRight className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Top downgrade routes */}
      {topRoutes.length > 0 ? (
        <div className="rounded-xl border p-5" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
          <h3 className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
            Top Model Downgrades by Levy Generated
          </h3>
          <ResponsiveContainer width="100%" height={Math.max(120, topRoutes.length * 50)}>
            <BarChart data={topRoutes} layout="vertical" margin={{ left: 180 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} tickLine={false}
                tickFormatter={(v) => `$${v.toFixed(5)}`} />
              <YAxis type="category" dataKey="from" tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                axisLine={false} tickLine={false} width={170}
                tickFormatter={(v: string, i: number) => {
                  const route = topRoutes[i];
                  return route ? `${v} → ${route.to}` : v;
                }} />
              <Tooltip contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-bright)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "12px" }}
                formatter={(value) => [`$${Number(value).toFixed(6)}`, "Levy"]} />
              <Bar dataKey="levy_usd" radius={[0, 4, 4, 0]} fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="rounded-xl border p-8 text-center text-sm"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
          No model downgrades yet — levy is generated when the router switches to a greener model.
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-12 gap-4">
        {/* Levy over time */}
        <div className="col-span-8 rounded-xl border p-5" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
          <h3 className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
            Levy Over Time
          </h3>
          {levyOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={levyOverTime}>
                <defs>
                  <linearGradient id="levyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-bright)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "12px" }}
                  formatter={(value) => [`$${Number(value).toFixed(6)}`, "Levy (USD)"]} />
                <Area type="monotone" dataKey="levy" stroke="#22c55e" strokeWidth={2} fill="url(#levyGrad)" name="Levy (USD)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
              No levy data yet — run queries to generate levy.
            </div>
          )}
        </div>

        {/* Status pie + destinations */}
        <div className="col-span-4 space-y-4">
          <div className="rounded-xl border p-5" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
            <h3 className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Levy Status</h3>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                      dataKey="value" strokeWidth={2} stroke="var(--bg-card)">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-1">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{d.name} {d.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[160px] flex items-center justify-center text-xs" style={{ color: "var(--text-muted)" }}>No data</div>
            )}
          </div>

          <div className="rounded-xl border p-5" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
            <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Destinations</h3>
            {destinations.length > 0 ? (
              <div className="space-y-3">
                {destinations.map((d) => {
                  const s = statusConfig[d.status] ?? statusConfig.pending;
                  return (
                    <div key={d.name} className="flex items-start gap-3">
                      <s.icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: s.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium capitalize" style={{ color: "var(--text-primary)" }}>{d.name}</p>
                        <div className="flex gap-3 mt-0.5">
                          <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>${d.amount_usd.toFixed(6)}</span>
                          <span className="text-[10px] font-mono" style={{ color: "var(--green-accent)" }}>{d.co2_removed.toFixed(3)}g est. removed</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>No destinations yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Transaction log */}
      <div>
        <h2 className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
          Recent Levy Transactions
        </h2>
        <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="grid grid-cols-[1fr_1fr_100px_100px_1fr_100px] px-5 py-3 text-xs font-medium uppercase tracking-wider border-b"
            style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}>
            <span>Time</span><span>Agent</span>
            <span className="text-right">Amount</span><span className="text-right">CO2e</span>
            <span>Destination</span><span>Status</span>
          </div>
          {receipts.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              No levy transactions yet — run queries in the CLI.
            </div>
          ) : receipts.map((r) => {
            const s = statusConfig[r.offset?.status] ?? statusConfig.pending;
            return (
              <div key={r.id} className="grid grid-cols-[1fr_1fr_100px_100px_1fr_100px] px-5 py-3 text-xs items-center border-b"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                <span className="font-mono">{formatTime(r.timestamp)}</span>
                <span className="truncate">{r.agent_id}</span>
                <span className="text-right font-mono">${(r.offset?.levy_usd ?? 0).toFixed(6)}</span>
                <span className="text-right font-mono">{(r.environmental_cost?.co2e_g ?? 0).toFixed(3)}g</span>
                <span className="truncate">{(r.offset?.destination ?? "—").replace(/_/g, " ")}</span>
                <span className="flex items-center gap-1.5">
                  <s.icon className="w-3 h-3" style={{ color: s.color }} />
                  <span style={{ color: s.color }}>{s.label}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
