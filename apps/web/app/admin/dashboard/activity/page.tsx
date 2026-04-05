"use client";

import { useEffect, useState } from "react";
import { Activity, Clock, Bot, Zap, ArrowDownRight } from "lucide-react";
import { listReceipts } from "@/lib/greenledger-api";
import { DUMMY_AGENTS } from "@/lib/dummy-agents";
import { recentPlatformActivity as mockActivity } from "@/lib/admin-mock-data";

function shortModel(m: string) {
  return m.replace("claude-", "").replace("gpt-", "").replace("gemini-", "");
}

export default function AdminActivityPage() {
  const [live, setLive] = useState(false);
  const [grouped, setGrouped] = useState<Record<string, any[]>>({});
  const [stats, setStats] = useState({ today: 0, downgrades: 0, totalCo2e: 0, totalQueries: 0 });

  useEffect(() => {
    async function load() {
      try {
        const res = await listReceipts({ limit: 200 });
        setLive(true);
        const raw: any[] = Array.isArray(res.data) ? res.data : [];

        // Build from live receipts + dummy receipts
        const dummyReceipts = DUMMY_AGENTS.flatMap(a =>
          a.receipts.map(r => ({
            timestamp: r.timestamp,
            agent: a.display_name,
            event: r.requested_model && r.model !== r.requested_model
              ? `Downgrade: ${shortModel(r.requested_model)} → ${shortModel(r.model)}`
              : `Inference: ${shortModel(r.model)}`,
            detail: `${r.environmental_cost.co2e_g.toFixed(4)}g CO₂e`,
            isDowngrade: !!(r.requested_model && r.model !== r.requested_model),
            co2e: r.environmental_cost.co2e_g,
          }))
        );

        const liveEvents = raw.map((r: any) => ({
          timestamp: r.timestamp,
          agent: r.agent_id || "unknown",
          event: r.requested_model && r.model && r.requested_model !== r.model
            ? `Downgrade: ${shortModel(r.requested_model)} → ${shortModel(r.model)}`
            : `Inference: ${shortModel(r.model || "unknown")}`,
          detail: `${(r.environmental_cost?.co2e_g ?? 0).toFixed(4)}g CO₂e`,
          isDowngrade: !!(r.requested_model && r.model && r.requested_model !== r.model),
          co2e: r.environmental_cost?.co2e_g ?? 0,
        }));

        const allEvents = [...liveEvents, ...dummyReceipts]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Group by day
        const groups: Record<string, any[]> = {};
        allEvents.forEach(e => {
          const day = new Date(e.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          if (!groups[day]) groups[day] = [];
          groups[day].push(e);
        });
        setGrouped(groups);

        const todayStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        setStats({
          today: (groups[todayStr] || []).length,
          downgrades: allEvents.filter(e => e.isDowngrade).length,
          totalCo2e: allEvents.reduce((s, e) => s + (e.co2e || 0), 0),
          totalQueries: allEvents.length,
        });
      } catch {
        // Fallback to mock
        const groups: Record<string, any[]> = {};
        mockActivity.forEach(a => {
          const day = new Date(a.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          if (!groups[day]) groups[day] = [];
          groups[day].push({ ...a, agent: a.org, isDowngrade: a.event.includes("Downgrade"), co2e: 0 });
        });
        setGrouped(groups);
        setStats({ today: mockActivity.length, downgrades: 2, totalCo2e: 0, totalQueries: mockActivity.length });
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-[1200px] mx-auto space-y-8">
      <div className="fade-up">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Activity className="w-5 h-5" style={{ color: "var(--blue-accent)" }} />
              <h1 className="text-xl font-black" style={{ letterSpacing: "-0.03em" }}>Activity Feed</h1>
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Real-time platform events</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: live ? "#22c55e" : "#525252", boxShadow: live ? "0 0 6px #22c55e" : "none", animation: "pulse-green 2s ease-in-out infinite" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase" as const, color: live ? "#22c55e" : "var(--text-muted)" }}>
              {live ? "Live" : "Mock"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4 fade-up-1">
          <span className="label">Total Events</span>
          <p className="text-2xl font-black mt-1" style={{ color: "var(--text-primary)" }}>{stats.totalQueries}</p>
        </div>
        <div className="card p-4 fade-up-2">
          <span className="label">Downgrades</span>
          <p className="text-2xl font-black mt-1" style={{ color: "var(--green-accent)" }}>{stats.downgrades}</p>
        </div>
        <div className="card p-4 fade-up-3">
          <span className="label">Total CO₂e</span>
          <p className="text-2xl font-black mt-1" style={{ color: "var(--text-primary)" }}>{stats.totalCo2e.toFixed(3)}g</p>
        </div>
        <div className="card p-4 fade-up-4">
          <span className="label">Events Today</span>
          <p className="text-2xl font-black mt-1" style={{ color: "var(--blue-accent)" }}>{stats.today}</p>
        </div>
      </div>

      {Object.entries(grouped).map(([date, events]) => (
        <div key={date} className="fade-up-1">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{date}</span>
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
            <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>{events.length} events</span>
          </div>

          <div className="card overflow-hidden">
            {events.map((a: any, i: number) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3 transition-colors"
                style={{ borderBottom: i < events.length - 1 ? "1px solid var(--border)" : undefined }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--hover-bg)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{
                  backgroundColor: a.isDowngrade ? "rgba(34,197,94,0.1)" : "rgba(96,165,250,0.1)",
                  border: `1px solid ${a.isDowngrade ? "rgba(34,197,94,0.18)" : "rgba(96,165,250,0.18)"}`,
                }}>
                  {a.isDowngrade
                    ? <ArrowDownRight className="w-3.5 h-3.5" style={{ color: "var(--green-accent)" }} />
                    : <Zap className="w-3.5 h-3.5" style={{ color: "var(--blue-accent)" }} />}
                </div>
                <span className="text-[10px] font-mono w-14 shrink-0" style={{ color: "var(--text-muted)" }}>
                  {new Date(a.timestamp).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="text-xs font-medium w-32 truncate" style={{ color: "var(--text-primary)" }}>{a.agent}</span>
                <span className="text-xs flex-1" style={{ color: "var(--text-secondary)" }}>{a.event}</span>
                <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{a.detail}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
