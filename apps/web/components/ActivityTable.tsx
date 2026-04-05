"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface Receipt {
  id?: string;
  timestamp: string;
  model: string;
  requested_model?: string;
  prompt_preview?: string;
  environmental_cost?: { co2e_g: number; energy_wh: number };
  comparison?: { naive_co2e_g?: number };
}

function timeAgo(ts: string): string {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60)   return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

function shortModel(m: string) {
  return m.replace(/^claude-/, "").replace(/^gpt-/, "").replace(/^gemini-/, "");
}

function inferPromptType(preview: string): string {
  const p = (preview || "").toLowerCase();
  if (p.includes("summar")) return "Summarize";
  if (p.includes("translat")) return "Translate";
  if (p.includes("code") || p.includes("function") || p.includes("write a")) return "Code";
  if (p.includes("explain")) return "Explain";
  if (p.includes("analyz") || p.includes("analys")) return "Analyze";
  return "Inference";
}

interface RowProps { receipt: Receipt; index: number }

function Row({ receipt, index }: RowProps) {
  const rerouted  = !!(receipt.requested_model && receipt.model && receipt.requested_model !== receipt.model);
  const co2Saved  = Math.max(0, (receipt.comparison?.naive_co2e_g ?? 0) - (receipt.environmental_cost?.co2e_g ?? 0));
  const co2Used   = receipt.environmental_cost?.co2e_g ?? 0;
  const promptType = inferPromptType(receipt.prompt_preview || "");

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="group border-b transition-colors duration-100"
      style={{ borderColor: "var(--border)" }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--bg-card-hover)")}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
    >
      {/* Prompt type */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span
            className="px-2 py-0.5 rounded text-[10px] font-medium"
            style={{
              backgroundColor: "var(--bg-card-hover)",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-mono)",
              border: "1px solid var(--border-bright)",
            }}
          >
            {promptType}
          </span>
          <span
            className="text-xs truncate max-w-[180px]"
            style={{ color: "var(--text-muted)" }}
          >
            {receipt.prompt_preview || "—"}
          </span>
        </div>
      </td>

      {/* Original model */}
      <td className="px-4 py-3">
        {receipt.requested_model && receipt.requested_model !== receipt.model ? (
          <span
            className="text-xs"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", textDecoration: "line-through" }}
          >
            {shortModel(receipt.requested_model)}
          </span>
        ) : (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>
        )}
      </td>

      {/* Routed model */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          {rerouted && (
            <ArrowRight className="w-3 h-3 shrink-0" style={{ color: "var(--green-accent)", opacity: 0.6 }} />
          )}
          <span
            className="text-xs font-medium"
            style={{
              color: rerouted ? "var(--green-accent)" : "var(--text-secondary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {shortModel(receipt.model)}
          </span>
        </div>
      </td>

      {/* Carbon delta */}
      <td className="px-4 py-3">
        {co2Saved > 0 ? (
          <span
            className="text-xs font-semibold"
            style={{ color: "var(--green-accent)", fontFamily: "var(--font-mono)" }}
          >
            −{co2Saved.toFixed(3)}g
          </span>
        ) : (
          <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {co2Used.toFixed(3)}g
          </span>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        {rerouted ? (
          <span
            className="px-2 py-0.5 rounded text-[10px] font-medium"
            style={{
              backgroundColor: "rgba(34,197,94,0.07)",
              color: "var(--green-accent)",
              border: "1px solid rgba(34,197,94,0.15)",
              fontFamily: "var(--font-mono)",
            }}
          >
            rerouted
          </span>
        ) : (
          <span
            className="px-2 py-0.5 rounded text-[10px]"
            style={{
              backgroundColor: "var(--bg-card-hover)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-mono)",
            }}
          >
            optimal
          </span>
        )}
      </td>

      {/* Time */}
      <td className="px-4 py-3 text-right">
        <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          {timeAgo(receipt.timestamp)}
        </span>
      </td>
    </motion.tr>
  );
}

export default function ActivityTable({ receipts }: { receipts: Receipt[] }) {
  const rows = receipts.slice(0, 12);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3.5"
        style={{ backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full pulse-live" style={{ backgroundColor: "var(--green-accent)" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Activity Feed
          </h3>
        </div>
        <span className="label">{receipts.length} total requests</span>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: "var(--bg-card)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Prompt", "Original Model", "Routed To", "Carbon Delta", "Status", "Time"].map(h => (
                <th
                  key={h}
                  className={`px-4 py-2.5 text-left ${h === "Time" ? "text-right" : ""}`}
                >
                  <span className="label">{h}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  <p className="label">No activity yet — run a CLI query to see data here</p>
                </td>
              </tr>
            ) : (
              <AnimatePresence>
                {rows.map((r, i) => (
                  <Row key={r.id || i} receipt={r} index={i} />
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
