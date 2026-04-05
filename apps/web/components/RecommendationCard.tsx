"use client";

import { Lightbulb } from "lucide-react";

interface RecommendationCardProps {
  title: string;
  description: string;
  savingsPct: number;
  savingsCo2e: number;
  priority: string;
}

export default function RecommendationCard({ title, description, savingsPct, savingsCo2e, priority }: RecommendationCardProps) {
  const priorityColors: Record<string, string> = {
    high: "var(--red-accent)",
    medium: "var(--amber-accent)",
    low: "var(--green-accent)",
  };

  return (
    <div
      className="rounded-lg border p-4 flex gap-3"
      style={{ backgroundColor: "var(--bg-card-hover)", borderColor: "var(--border)" }}
    >
      <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--amber-accent)" }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{title}</h4>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-medium uppercase"
            style={{
              color: priorityColors[priority] || "var(--text-muted)",
              backgroundColor: "var(--bg-secondary)",
            }}
          >
            {priority}
          </span>
        </div>
        <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>{description}</p>
        <div className="flex gap-3">
          <span className="text-xs font-mono" style={{ color: "var(--green-accent)" }}>
            -{savingsPct}% CO2
          </span>
          <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            ~{savingsCo2e.toFixed(1)}g saved
          </span>
        </div>
      </div>
    </div>
  );
}
