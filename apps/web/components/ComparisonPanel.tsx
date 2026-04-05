"use client";

import { motion } from "framer-motion";
import { X, Check } from "lucide-react";

const WITHOUT = [
  "Teams pick models blindly based on familiarity",
  "No visibility into carbon footprint per request",
  "Expensive flagship models used for simple tasks",
  "Zero audit trail for AI infrastructure decisions",
  "Sustainability reports built from estimates",
];

const WITH = [
  "Automatic routing to the most efficient model",
  "Real-time CO₂ accounting for every inference",
  "Complexity-matched routing reduces costs by ~23%",
  "Full request log with routing decisions and rationale",
  "Accurate, auditable environmental reporting",
];

export default function ComparisonPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="grid grid-cols-2 rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--border)" }}
    >
      {/* Without */}
      <div className="p-6" style={{ backgroundColor: "var(--bg-card)", borderRight: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-5">
          <div
            className="w-5 h-5 rounded flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}
          >
            <X className="w-3 h-3" style={{ color: "var(--red-accent)" }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
            Without GreenLedger
          </p>
        </div>
        <ul className="space-y-3">
          {WITHOUT.map((item, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex items-start gap-2.5"
            >
              <X className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "rgba(248,113,113,0.5)" }} />
              <span className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {item}
              </span>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* With */}
      <div className="p-6 relative" style={{ backgroundColor: "#0d130e" }}>
        {/* Subtle green tint overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 20%, rgba(34,197,94,0.04), transparent)" }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 mb-5">
            <div
              className="w-5 h-5 rounded flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}
            >
              <Check className="w-3 h-3" style={{ color: "var(--green-accent)" }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              With GreenLedger
            </p>
          </div>
          <ul className="space-y-3">
            {WITH.map((item, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.06, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                className="flex items-start gap-2.5"
              >
                <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "var(--green-accent)" }} />
                <span className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {item}
                </span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
