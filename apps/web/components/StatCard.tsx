"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  icon: LucideIcon;
  trend?: number; // percentage change, negative = good for carbon
  trendInverted?: boolean; // if true, negative trend is good (e.g., CO2 going down)
}

export default function StatCard({ label, value, unit, icon: Icon, trend, trendInverted = false }: StatCardProps) {
  const isPositive = trendInverted ? (trend ?? 0) < 0 : (trend ?? 0) > 0;

  return (
    <div
      className="rounded-xl p-5 border transition-colors"
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          {label}
        </span>
        <Icon className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold font-mono" style={{ color: "var(--text-primary)" }}>
          {value}
        </span>
        {unit && (
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {unit}
          </span>
        )}
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-2">
          {trend === 0 ? (
            <Minus className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
          ) : isPositive ? (
            <TrendingUp className="w-3 h-3" style={{ color: "var(--green-accent)" }} />
          ) : (
            <TrendingDown className="w-3 h-3" style={{ color: "var(--red-accent)" }} />
          )}
          <span
            className="text-xs font-medium"
            style={{ color: trend === 0 ? "var(--text-muted)" : isPositive ? "var(--green-accent)" : "var(--red-accent)" }}
          >
            {Math.abs(trend).toFixed(1)}% vs last period
          </span>
        </div>
      )}
    </div>
  );
}
