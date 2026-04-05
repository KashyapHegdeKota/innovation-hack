"use client";

import { Activity, Clock, Users, Bot, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import { recentPlatformActivity, platformStats, topOrgs } from "@/lib/admin-mock-data";

const EVENT_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  "New agent registered": { icon: Bot, color: "#3b82f6" },
  "Wallet budget hit 90%": { icon: AlertTriangle, color: "#f59e0b" },
  "New org onboarded": { icon: Users, color: "#a855f7" },
  "Score milestone": { icon: TrendingUp, color: "#22c55e" },
  "Levy confirmed": { icon: DollarSign, color: "#22c55e" },
  "Downgrade accepted": { icon: Activity, color: "#06b6d4" },
};

// Extend with more simulated events for a fuller feed
const extendedActivity = [
  ...recentPlatformActivity,
  { timestamp: "2026-03-31T11:42:00Z", org: "Synapse.dev", event: "New agent registered", detail: "code-review-bot" },
  { timestamp: "2026-03-31T10:18:00Z", org: "PulseAI", event: "Downgrade accepted", detail: "sonnet → haiku (translation)" },
  { timestamp: "2026-03-31T09:55:00Z", org: "Aether Systems", event: "Wallet budget hit 90%", detail: "data-extraction-agent" },
  { timestamp: "2026-03-31T09:12:00Z", org: "NovaTech AI", event: "Levy confirmed", detail: "$4.18 → Stripe Climate" },
  { timestamp: "2026-03-31T08:30:00Z", org: "Vertex Labs", event: "Score milestone", detail: "Reached 86 sustainability score" },
  { timestamp: "2026-03-30T22:14:00Z", org: "CloudMind Inc", event: "Downgrade accepted", detail: "opus → sonnet (summarization)" },
  { timestamp: "2026-03-30T20:45:00Z", org: "GreenOps Co", event: "New agent registered", detail: "monitoring-agent-v2" },
  { timestamp: "2026-03-30T18:22:00Z", org: "DataForge", event: "Wallet budget hit 90%", detail: "analytics-pipeline" },
  { timestamp: "2026-03-30T16:55:00Z", org: "Synapse.dev", event: "Levy confirmed", detail: "$1.84 → Stripe Climate" },
  { timestamp: "2026-03-30T14:30:00Z", org: "PulseAI", event: "New org onboarded", detail: "Starter plan" },
];

export default function AdminActivityPage() {
  // Group by date
  const grouped: Record<string, typeof extendedActivity> = {};
  for (const a of extendedActivity) {
    const day = new Date(a.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(a);
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-8">
      {/* Header */}
      <div className="fade-up">
        <div className="flex items-center gap-3 mb-1">
          <Activity className="w-5 h-5" style={{ color: "var(--blue-accent)" }} />
          <h1 className="text-xl font-black" style={{ letterSpacing: "-0.03em" }}>
            Activity Feed
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Real-time platform events across all organizations
        </p>
      </div>

      {/* Quick stats bar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4 fade-up-1">
          <span className="label">Events Today</span>
          <p className="text-2xl font-black mt-1" style={{ color: "var(--text-primary)" }}>
            {extendedActivity.filter(a => a.timestamp.startsWith("2026-03-31")).length}
          </p>
        </div>
        <div className="card p-4 fade-up-2">
          <span className="label">New Agents (7d)</span>
          <p className="text-2xl font-black mt-1" style={{ color: "var(--blue-accent)" }}>
            {extendedActivity.filter(a => a.event === "New agent registered").length}
          </p>
        </div>
        <div className="card p-4 fade-up-3">
          <span className="label">Budget Warnings</span>
          <p className="text-2xl font-black mt-1" style={{ color: "var(--amber-accent)" }}>
            {extendedActivity.filter(a => a.event.includes("budget")).length}
          </p>
        </div>
        <div className="card p-4 fade-up-4">
          <span className="label">Levy Confirmations</span>
          <p className="text-2xl font-black mt-1" style={{ color: "var(--green-accent)" }}>
            {extendedActivity.filter(a => a.event === "Levy confirmed").length}
          </p>
        </div>
      </div>

      {/* Timeline */}
      {Object.entries(grouped).map(([date, events]) => (
        <div key={date} className="fade-up-1">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              {date}
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
          </div>

          <div className="card overflow-hidden">
            {events.map((a, i) => {
              const iconInfo = EVENT_ICONS[a.event] || { icon: Activity, color: "var(--text-muted)" };
              const Icon = iconInfo.icon;

              return (
                <div
                  key={i}
                  className="flex items-center gap-4 px-5 py-3 transition-colors"
                  style={{
                    borderBottom: i < events.length - 1 ? "1px solid var(--border)" : undefined,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--hover-bg)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  {/* Icon */}
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${iconInfo.color}10`,
                      border: `1px solid ${iconInfo.color}18`,
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: iconInfo.color }} />
                  </div>

                  {/* Time */}
                  <span className="text-[10px] font-mono w-14 shrink-0" style={{ color: "var(--text-muted)" }}>
                    {new Date(a.timestamp).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
                  </span>

                  {/* Org */}
                  <span className="text-xs font-medium w-32 truncate" style={{ color: "var(--text-primary)" }}>
                    {a.org}
                  </span>

                  {/* Event */}
                  <span className="text-xs flex-1" style={{ color: "var(--text-secondary)" }}>
                    {a.event}
                  </span>

                  {/* Detail */}
                  <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                    {a.detail}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
