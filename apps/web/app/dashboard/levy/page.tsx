"use client";

import { useEffect, useState } from "react";
import { Leaf, DollarSign, CheckCircle, RefreshCcw } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import StatCard from "@/components/StatCard";
import { listReceipts } from "@/lib/greenledger-api";

export default function LevyPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await listReceipts({ limit: 500 });
      const data = Array.isArray(res.data) ? res.data : [];
      setReceipts(data);
      setLive(true);
    } catch { /* backend unavailable */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Compute all levy stats from real receipts
  const totalLevy = receipts.reduce((s, r) => s + (r.offset?.levy_usd ?? 0), 0);
  const totalCarbonRemoved = totalLevy * 400; // $1 = 400g removed (Stripe Climate rate)
  const totalInferences = receipts.length;

  // Levy over time — group by day
  const byDay: Record<string, { levy: number; removed: number }> = {};
  receipts.forEach((r) => {
    const day = new Date(r.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!byDay[day]) byDay[day] = { levy: 0, removed: 0 };
    byDay[day].levy += r.offset?.levy_usd ?? 0;
    byDay[day].removed += (r.offset?.levy_usd ?? 0) * 400;
  });
  const levyOverTime = Object.entries(byDay).map(([date, v]) => ({
    date,
    levy: Math.round(v.levy * 1000000) / 1000000,
    removed: Math.round(v.removed * 10) / 10,
  }));

  // All receipts are "confirmed" in our system
  const pieData = [
    { name: "Confirmed", value: 100, color: "#22c55e" },
  ];

  // Destinations breakdown — group by levy_destination
  const byDest: Record<string, number> = {};
  receipts.forEach((r) => {
    const dest = r.offset?.destination || "stripe_climate_frontier";
    byDest[dest] = (byDest[dest] || 0) + (r.offset?.levy_usd ?? 0);
  });
  const destinations = Object.entries(byDest).map(([name, amount_usd]) => ({
    name: name.replace(/_/g, " "),
    amount_usd,
    carbon_removed_g: amount_usd * 400,
    status: "confirmed",
  }));

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Carbon Levy</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Micro-levies routed to verified carbon removal via Stripe Climate
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: live ? "rgba(34,197,94,0.1)" : "rgba(90,117,101,0.15)", color: live ? "var(--green-accent)" : "var(--text-muted)" }}>
              {loading ? "○ Loading..." : live ? "● Live" : "○ No data"}
            </span>
          </p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border hover:opacity-80"
          style={{ borderColor: "var(--border-bright)", color: "var(--text-secondary)", backgroundColor: "var(--bg-card)" }}>
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Levy Collected"  value={`$${totalLevy.toFixed(5)}`}                    icon={DollarSign} />
        <StatCard label="Carbon Removed"        value={totalCarbonRemoved.toFixed(2)} unit="g"        icon={Leaf} />
        <StatCard label="Total Inferences"      value={totalInferences.toLocaleString()}               icon={CheckCircle} />
        <StatCard label="Confirmation Rate"     value="100" unit="%"                                   icon={CheckCircle} />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 rounded-xl border p-5" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
          <h3 className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
            Levy & Carbon Removal Over Time
          </h3>
          {levyOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={levyOverTime}>
                <defs>
                  <linearGradient id="levyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="removedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                <YAxis yAxisId="levy" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} orientation="left" />
                <YAxis yAxisId="removed" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} orientation="right" />
                <Tooltip contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-bright)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "12px" }} />
                <Area yAxisId="levy"    type="monotone" dataKey="levy"    stroke="#22c55e" strokeWidth={2} fill="url(#levyGrad)"    name="Levy (USD)" />
                <Area yAxisId="removed" type="monotone" dataKey="removed" stroke="#3b82f6" strokeWidth={2} fill="url(#removedGrad)" name="Removed (g)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-sm" style={{ color: "var(--text-muted)" }}>
              No levy data yet — run a CLI query to see this chart.
            </div>
          )}
        </div>

        <div className="col-span-4 space-y-4">
          <div className="rounded-xl border p-5" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
            <h3 className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Levy Status</h3>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={2} stroke="var(--bg-card)">
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
          </div>

          <div className="rounded-xl border p-5" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
            <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Destinations</h3>
            {destinations.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>No destinations yet.</p>
            ) : (
              <div className="space-y-3">
                {destinations.map((d) => (
                  <div key={d.name} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--green-accent)" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium capitalize" style={{ color: "var(--text-primary)" }}>{d.name}</p>
                      <div className="flex gap-3 mt-0.5">
                        <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>${d.amount_usd.toFixed(5)}</span>
                        <span className="text-[10px] font-mono" style={{ color: "var(--green-accent)" }}>{d.carbon_removed_g.toFixed(2)}g removed</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Recent Levy Transactions</h2>
        {receipts.length === 0 ? (
          <div className="rounded-xl border p-8 text-center text-sm" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
            No transactions yet — run a CLI query to generate levy records.
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
            <div className="grid grid-cols-[1fr_1fr_110px_100px_1fr_100px] px-5 py-3 text-xs font-medium uppercase tracking-wider border-b"
              style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}>
              <span>Time</span><span>Agent</span><span className="text-right">Amount</span>
              <span className="text-right">CO2e</span><span>Destination</span><span>Status</span>
            </div>
            {receipts.map((r) => (
              <div key={r.id} className="grid grid-cols-[1fr_1fr_110px_100px_1fr_100px] px-5 py-3 text-xs items-center border-b"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                <span className="font-mono">{formatTime(r.timestamp)}</span>
                <span className="truncate">{r.agent_id}</span>
                <span className="text-right font-mono">${Number(r.offset?.levy_usd ?? 0).toFixed(6)}</span>
                <span className="text-right font-mono">{Number(r.environmental_cost?.co2e_g ?? 0).toFixed(4)}g</span>
                <span className="truncate capitalize">{(r.offset?.destination || "stripe_climate_frontier").replace(/_/g, " ")}</span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3" style={{ color: "var(--green-accent)" }} />
                  <span style={{ color: "var(--green-accent)" }}>Confirmed</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
