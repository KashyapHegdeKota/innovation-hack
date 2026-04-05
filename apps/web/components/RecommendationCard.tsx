"use client";

import { ArrowRight } from "lucide-react";

interface RecommendationCardProps {
  title: string;
  description: string;
  savingsPct: number;
  savingsCo2e: number;
  priority: string;
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  high:   { label: "High impact",   color: "var(--green-accent)",  bg: "rgba(34,197,94,0.07)"  },
  medium: { label: "Medium impact", color: "var(--amber-accent)",  bg: "rgba(245,158,11,0.07)" },
  low:    { label: "Low impact",    color: "var(--text-muted)",    bg: "var(--bg-card-hover)"  },
};

export default function RecommendationCard({ title, description, savingsPct, savingsCo2e, priority }: RecommendationCardProps) {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.low;

  return (
    <div
      className="flex items-center gap-4 px-5 py-4 rounded-xl transition-colors duration-150 group cursor-default"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-bright)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
    >
      {/* Priority pill */}
      <div
        className="shrink-0 px-2.5 py-1 rounded-lg text-center min-w-[90px]"
        style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.color}25` }}
      >
        <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: cfg.color, fontFamily: "var(--font-mono)" }}>
          {cfg.label}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{title}</p>
        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{description}</p>
      </div>

      {/* Savings */}
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold" style={{ color: "var(--green-accent)", fontFamily: "var(--font-mono)" }}>
          −{savingsPct}% CO₂
        </p>
        <p className="text-[10px]" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          ~{savingsCo2e.toFixed(1)}g saved
        </p>
      </div>

      <ArrowRight
        className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        style={{ color: "var(--text-muted)" }}
      />
    </div>
  );
}
