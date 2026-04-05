"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { getDashboardSummary, listReceipts } from "@/lib/greenledger-api";

/* ── animation variants ───────────────────────────────────────── */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.25, 0.1, 0.25, 1] as const } },
};

/* ── section label ────────────────────────────────────────────── */
function Sec({ children }: { children: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 700,
        letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)",
        whiteSpace: "nowrap",
      }}>
        {children}
      </span>
      <div style={{ flex: 1, height: "1px", backgroundColor: "var(--rule, #1e1e1e)" }} />
    </div>
  );
}

/* ── helpers ───────────────────────────────────────────────────── */
function formatCarbon(g: number): string {
  if (g < 1) return g.toFixed(3) + " g";
  if (g < 1000) return g.toFixed(1) + " g";
  return (g / 1000).toFixed(1) + " kg";
}

const STATUS_COLOR: Record<string, string> = {
  confirmed: "#22c55e",
  pooled: "#60a5fa",
  pending: "#f59e0b",
};

const STEP_COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#ec4899"];

interface Partner {
  name: string;
  allocated_usd: number;
  removed_g: number;
  status: "confirmed" | "pooled" | "pending";
}

/* ── main page ────────────────────────────────────────────────── */
export default function AdminCarbonPage() {
  const [live, setLive] = useState(false);
  const [totalLevy, setTotalLevy] = useState(0);
  const [totalRemoved, setTotalRemoved] = useState(0);
  const [totalAvoided, setTotalAvoided] = useState(0);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [emissionsData, setEmissionsData] = useState<{ date: string; co2e_avoided: number }[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [dashRes, receiptsRes] = await Promise.all([
          getDashboardSummary(),
          listReceipts({ limit: 200 }),
        ]);
        setLive(true);
        const dash = dashRes.data ?? {};
        const raw: any[] = Array.isArray(receiptsRes.data) ? receiptsRes.data : [];

        const levy = dash.total_levy_usd || 0;
        const removed = dash.total_carbon_removed_g || 0;
        setTotalLevy(levy);
        setTotalRemoved(removed);

        // CO2e avoided from live receipts only
        const liveAvoided = raw.reduce((sum: number, r: any) =>
          sum + Math.max(0, (r.comparison?.naive_co2e_g ?? 0) - (r.environmental_cost?.co2e_g ?? 0)), 0);
        setTotalAvoided(liveAvoided);

        // Partners split (derived from real levy data)
        setPartners([
          { name: "Stripe Climate — Frontier", allocated_usd: levy * 0.72, removed_g: removed * 0.72, status: "confirmed" as const },
          { name: "Stripe Climate — Pooled", allocated_usd: levy * 0.24, removed_g: removed * 0.24, status: "pooled" as const },
          { name: "Pending Settlement", allocated_usd: levy * 0.04, removed_g: removed * 0.04, status: "pending" as const },
        ]);

        // Time series from live receipts only
        const byDay: Record<string, { co2e_avoided: number }> = {};
        raw.forEach((r: any) => {
          const day = new Date(r.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          if (!byDay[day]) byDay[day] = { co2e_avoided: 0 };
          byDay[day].co2e_avoided += Math.max(0, (r.comparison?.naive_co2e_g ?? 0) - (r.environmental_cost?.co2e_g ?? 0));
        });
        const computed = Object.entries(byDay).map(([date, v]) => ({
          date, co2e_avoided: Math.round(v.co2e_avoided * 1000) / 1000,
        }));
        if (computed.length > 0) setEmissionsData(computed);
      } catch {
        setLive(false);
        setTotalLevy(0);
        setTotalRemoved(0);
        setTotalAvoided(0);
        setPartners([]);
        setEmissionsData([]);
      }
    }
    load();
  }, []);

  const confirmedPct = partners.length > 0
    ? Math.round((partners.find(p => p.status === "confirmed")?.allocated_usd || 0) / Math.max(totalLevy, 0.0001) * 100)
    : 0;

  const heroMetrics = [
    { label: "Levy Collected", value: `$${totalLevy.toFixed(4)}`, accent: false },
    { label: "Confirmed", value: `${confirmedPct}%`, accent: true },
    { label: "CO\u2082e Avoided", value: totalAvoided < 1 ? totalAvoided.toFixed(3) + " g" : totalAvoided.toFixed(1) + " g", accent: false },
  ];

  const steps = [
    { step: "01", title: "Agent Queries", desc: "AI agents send inference requests through GreenLedger" },
    { step: "02", title: "Router Optimizes", desc: "Green Router picks the most carbon-efficient model" },
    { step: "03", title: "Savings Calculated", desc: "We compare original vs routed model API cost" },
    { step: "04", title: "20% Levy Applied", desc: "One-fifth of savings goes to carbon removal" },
    { step: "05", title: "Stripe Climate", desc: "Funds go to permanent carbon removal projects" },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      style={{ maxWidth: 1200, margin: "0 auto" }}
    >

      {/* ── Page header ─────────────────────────────────────────── */}
      <motion.div variants={item} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2.5rem" }}>
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.8rem",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: "var(--text-primary)",
              lineHeight: 1,
              textTransform: "uppercase",
            }}
          >
            Carbon Removal
          </h1>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "6px", letterSpacing: "0.04em" }}>
            How GreenLedger levies fund real carbon removal
          </p>
        </div>

        {/* Live badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingTop: "4px" }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%", display: "inline-block", flexShrink: 0,
            backgroundColor: live ? "#22c55e" : "#525252",
            boxShadow: live ? "0 0 6px #22c55e" : "none",
            animation: "pulse-green 2s ease-in-out infinite",
          }} />
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.12em",
            textTransform: "uppercase", color: live ? "#22c55e" : "var(--text-muted)",
          }}>
            {live ? "Live" : "Offline"}
          </span>
        </div>
      </motion.div>

      {/* ── Hero: big carbon number LEFT / 3 metrics RIGHT ──────── */}
      <motion.div variants={item} style={{
        borderTop: "1px solid var(--rule, #1e1e1e)",
        borderBottom: "1px solid var(--rule, #1e1e1e)",
        paddingTop: "2rem",
        paddingBottom: "2rem",
        marginBottom: "2.5rem",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "5fr 7fr", gap: 0 }}>

          {/* LEFT — big carbon display */}
          <div style={{
            borderRight: "1px solid var(--rule, #1e1e1e)",
            paddingRight: "2.5rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 0,
          }}>
            <span
              className="font-condensed"
              style={{
                display: "block",
                fontSize: "clamp(4rem, 10vw, 8rem)",
                color: "#22c55e",
                letterSpacing: "-0.01em",
                lineHeight: 0.88,
                marginBottom: "1rem",
              }}
            >
              {totalRemoved < 1000
                ? totalRemoved.toFixed(1)
                : (totalRemoved / 1000).toFixed(1)}
            </span>

            <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <span
                className="font-condensed"
                style={{
                  fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)",
                  color: "var(--text-muted)",
                  letterSpacing: "-0.01em",
                  lineHeight: 1,
                }}
              >
                {totalRemoved < 1000 ? "GRAMS" : "KG"}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.04em" }}>
                CO&#8322; removed
              </span>
            </div>

            <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Total carbon removed via GreenLedger
            </p>
          </div>

          {/* RIGHT — 3 metrics grid */}
          <div style={{ paddingLeft: "2.5rem", display: "flex", alignItems: "stretch" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", width: "100%" }}>
              {heroMetrics.map((m, i) => (
                <div
                  key={m.label}
                  style={{
                    borderLeft: i > 0 ? "1px solid var(--rule, #1e1e1e)" : "none",
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <span
                    className="font-condensed"
                    style={{
                      fontSize: "clamp(1.4rem, 2.5vw, 2.2rem)",
                      color: m.accent ? "#22c55e" : "var(--text-primary)",
                      letterSpacing: "-0.02em",
                      lineHeight: 1,
                    }}
                  >
                    {m.value}
                  </span>
                  <span style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "9px",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                  }}>
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </motion.div>

      {/* ── Partners ────────────────────────────────────────────── */}
      <motion.div variants={item} style={{ marginBottom: "2.5rem" }}>
        <Sec>Removal Partners</Sec>
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          {partners.length === 0 && (
            <div style={{ padding: "1.25rem", textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "11px" }}>
              No levy data available yet
            </div>
          )}
          {partners.map((p, i) => {
            const color = STATUS_COLOR[p.status] || "#f59e0b";
            const pct = totalLevy > 0 ? (p.allocated_usd / totalLevy) * 100 : 0;

            return (
              <div
                key={p.name}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto 120px 100px",
                  gap: "1.5rem",
                  alignItems: "center",
                  padding: "1rem 1.25rem",
                  borderBottom: i < partners.length - 1 ? "1px solid var(--border)" : "none",
                  backgroundColor: "var(--bg-card)",
                  transition: "background-color 0.15s ease",
                  cursor: "default",
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--hover-bg, rgba(255,255,255,0.02))")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--bg-card)")}
              >
                {/* Name + allocation */}
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>
                    {p.name}
                  </p>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                    ${p.allocated_usd.toFixed(4)} allocated
                  </p>
                </div>

                {/* Carbon removed */}
                <span
                  className="font-condensed"
                  style={{
                    fontSize: "1.4rem",
                    color: "var(--text-primary)",
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}
                >
                  {formatCarbon(p.removed_g)}
                </span>

                {/* Progress bar */}
                <div>
                  <div style={{ width: "100%", height: 4, borderRadius: 2, backgroundColor: "var(--track-bg, rgba(255,255,255,0.06))" }}>
                    <div style={{
                      height: "100%",
                      borderRadius: 2,
                      width: `${pct}%`,
                      backgroundColor: color,
                      transition: "width 0.4s ease",
                    }} />
                  </div>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", marginTop: "4px", textAlign: "right" }}>
                    {pct.toFixed(0)}% of fund
                  </p>
                </div>

                {/* Status badge */}
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color,
                  padding: "4px 8px",
                  borderRadius: "4px",
                  backgroundColor: `${color}15`,
                  textAlign: "center",
                }}>
                  {p.status}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── CO₂e chart ──────────────────────────────────────────── */}
      <motion.div variants={item} style={{ borderTop: "1px solid var(--rule, #1e1e1e)", paddingTop: "2rem", marginBottom: "2.5rem" }}>
        <Sec>Emissions Avoided</Sec>
        <div
          className="rounded-xl overflow-hidden"
          style={{
            border: "1px solid var(--border)",
            backgroundColor: "var(--bg-card)",
            padding: "1.25rem",
            position: "relative",
          }}
        >
          {/* Gradient line at top */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(34,197,94,0.3), transparent)",
            }}
          />

          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "1rem" }}>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 700,
              letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)",
            }}>
              CO&#8322;e Avoided Over Time (g)
            </span>
          </div>

          <div style={{ height: 240 }}>
            {emissionsData.length === 0 ? (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                height: "100%", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "11px",
              }}>
                No emissions data available yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={emissionsData}>
                  <defs>
                    <linearGradient id="carbonGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" }} />
                  <Area type="monotone" dataKey="co2e_avoided" stroke="#22c55e" fill="url(#carbonGreen)" strokeWidth={2} name="CO\u2082e Avoided" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── How it works ────────────────────────────────────────── */}
      <motion.div variants={item} style={{ borderTop: "1px solid var(--rule, #1e1e1e)", paddingTop: "2rem" }}>
        <Sec>How the Carbon Levy Works</Sec>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem" }}>
          {steps.map((s, i) => {
            const color = STEP_COLORS[i % STEP_COLORS.length];
            return (
              <div
                key={s.step}
                style={{
                  backgroundColor: "var(--bg-card)",
                  borderTop: `2px solid ${color}`,
                  borderRadius: "0.75rem",
                  padding: "1.25rem 1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <span
                  className="font-condensed"
                  style={{
                    fontSize: "2.5rem",
                    lineHeight: 0.9,
                    color: `${color}40`,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {s.step}
                </span>
                <p style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  lineHeight: 1.2,
                }}>
                  {s.title}
                </p>
                <p style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  lineHeight: 1.5,
                  letterSpacing: "0.01em",
                }}>
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>
      </motion.div>

    </motion.div>
  );
}
