"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  icon: LucideIcon;
  trend?: number;
  trendInverted?: boolean;
  accent?: boolean;
}

export default function StatCard({ label, value, unit, icon: Icon, trend, trendInverted = false, accent = false }: StatCardProps) {
  const isPositive = trendInverted ? (trend ?? 0) < 0 : (trend ?? 0) > 0;

  return (
    <motion.div
      whileHover={{ y: -1, transition: { duration: 0.15 } }}
      className="relative rounded-xl p-5 cursor-default transition-colors duration-150"
      style={{
        backgroundColor: "var(--bg-card)",
        border: `1px solid ${accent ? "rgba(34,197,94,0.18)" : "var(--border)"}`,
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = accent ? "rgba(34,197,94,0.3)" : "var(--border-bright)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = accent ? "rgba(34,197,94,0.18)" : "var(--border)")}
    >
      {/* Icon + label row */}
      <div className="flex items-center justify-between mb-4">
        <span className="label">{label}</span>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: accent ? "rgba(34,197,94,0.08)" : "var(--bg-card-hover)",
            border: `1px solid ${accent ? "rgba(34,197,94,0.15)" : "var(--border-bright)"}`,
          }}
        >
          <Icon
            className="w-3.5 h-3.5"
            style={{ color: accent ? "var(--green-accent)" : "var(--text-muted)" }}
          />
        </div>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1.5 data-flicker">
        <span
          className="font-black leading-none"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "clamp(1.4rem, 2vw, 1.75rem)",
            letterSpacing: "-0.05em",
            color: accent ? "var(--green-accent)" : "var(--text-primary)",
          }}
        >
          {value}
        </span>
        {unit && (
          <span
            className="text-xs font-medium"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
          >
            {unit}
          </span>
        )}
      </div>

      {/* Trend */}
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-3">
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: isPositive ? "rgba(34,197,94,0.08)" : "rgba(248,113,113,0.08)",
            }}
          >
            {isPositive
              ? <TrendingUp className="w-2.5 h-2.5" style={{ color: "var(--green-accent)" }} />
              : <TrendingDown className="w-2.5 h-2.5" style={{ color: "var(--red-accent)" }} />}
            <span
              className="text-[9px] font-semibold"
              style={{
                fontFamily: "var(--font-mono)",
                color: isPositive ? "var(--green-accent)" : "var(--red-accent)",
              }}
            >
              {Math.abs(trend).toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
