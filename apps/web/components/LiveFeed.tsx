"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Zap } from "lucide-react";

interface Receipt {
  id?: string;
  timestamp: string;
  model: string;
  requested_model?: string;
  prompt_preview?: string;
  environmental_cost?: {
    co2e_g: number;
    energy_wh: number;
  };
  comparison?: {
    naive_co2e_g?: number;
  };
}

interface LiveFeedProps {
  receipts: Receipt[];
}

function timeAgo(ts: string): string {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60)   return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  return `${Math.round(diff / 3600)}h ago`;
}

function FeedItem({ receipt, index }: { receipt: Receipt; index: number }) {
  const rerouted = receipt.requested_model && receipt.model && receipt.requested_model !== receipt.model;
  const co2Saved = Math.max(0, (receipt.comparison?.naive_co2e_g ?? 0) - (receipt.environmental_cost?.co2e_g ?? 0));
  const co2Used  = receipt.environmental_cost?.co2e_g ?? 0;
  const modelShort = (receipt.model || "unknown")
    .replace("claude-", "")
    .replace("gpt-", "gpt-")
    .replace("gemini-", "gemini-");

  return (
    <motion.div
      key={receipt.id || index}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      className="group flex items-center gap-4 px-4 py-3 rounded-xl transition-colors duration-150"
      style={{
        backgroundColor: "transparent",
      }}
      whileHover={{ backgroundColor: "rgba(34,197,94,0.03)" }}
    >
      {/* Status dot */}
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{
          backgroundColor: rerouted ? "var(--green)" : "var(--teal)",
          boxShadow: rerouted ? "0 0 6px rgba(34,197,94,0.6)" : "0 0 6px rgba(20,184,166,0.6)",
        }}
      />

      {/* Prompt preview */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate mb-0.5" style={{ color: "var(--text-primary)" }}>
          {receipt.prompt_preview || "AI inference request"}
        </p>
        <div className="flex items-center gap-2">
          {rerouted ? (
            <>
              <span className="terminal-label line-through" style={{ color: "var(--red)", opacity: 0.5 }}>
                {(receipt.requested_model || "").replace("claude-","").replace("gpt-","gpt-")}
              </span>
              <ArrowRight className="w-2.5 h-2.5 shrink-0" style={{ color: "var(--green)" }} />
              <span className="terminal-label" style={{ color: "var(--green)" }}>{modelShort}</span>
            </>
          ) : (
            <>
              <Check className="w-2.5 h-2.5" style={{ color: "var(--teal)" }} />
              <span className="terminal-label" style={{ color: "var(--teal)" }}>{modelShort}</span>
            </>
          )}
          <span className="terminal-label">· {timeAgo(receipt.timestamp)}</span>
        </div>
      </div>

      {/* CO2 metrics */}
      <div className="text-right shrink-0">
        {co2Saved > 0 ? (
          <p className="text-[11px] font-bold" style={{ color: "var(--green)", fontFamily: "var(--font-mono)" }}>
            −{co2Saved.toFixed(3)}g CO₂
          </p>
        ) : (
          <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {co2Used.toFixed(3)}g CO₂
          </p>
        )}
        <div className="flex items-center gap-1 justify-end mt-0.5">
          <Zap className="w-2.5 h-2.5" style={{ color: "var(--text-muted)" }} />
          <p className="terminal-label">{(receipt.environmental_cost?.energy_wh ?? 0).toFixed(3)} Wh</p>
        </div>
      </div>

      {/* Rerouted badge */}
      {rerouted && co2Saved > 0 && (
        <div
          className="shrink-0 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider"
          style={{
            backgroundColor: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.18)",
            color: "var(--green)",
            fontFamily: "var(--font-mono)",
          }}
        >
          rerouted
        </div>
      )}
    </motion.div>
  );
}

export default function LiveFeed({ receipts }: LiveFeedProps) {
  const latest = receipts.slice(0, 10);

  return (
    <div
      className="relative rounded-xl border overflow-hidden instrument"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(34,197,94,0.4), transparent)" }} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full pulse-live" style={{ backgroundColor: "var(--green)" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
            Live Inference Feed
          </p>
        </div>
        <span className="terminal-label">{receipts.length} total queries</span>
      </div>

      {/* Feed */}
      <div className="divide-y divide-[var(--border)]">
        {latest.length === 0 ? (
          <div className="py-10 text-center">
            <p className="terminal-label">No activity yet — run a CLI query</p>
          </div>
        ) : (
          <AnimatePresence>
            {latest.map((r, i) => (
              <div key={r.id || i} style={{ borderColor: "var(--border)" }}>
                <FeedItem receipt={r} index={i} />
              </div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
