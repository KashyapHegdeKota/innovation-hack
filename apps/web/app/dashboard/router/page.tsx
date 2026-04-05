"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Check, X, ArrowRight, RefreshCcw } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import apiClient from "@/lib/api-client";

const assessmentConfig: Record<string, { label: string; color: string; bg: string }> = {
  overkill:     { label: "Overkill",      color: "var(--red-accent)",   bg: "rgba(239,68,68,0.1)"  },
  appropriate:  { label: "Appropriate",   color: "var(--green-accent)", bg: "rgba(34,197,94,0.1)"  },
  underpowered: { label: "Underpowered",  color: "var(--amber-accent)", bg: "rgba(245,158,11,0.1)" },
};

const tierColors: Record<string, string> = {
  nano: "#06b6d4", light: "#22c55e", standard: "#3b82f6", heavy: "#ef4444", reasoning: "#ec4899",
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function shortModel(m: string) {
  return m.replace("claude-", "").replace("gpt-", "").replace("gemini-", "");
}

export default function RouterPage() {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchDecisions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/v1/router/decisions");
      const data = Array.isArray(res.data) ? res.data : [];
      setDecisions(data);
      setLive(true);
    } catch { /* backend unavailable */ }
    setLoading(false);
  };

  useEffect(() => { fetchDecisions(); }, []);

  const total = decisions.length;
  const overkillCount = decisions.filter((d) => d.assessment === "overkill").length;
  const acceptedCount = decisions.filter((d) => d.accepted_recommendation).length;
  const avgSavings = decisions.length > 0
    ? Math.round(decisions.reduce((a, d) => a + (d.savings_if_switched_pct || 0), 0) / decisions.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Green Router</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Every routing decision — why a model was picked and what alternatives were considered
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: live ? "rgba(34,197,94,0.1)" : "rgba(90,117,101,0.15)", color: live ? "var(--green-accent)" : "var(--text-muted)" }}>
              {live ? "● Live" : "○ Mock"}
            </span>
          </p>
        </div>
        <button onClick={fetchDecisions} className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border hover:opacity-80"
          style={{ borderColor: "var(--border-bright)", color: "var(--text-secondary)", backgroundColor: "var(--bg-card)" }}>
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Decisions",              value: total },
          { label: "Overkill Detected",            value: overkillCount },
          { label: "Router Recommendation Taken",  value: acceptedCount },
          { label: "Avg CO2 Savings",              value: `+${avgSavings}%` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-4"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            <p className="text-xl font-bold font-mono" style={{ color: "var(--text-primary)" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Decision list */}
      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
        {decisions.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            No routing decisions yet — run queries in the CLI to see them here.
          </div>
        ) : decisions.map((d) => {
          const a = assessmentConfig[d.assessment] || assessmentConfig.appropriate;
          const expanded = expandedId === d.id;
          const wasRerouted = d.user_selected?.model !== d.final_model;

          return (
            <div key={d.id}>
              <div
                className="px-5 py-4 border-b cursor-pointer transition-colors hover:brightness-110 flex items-center gap-4"
                style={{ borderColor: "var(--border)", backgroundColor: expanded ? "var(--bg-card-hover)" : "transparent" }}
                onClick={() => setExpandedId(expanded ? null : d.id)}
              >
                {/* Assessment badge */}
                <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase shrink-0"
                  style={{ color: a.color, backgroundColor: a.bg }}>
                  {a.label}
                </span>

                {/* Prompt */}
                <span className="flex-1 text-sm truncate" style={{ color: "var(--text-primary)" }}>
                  {d.prompt_preview || "(no preview)"}
                </span>

                {/* Model flow */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono px-2 py-0.5 rounded"
                    style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
                    {shortModel(d.user_selected?.model || d.final_model)}
                  </span>
                  {wasRerouted && (
                    <>
                      <ArrowRight className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
                      <span className="text-xs font-mono px-2 py-0.5 rounded font-medium"
                        style={{ backgroundColor: "rgba(34,197,94,0.15)", color: "var(--green-accent)" }}>
                        {shortModel(d.final_model)}
                      </span>
                    </>
                  )}
                </div>

                {/* Accepted */}
                <span className="shrink-0">
                  {d.accepted_recommendation
                    ? <Check className="w-4 h-4" style={{ color: "var(--green-accent)" }} />
                    : <X className="w-4 h-4" style={{ color: "var(--red-accent)" }} />}
                </span>

                {/* Time */}
                <span className="text-xs font-mono shrink-0" style={{ color: "var(--text-muted)" }}>
                  {formatTime(d.timestamp)}
                </span>

                <span style={{ color: "var(--text-muted)" }}>
                  {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </div>

              {/* Expanded detail */}
              {expanded && (
                <div className="px-5 py-5 border-b space-y-5"
                  style={{ backgroundColor: "var(--bg-card-hover)", borderColor: "var(--border)" }}>
                  {/* Comparison */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-secondary)" }}>
                      <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>User Selected</p>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{d.user_selected?.model || "—"}</p>
                      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                        {d.user_selected?.provider} · {d.user_selected?.tier}
                      </p>
                      <div className="flex gap-3 mt-2">
                        <span className="text-xs font-mono" style={{ color: "var(--amber-accent)" }}>{d.user_selected?.energy_wh} Wh</span>
                        <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{d.user_selected?.co2e_g}g CO2e</span>
                      </div>
                    </div>
                    <div className="rounded-lg border p-4"
                      style={{ borderColor: "var(--green-accent)", borderWidth: "1.5px", backgroundColor: "rgba(34,197,94,0.05)" }}>
                      <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--green-accent)" }}>Routed To</p>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{d.recommended?.model || d.final_model}</p>
                      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                        {d.recommended?.provider} · {d.recommended?.tier}
                      </p>
                      <div className="flex gap-3 mt-2">
                        <span className="text-xs font-mono" style={{ color: "var(--green-accent)" }}>{d.recommended?.energy_wh} Wh</span>
                        <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{d.recommended?.co2e_g}g CO2e</span>
                      </div>
                    </div>
                    <div className="rounded-lg border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-secondary)" }}>
                      <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Result</p>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {d.accepted_recommendation ? "Rerouted ✓" : "No change"}
                      </p>
                      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Final: {d.final_model}</p>
                      {d.savings_if_switched_pct > 0 && (
                        <p className="text-xs font-mono mt-2" style={{ color: "var(--green-accent)" }}>
                          +{d.savings_if_switched_pct}% CO2 saved
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Alternatives chart */}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                      Alternatives — Energy per Query (Wh)
                    </p>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={d.alternatives} layout="vertical" margin={{ left: 120 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                        <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                        <YAxis type="category" dataKey="model" tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                          axisLine={false} tickLine={false} width={110}
                          tickFormatter={(v: string) => shortModel(v)} />
                        <Tooltip contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-bright)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "12px" }}
                          formatter={(value) => [`${value} Wh`, "Energy"]} />
                        <Bar dataKey="energy_wh" radius={[0, 4, 4, 0]}>
                          {d.alternatives?.map((alt: any, i: number) => (
                            <Cell key={i} fill={tierColors[alt.tier] || "#8b5cf6"}
                              fillOpacity={alt.model === d.final_model ? 1 : 0.5} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
