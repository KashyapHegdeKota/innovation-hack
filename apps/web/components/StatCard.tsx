"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
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
    <div
      className="relative rounded-xl p-5 border glow-hover overflow-hidden"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(34,197,94,0.3), transparent)" }} />

      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          {label}
        </span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.15)" }}>
          <Icon className="w-3.5 h-3.5" style={{ color: "var(--green-accent)" }} />
        </div>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold font-mono gradient-text">
          {value}
        </span>
        {unit && (
          <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            {unit}
          </span>
        )}
      </div>

      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-2.5">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md"
            style={{ backgroundColor: trend === 0 ? "rgba(90,107,89,0.15)" : isPositive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)" }}>
            {trend === 0
              ? <Minus className="w-2.5 h-2.5" style={{ color: "var(--text-muted)" }} />
              : isPositive
              ? <TrendingUp className="w-2.5 h-2.5" style={{ color: "var(--green-accent)" }} />
              : <TrendingDown className="w-2.5 h-2.5" style={{ color: "var(--red-accent)" }} />}
            <span className="text-[10px] font-semibold"
              style={{ color: trend === 0 ? "var(--text-muted)" : isPositive ? "var(--green-accent)" : "var(--red-accent)" }}>
              {Math.abs(trend).toFixed(1)}% vs last period
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
