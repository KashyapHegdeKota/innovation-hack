"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, RefreshCcw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import apiClient from "@/lib/api-client";
import { DUMMY_AGENTS, LIVE_AGENT_STUB, type DummyDecision } from "@/lib/dummy-agents";

const ASSESSMENT: Record<string, { label: string; color: string }> = {
  overkill:     { label: "Overkill",     color: "#f87171" },
  appropriate:  { label: "Appropriate",  color: "#22c55e" },
  underpowered: { label: "Underpowered", color: "#f59e0b" },
};

const TIER_COLORS: Record<string, string> = {
  nano: "#06b6d4", light: "#22c55e", standard: "#3b82f6", heavy: "#ef4444", reasoning: "#ec4899",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function short(m: string) {
  return m.replace("claude-", "").replace("gpt-", "").replace("gemini-", "");
}

const item = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const } },
};

// All selectable agents: live first, then dummies
const ALL_AGENTS = [LIVE_AGENT_STUB, ...DUMMY_AGENTS];

export default function RouterPage() {
  const [selectedAgentId, setSelectedAgentId] = useState<string>("cli-user");
  const [liveDecisions,   setLiveDecisions]   = useState<any[]>([]);
  const [live,            setLive]            = useState(false);
  const [loading,         setLoading]         = useState(true);
  const [expandedId,      setExpandedId]      = useState<string | null>(null);

  const fetchDecisions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/v1/router/decisions");
      setLiveDecisions(Array.isArray(res.data) ? res.data : []);
      setLive(true);
    } catch { /* offline */ }
    setLoading(false);
  };

  useEffect(() => { fetchDecisions(); }, []);

  // When switching agents, collapse any expanded row
  useEffect(() => { setExpandedId(null); }, [selectedAgentId]);

  // Determine which decisions to show
  const isDummy   = selectedAgentId !== "cli-user";
  const dummyAgent = DUMMY_AGENTS.find(a => a.agent_id === selectedAgentId);
  const decisions: any[] = isDummy
    ? (dummyAgent?.decisions ?? [])
    : liveDecisions;

  const total      = decisions.length;
  const overkill   = decisions.filter(d => d.assessment === "overkill").length;
  const accepted   = decisions.filter(d => d.accepted_recommendation).length;
  const avgSavings = total > 0
    ? Math.round(decisions.reduce((a, d) => a + (d.savings_if_switched_pct || 0), 0) / total)
    : 0;

  return (
    <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <motion.div variants={item} className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-black" style={{ fontSize: "1.75rem", letterSpacing: "-0.04em", color: "var(--text-primary)", lineHeight: 1 }}>
            Green Router
          </h1>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "5px" }}>
            Every routing decision — why a model was picked and what alternatives were considered
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5" style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: live ? "#22c55e" : "var(--text-muted)" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: live ? "#22c55e" : "var(--text-muted)", display: "inline-block", animation: "pulse-green 2s ease-in-out infinite" }} />
            {live ? "Live" : "Offline"}
          </span>
          <button
            onClick={fetchDecisions}
            className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70"
            style={{ border: "1px solid var(--border)", color: "var(--text-muted)", backgroundColor: "transparent", fontFamily: "var(--font-mono)" }}
          >
            <RefreshCcw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </motion.div>

      {/* ── Agent selector ─────────────────────────────────────── */}
      <motion.div variants={item} style={{ marginBottom: "2rem" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.75rem" }}>
          Agent
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {ALL_AGENTS.map(agent => {
            const isActive = agent.agent_id === selectedAgentId;
            const dummy    = DUMMY_AGENTS.find(d => d.agent_id === agent.agent_id);
            const score    = dummy?.sustainability_score ?? null;
            const scoreColor = score == null ? "var(--text-muted)"
              : score >= 75 ? "#22c55e"
              : score >= 50 ? "#f59e0b"
              : "#f87171";

            return (
              <button
                key={agent.agent_id}
                onClick={() => setSelectedAgentId(agent.agent_id)}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  padding: "0.4rem 0.9rem",
                  borderRadius: "6px",
                  border: isActive ? `1px solid ${scoreColor}` : "1px solid var(--border)",
                  backgroundColor: isActive ? `${scoreColor}12` : "transparent",
                  color: isActive ? scoreColor : "var(--text-muted)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {agent.agent_id === "cli-user" && (
                  <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: live ? "#22c55e" : "var(--text-muted)", display: "inline-block" }} />
                )}
                {agent.display_name}
                {score !== null && (
                  <span style={{ fontSize: "9px", opacity: 0.7 }}>{score}</span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Stat strip ─────────────────────────────────────────── */}
      <motion.div variants={item} style={{ borderBottom: "1px solid var(--rule)", borderTop: "1px solid var(--rule)", padding: "1.25rem 0", marginBottom: "2rem" }}>
        <div className="flex items-stretch">
          {[
            { label: "Total Decisions",           value: String(total),         accent: false },
            { label: "Overkill Detected",         value: String(overkill),      accent: false },
            { label: "Recommendation Accepted",   value: String(accepted),      accent: false },
            { label: "Avg CO₂ Savings",           value: `+${avgSavings}%`,     accent: true  },
          ].map((s, i) => (
            <div key={s.label} className="flex items-stretch gap-0 flex-1">
              <div className="flex-1">
                <p style={{ fontFamily: "var(--font-condensed)", fontSize: "clamp(2rem, 3.5vw, 3rem)", color: s.accent ? "#22c55e" : "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 0.9, marginBottom: "5px" }}>
                  {s.value}
                </p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {s.label}
                </p>
              </div>
              {i < 3 && <div style={{ width: "1px", backgroundColor: "var(--rule)", margin: "0 2rem", alignSelf: "stretch" }} />}
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Decision list ───────────────────────────────────────── */}
      <motion.div variants={item}>
        {decisions.length === 0 ? (
          <div style={{ padding: "4rem 0", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
              No routing decisions yet — run queries via CLI to populate
            </p>
          </div>
        ) : (
          <div style={{ borderTop: "1px solid var(--rule)" }}>
            {decisions.map((d: any) => {
              const a        = ASSESSMENT[d.assessment] || ASSESSMENT.appropriate;
              const expanded = expandedId === d.id;
              const rerouted = d.user_selected?.model !== d.final_model;

              return (
                <div key={d.id}>
                  <div
                    onClick={() => setExpandedId(expanded ? null : d.id)}
                    className="cursor-pointer"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto auto auto",
                      gap: "1.25rem",
                      alignItems: "center",
                      padding: "1rem 0",
                      borderBottom: "1px solid var(--rule)",
                      borderLeft: `2px solid ${expanded ? a.color : "transparent"}`,
                      paddingLeft: expanded ? "1rem" : "2px",
                      transition: "all 0.15s ease",
                      backgroundColor: expanded ? "var(--hover-bg)" : "transparent",
                    }}
                  >
                    {/* Assessment */}
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 700,
                      letterSpacing: "0.12em", textTransform: "uppercase",
                      color: a.color, flexShrink: 0, width: 80,
                    }}>
                      {a.label}
                    </span>

                    {/* Prompt */}
                    <span style={{
                      fontFamily: "var(--font-display)", fontSize: "13px",
                      color: "var(--text-primary)", overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {d.prompt_preview || "(no preview)"}
                    </span>

                    {/* Model routing */}
                    <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                        {short(d.user_selected?.model || d.final_model)}
                      </span>
                      {rerouted && (
                        <>
                          <span style={{ color: "var(--text-dim)", fontSize: "10px" }}>→</span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#22c55e", fontWeight: 700 }}>
                            {short(d.final_model)}
                          </span>
                        </>
                      )}
                      {!rerouted && (
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-dim)" }}>no change</span>
                      )}
                    </div>

                    {/* CO₂ savings */}
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: "11px", flexShrink: 0,
                      color: d.accepted_recommendation ? "#22c55e" : "var(--text-dim)",
                      width: 60, textAlign: "right",
                    }}>
                      {d.accepted_recommendation && d.savings_if_switched_pct > 0 ? `−${d.savings_if_switched_pct}%` : "—"}
                    </span>

                    {/* Time + chevron */}
                    <div className="flex items-center gap-3" style={{ flexShrink: 0 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-dim)" }}>
                        {fmt(d.timestamp)}
                      </span>
                      {expanded
                        ? <ChevronUp  className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                        : <ChevronDown className="w-3.5 h-3.5" style={{ color: "var(--text-dim)" }} />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                        style={{ overflow: "hidden", borderBottom: "1px solid var(--rule)" }}
                      >
                        <div style={{ padding: "1.5rem 0 1.5rem 1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>

                          {/* Left: model comparison */}
                          <div>
                            <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: "1rem" }}>
                              Model Comparison
                            </p>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                              {[
                                { label: "Requested", model: d.user_selected?.model, co2: d.user_selected?.co2e_g, energy: d.user_selected?.energy_wh, green: false },
                                { label: "Routed To", model: d.recommended?.model || d.final_model, co2: d.recommended?.co2e_g, energy: d.recommended?.energy_wh, green: true },
                              ].map((m) => (
                                <div key={m.label} style={{
                                  padding: "1rem", borderRadius: "8px",
                                  border: `1px solid ${m.green ? "rgba(34,197,94,0.2)" : "var(--border)"}`,
                                  backgroundColor: m.green ? "rgba(34,197,94,0.03)" : "var(--hover-bg)",
                                }}>
                                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: m.green ? "rgba(34,197,94,0.6)" : "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
                                    {m.label}
                                  </p>
                                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 700, color: m.green ? "#22c55e" : "var(--text-primary)", marginBottom: "0.75rem", letterSpacing: "-0.02em" }}>
                                    {m.model ? short(m.model) : "—"}
                                  </p>
                                  <div style={{ display: "flex", gap: "1rem" }}>
                                    <div>
                                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: m.green ? "#22c55e" : "var(--text-muted)" }}>{m.co2 ?? "—"}g</p>
                                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>CO₂e</p>
                                    </div>
                                    <div>
                                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>{m.energy ?? "—"} Wh</p>
                                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Energy</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {d.savings_if_switched_pct > 0 && (
                              <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#22c55e", marginTop: "0.75rem" }}>
                                ↓ {d.savings_if_switched_pct}% CO₂ reduction{d.accepted_recommendation ? " · accepted" : " · not accepted"}
                              </p>
                            )}
                          </div>

                          {/* Right: alternatives chart */}
                          {d.alternatives?.length > 0 && (
                            <div>
                              <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: "1rem" }}>
                                Alternatives — Energy (Wh)
                              </p>
                              <ResponsiveContainer width="100%" height={Math.min(d.alternatives.length * 36 + 20, 200)}>
                                <BarChart data={d.alternatives} layout="vertical" margin={{ left: 90, right: 16, top: 0, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="var(--rule)" horizontal={false} />
                                  <XAxis type="number" tick={{ fill: "var(--text-dim)", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                                  <YAxis type="category" dataKey="model" tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "monospace" }}
                                    axisLine={false} tickLine={false} width={85} tickFormatter={(v: string) => short(v)} />
                                  <Tooltip
                                    contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "11px", fontFamily: "monospace" }}
                                    formatter={(val: any) => [`${val} Wh`, "Energy"]}
                                  />
                                  <Bar dataKey="energy_wh" radius={[0, 3, 3, 0]}>
                                    {d.alternatives?.map((alt: any, i: number) => (
                                      <Cell key={i} fill={TIER_COLORS[alt.tier] || "#3b82f6"} fillOpacity={alt.model === d.final_model ? 1 : 0.35} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

    </motion.div>
  );
}
