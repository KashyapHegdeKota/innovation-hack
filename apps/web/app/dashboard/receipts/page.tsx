"use client";

import { useState, useEffect } from "react";
import { Download, ChevronDown, ChevronUp, RefreshCcw } from "lucide-react";
import { listReceipts } from "@/lib/greenledger-api";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function ProviderBadge({ provider }: { provider: string }) {
  const colors: Record<string, string> = { anthropic: "#d97706", openai: "#22c55e", google: "#3b82f6" };
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium uppercase"
      style={{ color: colors[provider] || "var(--text-muted)", backgroundColor: "var(--bg-secondary)" }}>
      {provider}
    </span>
  );
}

function SavingsBadge({ pct }: { pct: number }) {
  const color = pct >= 70 ? "var(--green-accent)" : pct >= 30 ? "var(--amber-accent)" : "var(--red-accent)";
  return <span className="text-xs font-mono font-medium" style={{ color }}>{pct > 0 ? `+${pct}%` : "0%"}</span>;
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const res = await listReceipts({ limit: 100 });
      const data = Array.isArray(res.data) ? res.data : [];
      setReceipts(data);
      setLive(true);
    } catch { /* backend unavailable */ }
    setLoading(false);
  };

  useEffect(() => { fetchReceipts(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Receipts</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Environmental receipts for every AI inference
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: live ? "rgba(34,197,94,0.1)" : "rgba(90,117,101,0.15)", color: live ? "var(--green-accent)" : "var(--text-muted)" }}>
              {live ? "● Live" : "○ Mock"}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchReceipts} className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border transition-colors hover:opacity-80"
            style={{ borderColor: "var(--border-bright)", color: "var(--text-secondary)", backgroundColor: "var(--bg-card)" }}>
            <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border transition-colors hover:opacity-80"
            style={{ borderColor: "var(--border-bright)", color: "var(--text-secondary)", backgroundColor: "var(--bg-card)" }}>
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border transition-colors hover:opacity-80"
            style={{ borderColor: "var(--border-bright)", color: "var(--text-secondary)", backgroundColor: "var(--bg-card)" }}>
            <Download className="w-3.5 h-3.5" /> Export JSON
          </button>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
        <div className="grid grid-cols-[1fr_1fr_1fr_80px_80px_90px_80px_70px_40px] px-5 py-3 text-xs font-medium uppercase tracking-wider border-b"
          style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}>
          <span>Time</span><span>Agent</span><span>Model</span>
          <span className="text-right">CO2e</span><span className="text-right">Energy</span>
          <span className="text-right">Water</span><span className="text-right">Levy</span>
          <span className="text-right">Savings</span><span></span>
        </div>

        {receipts.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            No receipts yet — run a query in the CLI to see data here.
          </div>
        ) : receipts.map((r: any) => (
          <div key={r.id}>
            <div className="grid grid-cols-[1fr_1fr_1fr_80px_80px_90px_80px_70px_40px] px-5 py-3 text-sm items-center border-b cursor-pointer transition-colors hover:brightness-110"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)", backgroundColor: expandedId === r.id ? "var(--bg-card-hover)" : "transparent" }}
              onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
              <span className="font-mono text-xs">{formatTime(r.timestamp)}</span>
              <span className="truncate text-xs">{r.agent_id}</span>
              <span className="flex items-center gap-2 text-xs">{r.model} <ProviderBadge provider={r.provider} /></span>
              <span className="text-right font-mono text-xs">{Number(r.environmental_cost?.co2e_g ?? 0).toFixed(3)}g</span>
              <span className="text-right font-mono text-xs">{Number(r.environmental_cost?.energy_wh ?? 0).toFixed(2)} Wh</span>
              <span className="text-right font-mono text-xs">{Number(r.environmental_cost?.water_ml ?? 0).toFixed(2)} mL</span>
              <span className="text-right font-mono text-xs">${Number(r.offset?.levy_usd ?? 0).toFixed(5)}</span>
              <span className="text-right"><SavingsBadge pct={r.comparison?.savings_pct ?? 0} /></span>
              <span className="flex justify-end" style={{ color: "var(--text-muted)" }}>
                {expandedId === r.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </div>
            {expandedId === r.id && (
              <div className="px-5 py-4 border-b text-xs grid grid-cols-3 gap-4"
                style={{ backgroundColor: "var(--bg-card-hover)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                <div>
                  <p className="font-medium mb-1" style={{ color: "var(--text-muted)" }}>Tokens</p>
                  <p className="font-mono">In: {r.tokens_in?.toLocaleString()} &middot; Out: {r.tokens_out?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium mb-1" style={{ color: "var(--text-muted)" }}>Carbon Offset</p>
                  <p className="font-mono">{r.offset?.destination} &middot;
                    <span style={{ color: r.offset?.status === "confirmed" ? "var(--green-accent)" : "var(--amber-accent)" }}>
                      {" "}{r.offset?.status}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1" style={{ color: "var(--text-muted)" }}>vs Naive Baseline</p>
                  <p className="font-mono">Naive: {Number(r.comparison?.naive_co2e_g ?? 0).toFixed(3)}g &middot; Saved:
                    <span style={{ color: "var(--green-accent)" }}> {r.comparison?.savings_pct ?? 0}%</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
