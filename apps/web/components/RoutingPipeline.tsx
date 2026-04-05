"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PipelineProps {
  routedCount: number;
  downgradeCount: number;
  co2Avoided: number;
  lastReceipts?: any[];
}

interface Decision {
  requested: string;
  selected: string;
  rerouted: boolean;
  co2Requested: number;
  co2Selected: number;
  prompt: string;
  idx: number;
}

const FALLBACK: Decision[] = [
  { idx: 0, requested: "claude-opus-4-6",   selected: "claude-haiku-4-5", rerouted: true,  co2Requested: 1.14, co2Selected: 0.06, prompt: "Summarize this quarterly earnings report" },
  { idx: 1, requested: "gpt-4-turbo",        selected: "claude-haiku-3",   rerouted: true,  co2Requested: 1.08, co2Selected: 0.08, prompt: "Translate this paragraph to French" },
  { idx: 2, requested: "claude-3-5-sonnet",  selected: "claude-3-5-sonnet",rerouted: false, co2Requested: 0.85, co2Selected: 0.85, prompt: "Refactor this React component to use hooks" },
  { idx: 3, requested: "gpt-4o",             selected: "claude-haiku-3",   rerouted: true,  co2Requested: 0.72, co2Selected: 0.08, prompt: "Write a short email responding to this thread" },
];

export default function RoutingPipeline({ routedCount, downgradeCount, co2Avoided, lastReceipts = [] }: PipelineProps) {
  const decisions: Decision[] = lastReceipts.length > 0
    ? lastReceipts.slice(0, 6).map((r: any, i: number) => ({
        idx: i,
        requested:    r.requested_model || r.model || "claude-3-5-sonnet",
        selected:     r.model || "claude-haiku-3",
        rerouted:     !!(r.requested_model && r.model && r.requested_model !== r.model),
        co2Requested: r.comparison?.naive_co2e_g  ?? 0.85,
        co2Selected:  r.environmental_cost?.co2e_g ?? 0.08,
        prompt:       r.prompt_preview || "AI inference request",
      }))
    : FALLBACK;

  const [idx,     setIdx]     = useState(0);
  const [phase,   setPhase]   = useState<"in" | "verdict" | "out">("in");
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const cycle = () => {
      setPhase("in");
      timerRef.current = setTimeout(() => setPhase("verdict"), 1400);
      timerRef.current = setTimeout(() => setPhase("out"), 3800);
      timerRef.current = setTimeout(() => {
        setIdx(i => (i + 1) % decisions.length);
        setPhase("in");
      }, 4400);
    };
    cycle();
    const interval = setInterval(cycle, 4400);
    return () => { clearInterval(interval); clearTimeout(timerRef.current); };
  }, [decisions.length]);

  const d = decisions[idx % decisions.length];
  const maxCo2 = Math.max(d.co2Requested, d.co2Selected, 0.01);
  const savedPct = d.rerouted ? Math.round((1 - d.co2Selected / d.co2Requested) * 100) : 0;

  return (
    <div style={{ fontFamily: "var(--font-mono)" }}>

      {/* ── Request feed ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`prompt-${idx}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.35 }}
          className="flex items-baseline gap-3 mb-5"
        >
          <span style={{ fontSize: "10px", color: "#22c55e", letterSpacing: "0.12em", textTransform: "uppercase", flexShrink: 0 }}>
            ● Routing
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            "{d.prompt}"
          </span>
          <span style={{ fontSize: "9px", color: "#2a2a2a", flexShrink: 0 }}>#{routedCount > 0 ? routedCount - idx : idx + 1}</span>
        </motion.div>
      </AnimatePresence>

      {/* ── Side-by-side decision ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "1rem", alignItems: "stretch", marginBottom: "1.5rem" }}>

        {/* LEFT — Requested */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          key={`left-${idx}`}
          style={{
            padding: "1.25rem",
            borderRadius: "10px",
            border: `1px solid ${d.rerouted ? "rgba(248,113,113,0.15)" : "var(--border)"}`,
            backgroundColor: d.rerouted ? "rgba(248,113,113,0.04)" : "var(--bg-card)",
          }}
        >
          <p style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: d.rerouted ? "rgba(248,113,113,0.5)" : "var(--text-muted)", marginBottom: "0.5rem" }}>
            Requested
          </p>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem", letterSpacing: "-0.02em" }}>
            {d.requested}
          </p>
          {/* CO₂ bar */}
          <div>
            <div style={{ height: "3px", borderRadius: "2px", backgroundColor: "#1a1a1a", marginBottom: "6px", overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(d.co2Requested / maxCo2) * 100}%` }}
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ height: "100%", borderRadius: "2px", backgroundColor: d.rerouted ? "#f87171" : "var(--text-muted)" }}
              />
            </div>
            <p style={{ fontSize: "11px", color: d.rerouted ? "#f87171" : "var(--text-muted)", letterSpacing: "-0.02em" }}>
              {d.co2Requested.toFixed(3)}g CO₂e
            </p>
          </div>
        </motion.div>

        {/* CENTER — arrow / verdict */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.25rem", width: 40 }}>
          <AnimatePresence mode="wait">
            {phase === "verdict" || phase === "out" ? (
              <motion.div
                key="verdict"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{ textAlign: "center" }}
              >
                {d.rerouted ? (
                  <>
                    <p style={{ fontSize: "14px", color: "#22c55e" }}>→</p>
                    <p style={{ fontSize: "8px", color: "#22c55e", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2 }}>saved</p>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: "14px", color: "#22c55e" }}>✓</p>
                    <p style={{ fontSize: "8px", color: "#22c55e", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2 }}>optimal</p>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.p
                key="arrow"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ fontSize: "14px", color: "#2a2a2a" }}
              >
                →
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT — Selected */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`right-${idx}-${phase}`}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: phase === "in" ? 0.3 : 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: phase === "verdict" ? 0.1 : 0 }}
            style={{
              padding: "1.25rem",
              borderRadius: "10px",
              border: `1px solid ${d.rerouted ? "rgba(34,197,94,0.2)" : "var(--border)"}`,
              backgroundColor: d.rerouted ? "rgba(34,197,94,0.04)" : "var(--bg-card)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <p style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: d.rerouted ? "rgba(34,197,94,0.6)" : "var(--text-muted)" }}>
                Selected
              </p>
              {d.rerouted && (phase === "verdict" || phase === "out") && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ fontSize: "9px", color: "#22c55e", letterSpacing: "0.08em", textTransform: "uppercase" }}
                >
                  −{savedPct}% CO₂
                </motion.span>
              )}
            </div>
            <p style={{ fontSize: "13px", fontWeight: 700, color: d.rerouted ? "#22c55e" : "var(--text-primary)", marginBottom: "1rem", letterSpacing: "-0.02em" }}>
              {d.selected}
            </p>
            {/* CO₂ bar */}
            <div>
              <div style={{ height: "3px", borderRadius: "2px", backgroundColor: "#1a1a1a", marginBottom: "6px", overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(d.co2Selected / maxCo2) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  style={{ height: "100%", borderRadius: "2px", backgroundColor: d.rerouted ? "#22c55e" : "var(--text-muted)" }}
                />
              </div>
              <p style={{ fontSize: "11px", color: d.rerouted ? "#22c55e" : "var(--text-muted)", letterSpacing: "-0.02em" }}>
                {d.co2Selected.toFixed(3)}g CO₂e
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Stats strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: "1px solid #1a1a1a" }}>
        {[
          { label: "Total Routed",  value: String(routedCount)           },
          { label: "Rerouted",      value: String(downgradeCount)        },
          { label: "CO₂ Avoided",  value: `${co2Avoided.toFixed(2)}g`   },
        ].map((s, i) => (
          <div
            key={s.label}
            style={{
              padding: "1rem 0",
              textAlign: i === 0 ? "left" : i === 2 ? "right" : "center",
              borderLeft: i > 0 ? "1px solid #1a1a1a" : "none",
              paddingLeft: i > 0 ? "1.5rem" : 0,
              paddingRight: i < 2 ? "1.5rem" : 0,
            }}
          >
            <p style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#2e2e2e", marginBottom: "4px" }}>
              {s.label}
            </p>
            <p style={{ fontFamily: "var(--font-condensed)", fontSize: "1.8rem", color: i === 2 ? "#22c55e" : "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1 }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
