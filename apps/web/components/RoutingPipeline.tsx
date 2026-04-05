"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PipelineProps {
  routedCount: number;
  downgradeCount: number;
  co2Avoided: number;
  lastReceipts?: any[];
}

const NODE_LABELS = {
  prompt:   { top: "INPUT",         main: "User Prompt",    color: "var(--teal)" },
  router:   { top: "ENGINE",        main: "Green Router",   color: "var(--green)" },
  model:    { top: "SELECTED",      main: "Greener Model",  color: "var(--green-bright)" },
  response: { top: "OUTPUT",        main: "Response",       color: "var(--teal)" },
};

function Node({
  type, active, color
}: { type: keyof typeof NODE_LABELS; active: boolean; color: string }) {
  const info = NODE_LABELS[type];
  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.div
        animate={active ? {
          boxShadow: [
            `0 0 12px ${color}44`,
            `0 0 28px ${color}88`,
            `0 0 12px ${color}44`,
          ],
          borderColor: [
            `${color}33`,
            `${color}99`,
            `${color}33`,
          ],
        } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="relative rounded-xl px-4 py-2.5 text-center min-w-[110px]"
        style={{
          backgroundColor: active ? `${color}0d` : "var(--bg-card)",
          border: `1px solid ${active ? `${color}44` : "var(--border)"}`,
        }}
      >
        {active && (
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${color}88, transparent)` }}
          />
        )}
        <p className="terminal-label mb-0.5">{info.top}</p>
        <p className="text-[11px] font-semibold" style={{ color: active ? color : "var(--text-secondary)", fontFamily: "var(--font-display)" }}>
          {info.main}
        </p>
      </motion.div>
    </div>
  );
}

function Connector({
  active, color = "var(--green)", rejected = false
}: { active: boolean; color?: string; rejected?: boolean }) {
  return (
    <div className="relative flex items-center" style={{ width: "60px", height: "32px" }}>
      {/* Track line */}
      <div
        className="absolute inset-x-0"
        style={{
          top: "50%",
          height: "1px",
          background: rejected
            ? "rgba(239,68,68,0.2)"
            : "var(--border-bright)",
          transform: "translateY(-50%)",
        }}
      />
      {/* Animated glow line */}
      {active && !rejected && (
        <motion.div
          className="absolute inset-x-0"
          style={{ top: "50%", height: "2px", transform: "translateY(-50%)", originX: 0 }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: [0, 1], opacity: [0, 1, 0.8] }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div
            style={{
              width: "100%", height: "100%",
              background: `linear-gradient(90deg, ${color}88, ${color})`,
              boxShadow: `0 0 6px ${color}`,
            }}
          />
        </motion.div>
      )}
      {/* Arrow */}
      <div
        className="absolute right-0"
        style={{
          borderLeft: `5px solid ${rejected ? "rgba(239,68,68,0.3)" : active ? color : "var(--border-bright)"}`,
          borderTop: "4px solid transparent",
          borderBottom: "4px solid transparent",
        }}
      />
    </div>
  );
}

// Animated traveling packet
function TravelingPacket({ active, color = "#22c55e" }: { active: boolean; color?: string }) {
  if (!active) return null;
  return (
    <motion.div
      className="absolute pointer-events-none z-10"
      style={{
        width: "8px", height: "8px",
        borderRadius: "50%",
        backgroundColor: color,
        boxShadow: `0 0 10px ${color}, 0 0 20px ${color}88`,
        top: "calc(50% - 4px)",
      }}
      initial={{ left: "0%" }}
      animate={{ left: "calc(100% - 8px)" }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
    />
  );
}

export default function RoutingPipeline({ routedCount, downgradeCount, co2Avoided, lastReceipts = [] }: PipelineProps) {
  const [phase, setPhase] = useState<"idle" | "routing" | "selected" | "done">("idle");
  const [activeExample, setActiveExample] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Example routing decisions to cycle through
  const examples = lastReceipts.length > 0
    ? lastReceipts.slice(0, 5).map((r: any) => ({
        requested: r.requested_model || r.model || "claude-3-5-sonnet",
        selected: r.model || "claude-haiku-3",
        rerouted: r.requested_model && r.model && r.requested_model !== r.model,
        co2Saved: Math.max(0, (r.comparison?.naive_co2e_g ?? 0) - (r.environmental_cost?.co2e_g ?? 0)),
        prompt: r.prompt_preview || "AI inference request",
      }))
    : [
        { requested: "gpt-4-turbo",            selected: "claude-haiku-3",     rerouted: true,  co2Saved: 2.34, prompt: "Summarize this document" },
        { requested: "claude-3-5-sonnet",      selected: "claude-3-5-sonnet",  rerouted: false, co2Saved: 0,    prompt: "Write a function in Python" },
        { requested: "gpt-4o",                 selected: "claude-haiku-3",     rerouted: true,  co2Saved: 3.12, prompt: "Translate this text to Spanish" },
      ];

  const current = examples[activeExample % examples.length];

  useEffect(() => {
    const runAnimation = () => {
      setPhase("routing");
      setTimeout(() => setPhase("selected"), 1200);
      setTimeout(() => setPhase("done"), 2200);
      setTimeout(() => {
        setPhase("idle");
        setActiveExample(i => i + 1);
      }, 4000);
    };

    runAnimation();
    intervalRef.current = setInterval(runAnimation, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const isRouting = phase === "routing" || phase === "selected" || phase === "done";
  const isSelected = phase === "selected" || phase === "done";
  const isDone = phase === "done";

  return (
    <div
      className="relative rounded-xl border overflow-hidden instrument"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ backgroundColor: "var(--border-bright)" }} />

      <div className="p-5 pb-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="system-id mb-1">Real-time · AI Routing Engine</p>
            <h3 className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              Green Router Pipeline
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full pulse-live" style={{ backgroundColor: "var(--teal)" }} />
            <span className="terminal-label" style={{ color: "var(--teal)" }}>Active</span>
          </div>
        </div>

        {/* Prompt preview */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeExample}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="mb-5 px-3 py-2 rounded-lg"
            style={{ backgroundColor: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.12)" }}
          >
            <p className="terminal-label mb-1" style={{ color: "rgba(20,184,166,0.6)" }}>Incoming request</p>
            <p className="text-xs font-medium truncate" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
              "{current.prompt}"
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Pipeline nodes */}
        <div className="relative flex items-center justify-between">
          <Node type="prompt" active={isRouting} color="var(--teal)" />

          <div className="relative flex-1 mx-1">
            <Connector active={isRouting} color="var(--teal)" />
            <TravelingPacket active={phase === "routing"} color="#14b8a6" />
          </div>

          <Node type="router" active={isRouting} color="var(--green)" />

          <div className="relative flex-1 mx-1">
            <Connector active={isSelected} color="var(--green)" />
            <TravelingPacket active={phase === "selected"} color="#22c55e" />
          </div>

          <Node type="model" active={isSelected} color="var(--green-bright)" />

          <div className="relative flex-1 mx-1">
            <Connector active={isDone} color="var(--green)" />
            <TravelingPacket active={isDone} color="#4ade80" />
          </div>

          <Node type="response" active={isDone} color="var(--teal)" />
        </div>

        {/* Reroute indicator */}
        <AnimatePresence>
          {isSelected && current.rerouted && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-4 flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg"
              style={{ backgroundColor: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)" }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] line-through" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  {current.requested}
                </span>
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>→</span>
                <span className="text-[10px] font-bold" style={{ color: "var(--green)", fontFamily: "var(--font-mono)" }}>
                  {current.selected}
                </span>
              </div>
              {current.co2Saved > 0 && (
                <>
                  <div className="w-px h-3" style={{ backgroundColor: "var(--border-bright)" }} />
                  <span className="text-[10px] font-semibold" style={{ color: "var(--green)", fontFamily: "var(--font-mono)" }}>
                    −{current.co2Saved.toFixed(2)}g CO₂
                  </span>
                </>
              )}
            </motion.div>
          )}
          {isSelected && !current.rerouted && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg"
              style={{ backgroundColor: "rgba(20,184,166,0.04)", border: "1px solid rgba(20,184,166,0.12)" }}
            >
              <span className="text-[10px] font-semibold" style={{ color: "var(--teal)", fontFamily: "var(--font-mono)" }}>
                ✓ Already optimal · {current.selected}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats footer */}
      <div
        className="grid grid-cols-3 divide-x divide-[var(--border)]"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        {[
          { label: "Total Routed",   value: String(routedCount)                  },
          { label: "Rerouted",       value: String(downgradeCount)               },
          { label: "CO₂ Avoided",   value: `${co2Avoided.toFixed(2)}g`          },
        ].map((s) => (
          <div key={s.label} className="px-4 py-3 text-center" style={{ borderColor: "var(--border)" }}>
            <p className="terminal-label mb-1">{s.label}</p>
            <p className="text-base font-bold gradient-text data-flicker" style={{ fontFamily: "var(--font-mono)", letterSpacing: "-0.03em" }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
