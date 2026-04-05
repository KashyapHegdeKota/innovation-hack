"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";
import { ArrowRight, ArrowUpRight, Leaf } from "lucide-react";
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";

/* ── Live CO₂ counter ──────────────────────────────────────────── */
// ~5 billion AI queries/day globally × avg 0.4g CO2 = ~2,000,000g/day
// = ~23,148g/second
const GRAMS_PER_SECOND = 23_148;

function useLiveCounter() {
  const [grams, setGrams] = useState(0);
  const start = useRef(Date.now());
  useEffect(() => {
    let raf: number;
    const tick = () => {
      const elapsed = (Date.now() - start.current) / 1000;
      setGrams(Math.floor(elapsed * GRAMS_PER_SECOND));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return grams;
}

function formatCounter(g: number) {
  if (g >= 1_000_000) return `${(g / 1_000_000).toFixed(2)}t`;
  if (g >= 1_000)     return `${(g / 1_000).toFixed(1)}kg`;
  return `${g}g`;
}

/* ── Scrolling ticker ──────────────────────────────────────────── */
const TICKER_ITEMS = [
  "161M+ machine-to-machine transactions",
  "0.03–1.14g CO₂e per AI query",
  "70× energy of lightweight models for reasoning tasks",
  "$15T B2B agent spend projected by 2028",
  "60–90% of AI lifecycle emissions from inference",
  "Google emissions up 50% — driven by AI",
  "Microsoft up 23% · Meta up 60%",
  "AI data centers: ~90 TWh/year by 2026",
];

function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]; // duplicate for seamless loop
  return (
    <div className="overflow-hidden" style={{ borderTop: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a" }}>
      <div className="ticker-track py-3">
        {items.map((item, i) => (
          <span key={i} className="flex items-center shrink-0">
            <span className="text-xs px-8" style={{ color: "#5a5a5a", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
              {item}
            </span>
            <span style={{ color: "#2a2a2a", fontSize: "8px" }}>◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Feature data ──────────────────────────────────────────────── */
const FEATURES = [
  {
    num: "01",
    name: "Green Router",
    description: "Intercepts every AI call and routes to the most eco-efficient model that meets your quality bar. Real-time grid carbon intensity. Zero prompt rewriting.",
    href: "/dashboard/router",
    detail: "Quality-constrained optimization · Grid-aware region selection · Batch scheduling for off-peak",
  },
  {
    num: "02",
    name: "Carbon Wallet",
    description: "Every agent gets a carbon budget alongside its payment budget. Set limits per agent, team, or department. Auto-downgrade when budgets run low.",
    href: "/dashboard/wallets",
    detail: "Per-agent budgets · Auto-downgrade on budget exceeded · Real-time balance API",
  },
  {
    num: "03",
    name: "Carbon Levy",
    description: "Micro-levy calculated per transaction and routed to verified carbon removal via Stripe Climate. Works natively with MPP, x402, and AP2.",
    href: "/dashboard/levy",
    detail: "Stripe Climate Orders · Frontier portfolio · Gold Standard / Verra verification",
  },
  {
    num: "04",
    name: "Receipt Engine",
    description: "Every AI action produces a standardized environmental receipt — CO₂e, water, energy, offset paid, model, region, grid mix. Open spec. Machine-readable.",
    href: "/dashboard/receipts",
    detail: "Full audit trail · ESG / CSRD / SEC ready · Exportable · Bank-statement style",
  },
  {
    num: "05",
    name: "Dashboard",
    description: "Company-wide sustainability scores, per-agent carbon breakdowns, trend analysis, and optimization recommendations.",
    href: "/dashboard",
    detail: "Agent Sustainability Score · Trend analysis · Optimization engine",
  },
];


/* ── Carbon pathways chart data ────────────────────────────────── */
// Historical: Global Carbon Project. Scenarios: CICERO/IPCC SSP adaptations.
// Every row has all keys — null where not applicable so Recharts renders cleanly
const CARBON_DATA = [
  { year: 1980, historical: 22.5, path15: null, path20: null, path30: null, removal15: null, removal20: null },
  { year: 1985, historical: 23.8, path15: null, path20: null, path30: null, removal15: null, removal20: null },
  { year: 1990, historical: 26.1, path15: null, path20: null, path30: null, removal15: null, removal20: null },
  { year: 1995, historical: 27.4, path15: null, path20: null, path30: null, removal15: null, removal20: null },
  { year: 2000, historical: 29.2, path15: null, path20: null, path30: null, removal15: null, removal20: null },
  { year: 2005, historical: 32.8, path15: null, path20: null, path30: null, removal15: null, removal20: null },
  { year: 2010, historical: 35.6, path15: null, path20: null, path30: null, removal15: null, removal20: null },
  { year: 2015, historical: 38.2, path15: null, path20: null, path30: null, removal15: null, removal20: null },
  { year: 2020, historical: 41.8, path15: 41.8, path20: 41.8, path30: 41.8, removal15: 0, removal20: 0 },
  { year: 2025, historical: null, path15: 36.0, path20: 39.5, path30: 43.2, removal15: -1.0, removal20: -0.4 },
  { year: 2030, historical: null, path15: 28.0, path20: 35.0, path30: 44.8, removal15: -2.5, removal20: -0.9 },
  { year: 2035, historical: null, path15: 19.0, path20: 29.5, path30: 45.5, removal15: -4.2, removal20: -1.6 },
  { year: 2040, historical: null, path15: 10.5, path20: 23.0, path30: 45.8, removal15: -5.8, removal20: -2.4 },
  { year: 2045, historical: null, path15:  3.5, path20: 16.0, path30: 45.5, removal15: -7.0, removal20: -3.2 },
  { year: 2050, historical: null, path15: -1.5, path20:  9.0, path30: 44.8, removal15: -8.0, removal20: -4.0 },
  { year: 2055, historical: null, path15: -4.5, path20:  3.5, path30: 43.2, removal15: -8.8, removal20: -4.8 },
  { year: 2060, historical: null, path15: -6.5, path20: -1.0, path30: 41.5, removal15: -9.4, removal20: -5.5 },
  { year: 2065, historical: null, path15: -7.8, path20: -4.0, path30: 39.5, removal15: -9.8, removal20: -6.2 },
  { year: 2070, historical: null, path15: -8.8, path20: -6.5, path30: 37.5, removal15:-10.0, removal20: -6.8 },
  { year: 2075, historical: null, path15: -9.5, path20: -8.5, path30: 35.0, removal15:-10.2, removal20: -7.2 },
  { year: 2080, historical: null, path15:-10.0, path20: -9.8, path30: 32.0, removal15:-10.3, removal20: -7.5 },
  { year: 2085, historical: null, path15:-10.4, path20:-10.5, path30: 29.0, removal15:-10.3, removal20: -7.8 },
  { year: 2090, historical: null, path15:-10.6, path20:-10.8, path30: 26.0, removal15:-10.2, removal20: -8.0 },
  { year: 2095, historical: null, path15:-10.7, path20:-11.0, path30: 23.5, removal15:-10.1, removal20: -8.1 },
  { year: 2100, historical: null, path15:-10.8, path20:-11.2, path30: 21.5, removal15:-10.0, removal20: -8.2 },
];

type Scenario = "1.5" | "2" | "3";

const SCENARIO_CONFIG: Record<Scenario, { label: string; pathKey: string; removalKey: string; color: string; desc: string }> = {
  "1.5": { label: "~1.5°C",             pathKey: "path15", removalKey: "removal15", color: "#60a5fa", desc: "Aggressive immediate cuts + large-scale carbon removal" },
  "2":   { label: "~2°C",               pathKey: "path20", removalKey: "removal20", color: "#a78bfa", desc: "Gradual reduction over 30 years, moderate removal" },
  "3":   { label: "~3°C (Current path)",pathKey: "path30", removalKey: "",          color: "#6b7280", desc: "Business as usual — catastrophic by end of century" },
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      backgroundColor: "#0d0d0d",
      border: "1px solid #2a2a2a",
      borderRadius: "6px",
      padding: "10px 14px",
      fontFamily: "var(--font-mono)",
      fontSize: "11px",
    }}>
      <p style={{ color: "#525252", marginBottom: "6px", fontSize: "10px" }}>{label}</p>
      {payload.map((p: any) => (
        p.value != null && (
          <p key={p.dataKey} style={{ color: p.color, margin: "2px 0" }}>
            {p.name}: <span style={{ color: "#f0ece4" }}>{Number(p.value).toFixed(1)} GtCO₂/yr</span>
          </p>
        )
      ))}
    </div>
  );
}

function CarbonChart() {
  const [scenario, setScenario] = useState<Scenario>("1.5");
  const cfg = SCENARIO_CONFIG[scenario];

  return (
    <div style={{ backgroundColor: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "2rem" }}>
      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#525252", whiteSpace: "nowrap" }}>
          Limit global temperature increase to:
        </span>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {(["1.5", "2", "3"] as Scenario[]).map(s => (
            <button
              key={s}
              onClick={() => setScenario(s)}
              style={{
                padding: "4px 12px",
                borderRadius: "20px",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
                border: scenario === s ? "none" : "1px solid #2a2a2a",
                backgroundColor: scenario === s ? SCENARIO_CONFIG[s].color : "transparent",
                color: scenario === s ? "#fff" : "#525252",
              }}
            >
              {SCENARIO_CONFIG[s].label}
            </button>
          ))}
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#3a3a3a", marginLeft: "auto" }}>
          {cfg.desc}
        </span>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {[
          { color: "#e5e7eb", dash: false, label: "Historical emissions" },
          { color: cfg.color, dash: true,  label: `${cfg.label} path` },
          ...(scenario !== "3" ? [{ color: "#6366f1", dash: false, label: "Carbon removal" }] : []),
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="20" height="8">
              <line
                x1="0" y1="4" x2="20" y2="4"
                stroke={l.color} strokeWidth="2"
                strokeDasharray={l.dash ? "4 3" : "none"}
              />
            </svg>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#525252", letterSpacing: "0.06em" }}>
              {l.label}
            </span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={CARBON_DATA} margin={{ top: 10, right: 30, bottom: 30, left: 10 }}>
          <CartesianGrid stroke="#222" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="year"
            tick={{ fontFamily: "monospace", fontSize: 11, fill: "#6b7280" }}
            axisLine={{ stroke: "#333" }}
            tickLine={false}
            label={{ value: "YEAR", position: "insideBottom", offset: -12, style: { fontFamily: "monospace", fontSize: 10, fill: "#4b5563", letterSpacing: "0.12em" } }}
          />
          <YAxis
            tick={{ fontFamily: "monospace", fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            domain={[-20, 55]}
            tickCount={8}
            label={{ value: "NET CO₂ (GtCO₂/YR)", angle: -90, position: "insideLeft", offset: 15, style: { fontFamily: "monospace", fontSize: 9, fill: "#4b5563", letterSpacing: "0.06em" } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#444" strokeWidth={1.5} />
          <ReferenceLine x={2020} stroke="#444" strokeWidth={1} strokeDasharray="5 4" label={{ value: "2020", position: "top", style: { fontFamily: "monospace", fontSize: 10, fill: "#6b7280" } }} />

          {/* Carbon removal shaded area (below zero) */}
          {scenario !== "3" && cfg.removalKey && (
            <Area
              dataKey={cfg.removalKey}
              name="Carbon removal"
              fill="rgba(99,102,241,0.18)"
              stroke="#6366f1"
              strokeWidth={1.5}
              connectNulls
              isAnimationActive
              dot={false}
            />
          )}

          {/* Historical solid line — bright white */}
          <Line
            dataKey="historical"
            name="Historical emissions"
            stroke="#e5e7eb"
            strokeWidth={3}
            dot={false}
            connectNulls
            isAnimationActive
          />

          {/* Scenario path — colored dashed */}
          <Line
            dataKey={cfg.pathKey}
            name={cfg.label}
            stroke={cfg.color}
            strokeWidth={2.5}
            strokeDasharray="7 4"
            dot={false}
            connectNulls
            isAnimationActive
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Bottom note */}
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#2a2a2a", marginTop: "1rem", lineHeight: 1.6 }}>
        Historical emissions via Global Carbon Project. Current path shows SSP4-6.0. Removal pathways adapted from CICERO/IPCC AR6.
        GreenLedger targets the carbon removal gap — every inference offset, every model decision optimised.
      </p>
    </div>
  );
}

/* ── Nav ───────────────────────────────────────────────────────── */
function Nav({ user }: { user: any }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        borderBottom: scrolled ? "1px solid #1a1a1a" : "1px solid transparent",
        backgroundColor: scrolled ? "rgba(9,11,9,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(24px)" : "none",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center transition-all"
            style={{ backgroundColor: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.22)" }}
          >
            <Leaf className="w-3.5 h-3.5" style={{ color: "#22c55e" }} />
          </div>
          <span className="text-sm font-bold" style={{ fontFamily: "var(--font-display)", color: "#ededed", letterSpacing: "-0.02em" }}>
            GreenLedger
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          {["Features", "How it works"].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`}
              className="text-xs transition-colors duration-100"
              style={{ color: "#525252", fontFamily: "var(--font-display)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#a1a1a1")}
              onMouseLeave={e => (e.currentTarget.style.color = "#525252")}
            >
              {item}
            </a>
          ))}
          <Link
            href={user ? "/dashboard" : "/login"}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all duration-150"
            style={{ backgroundColor: "#22c55e", color: "#000" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = "#4ade80")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = "#22c55e")}
          >
            {user ? "Dashboard" : "Get access"}
            <ArrowRight className="w-3 h-3" />
          </Link>
        </nav>
      </div>
    </header>
  );
}

/* ── Main page ─────────────────────────────────────────────────── */
export default function LandingPage() {
  const { user } = useUser();
  const co2 = useLiveCounter();

  return (
    <div style={{ backgroundColor: "#090b09", color: "#f0ece4", minHeight: "100vh" }}>
      <Nav user={user} />

      {/* ══════════════════════════════════════════════════════
          HERO — Live CO₂ counter + manifesto
      ══════════════════════════════════════════════════════ */}
      <section className="relative h-screen flex flex-col justify-center pt-14 overflow-hidden topo-bg">

        {/* Radial atmosphere */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 70% 60% at 30% 50%, rgba(217,119,6,0.055), transparent 65%)",
        }} />

        <div className="relative max-w-6xl mx-auto px-6 w-full">
          <div className="grid grid-cols-12 gap-10 items-center h-full">

            {/* ── LEFT: manifesto statement + headline + CTA ── */}
            <div className="col-span-7 flex flex-col justify-center">

              {/* Big statement */}
              <p
                className="font-black leading-tight mb-8"
                style={{
                  fontSize: "clamp(2rem, 3.6vw, 3.2rem)",
                  letterSpacing: "-0.04em",
                  color: "#f0ece4",
                }}
              >
                In 5 years, no serious company will deploy AI agents without{" "}
                <span style={{ color: "#22c55e" }}>carbon accountability.</span>
              </p>

              {/* Rule */}
              <div style={{ height: "1px", backgroundColor: "#1e1e1e", marginBottom: "1.5rem" }} />

              {/* Sub-headline + CTA */}
              <h1
                className="font-black leading-tight mb-3"
                style={{ fontSize: "clamp(1.2rem, 1.8vw, 1.6rem)", letterSpacing: "-0.03em", color: "#a1a1a1" }}
              >
                Track it.{" "}
                <span style={{ color: "#22c55e" }}>Route it.</span>
                {" "}Remove it.
              </h1>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "#444", maxWidth: "32rem" }}>
                GreenLedger is the carbon accountability layer for AI agents —
                routing to greener models, budgeting carbon per agent,
                and offsetting every inference. One SDK. No prompt rewrites.
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href={user ? "/dashboard" : "/login"}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-150"
                  style={{ backgroundColor: "#22c55e", color: "#000" }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = "#4ade80")}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = "#22c55e")}
                >
                  {user ? "Open Dashboard" : "Start for free"}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
                  style={{ color: "#5a5a5a", border: "1px solid #1e1e1e" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#a1a1a1"; (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#5a5a5a"; (e.currentTarget as HTMLElement).style.borderColor = "#1e1e1e"; }}
                >
                  See how it works <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* ── RIGHT: live counter + stats ── */}
            <div className="col-span-5 flex flex-col" style={{ borderLeft: "1px solid #1a1a1a", paddingLeft: "2.5rem" }}>

              {/* Label */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#d97706", display: "inline-block", boxShadow: "0 0 7px rgba(217,119,6,0.9)", animation: "pulse-green 1.5s ease-in-out infinite" }} />
                  <span style={{ color: "#d97706", fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                    Live · Global AI CO₂
                  </span>
                </div>
              </div>

              {/* Counter */}
              <span
                className="font-condensed block mb-1"
                style={{
                  fontSize: "clamp(4rem, 9vw, 8.5rem)",
                  color: "#d97706",
                  letterSpacing: "-0.04em",
                  lineHeight: 0.82,
                  textShadow: "0 0 120px rgba(217,119,6,0.2)",
                }}
              >
                {formatCounter(co2)}
              </span>
              <p style={{ color: "#3a2a12", fontFamily: "var(--font-mono)", fontSize: "10px", marginBottom: "1.25rem" }}>
                of CO₂ since tab opened · +23,148 g/sec
              </p>

              {/* Stats */}
              {[
                { value: "0.03–1.14g", label: "CO₂e per AI query", sub: "Up to 70× more for reasoning", green: false },
                { value: "90 TWh",     label: "AI data center demand 2026", sub: "10× increase from 2022", green: false },
                { value: "0",          label: "real-time AI carbon trackers", sub: "For agents. Until now.", green: true },
              ].map((s, i) => (
                <div key={i} style={{ borderTop: "1px solid #1a1a1a", paddingTop: "0.6rem", paddingBottom: "0.6rem" }}>
                  <span className="font-condensed block" style={{ fontSize: "clamp(1.6rem, 2.4vw, 2.2rem)", color: s.green ? "#22c55e" : "#c87d10", letterSpacing: "-0.02em", lineHeight: 0.9 }}>{s.value}</span>
                  <span className="block mt-0.5" style={{ fontSize: "11px", fontWeight: 500, color: "#4a4a4a" }}>{s.label}</span>
                  <span className="block" style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#2a2a2a" }}>{s.sub}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #1a1a1a" }} />
            </div>

          </div>
        </div>
      </section>

      {/* ── Ticker ───────────────────────────────────────────── */}
      <Ticker />

      {/* ══════════════════════════════════════════════════════
          THE PROBLEM — stark, urgent
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 px-6" style={{ backgroundColor: "#060808" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-12 gap-12 items-center">
            <div className="col-span-5">
              <p className="label mb-4" style={{ color: "#3a3a3a" }}>The problem</p>
              <h2
                className="font-black leading-tight mb-6"
                style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", letterSpacing: "-0.04em", color: "#f0ece4" }}
              >
                The infrastructure for agents to{" "}
                <span style={{ color: "#d97706" }}>spend money</span>
                {" "}exists.
                <br /><br />
                The infrastructure to account for their{" "}
                <span style={{ color: "#d97706" }}>environmental cost</span>
                {" "}does not.
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "#525252" }}>
                Stripe, Google, and Coinbase have built the payment rails for autonomous agents.
                161 million machine-to-machine transactions have already happened. $15 trillion
                in B2B spend is projected to flow through agent marketplaces by 2028.
                Every single transaction has a hidden carbon cost that nobody is measuring.
              </p>
            </div>

            <div className="col-span-7 space-y-3">
              {[
                {
                  company: "Google",
                  pct: 50,
                  label: "emissions increase",
                  detail: "Driven entirely by AI infrastructure",
                  color: "#d97706",
                },
                {
                  company: "Meta",
                  pct: 60,
                  label: "emissions increase",
                  detail: "AI training and inference workloads",
                  color: "#ef4444",
                },
                {
                  company: "Microsoft",
                  pct: 23,
                  label: "emissions increase",
                  detail: "Azure AI + Copilot deployment",
                  color: "#f59e0b",
                },
              ].map((item) => (
                <div
                  key={item.company}
                  className="flex items-center gap-4 rounded-xl p-4"
                  style={{ backgroundColor: "#0d0d0d", border: "1px solid #1a1a1a" }}
                >
                  <div className="w-28 shrink-0">
                    <span className="text-xs font-semibold" style={{ color: "#a1a1a1" }}>{item.company}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="font-condensed"
                        style={{ fontSize: "1.8rem", color: item.color, letterSpacing: "-0.02em", lineHeight: 1 }}
                      >
                        +{item.pct}%
                      </span>
                      <span className="text-xs" style={{ color: "#525252" }}>{item.label}</span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: "#1a1a1a" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${item.pct}%`,
                          backgroundColor: item.color,
                          opacity: 0.6,
                        }}
                      />
                    </div>
                    <p className="text-[10px] mt-1.5" style={{ color: "#3a3a3a", fontFamily: "var(--font-mono)" }}>
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
              <p className="text-xs pt-1" style={{ color: "#2a2a2a", fontFamily: "var(--font-mono)" }}>
                Source: Published sustainability reports 2024–2025
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURES — numbered editorial list
      ══════════════════════════════════════════════════════ */}
      <section id="features" className="py-24 px-6" style={{ borderTop: "1px solid #111" }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-14">
            <p className="label mb-3" style={{ color: "#3a3a3a" }}>The solution</p>
            <h2
              className="font-black"
              style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", letterSpacing: "-0.04em" }}
            >
              One SDK.{" "}
              <span style={{ color: "#22c55e" }}>Five primitives.</span>
              <br />
              <span style={{ color: "#3a3a3a" }}>Everything carbon, handled underneath.</span>
            </h2>
          </div>

          <div className="space-y-0">
            {FEATURES.map((f, i) => (
              <Link
                key={f.num}
                href={f.href}
                className="group flex items-start gap-8 py-7 transition-colors duration-150"
                style={{ borderTop: "1px solid #111" }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.01)")}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
              >
                <span
                  className="font-condensed shrink-0 mt-0.5"
                  style={{ fontSize: "2.5rem", color: "#1e1e1e", lineHeight: 1, letterSpacing: "-0.02em" }}
                >
                  {f.num}
                </span>

                <div className="flex-1 grid grid-cols-2 gap-8">
                  <div>
                    <h3
                      className="font-bold mb-2 transition-colors duration-150"
                      style={{
                        fontSize: "1.1rem",
                        color: "#f0ece4",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {f.name}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#525252" }}>
                      {f.description}
                    </p>
                  </div>
                  <div className="flex items-start">
                    <p className="text-xs leading-relaxed" style={{ color: "#2e2e2e", fontFamily: "var(--font-mono)" }}>
                      {f.detail}
                    </p>
                  </div>
                </div>

                <ArrowUpRight
                  className="w-4 h-4 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  style={{ color: "#22c55e" }}
                />
              </Link>
            ))}
            <div style={{ borderTop: "1px solid #111" }} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          THE STAKES — interactive carbon pathways chart
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 px-6" style={{ backgroundColor: "#060808", borderTop: "1px solid #111" }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <p className="label mb-3" style={{ color: "#3a3a3a" }}>The stakes</p>
            <h2
              className="font-black"
              style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", letterSpacing: "-0.04em" }}
            >
              The path we take
              <span style={{ color: "#3a3a3a" }}> depends on removal.</span>
            </h2>
            <p className="text-sm mt-4" style={{ color: "#525252", maxWidth: "36rem" }}>
              Every tonne of CO₂ that doesn&apos;t get removed is a debt on the 1.5°C budget.
              GreenLedger routes every AI inference levy directly to verified carbon removal via Stripe Climate.
            </p>
          </div>
          <CarbonChart />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS — visual workflow
      ══════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 px-6" style={{ borderTop: "1px solid #111" }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-14">
            <p className="label mb-3" style={{ color: "#3a3a3a" }}>How it works</p>
            <h2
              className="font-black"
              style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", letterSpacing: "-0.04em" }}
            >
              Every inference.
              <span style={{ color: "#3a3a3a" }}> Accounted for.</span>
            </h2>
          </div>

          {/* ── Horizontal flow ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto 1fr auto 1fr auto 1fr", alignItems: "center", gap: 0, marginBottom: "3rem" }}>
            {[
              {
                num: "01",
                title: "Prompt Sent",
                desc: "Your agent calls GreenLedger instead of the model provider directly. One line change.",
                color: "#525252",
                tag: "agent",
              },
              {
                num: "02",
                title: "Router Scores",
                desc: "Complexity classifier evaluates the prompt. Grid carbon intensity checked by region.",
                color: "#f59e0b",
                tag: "router",
              },
              {
                num: "03",
                title: "Model Selected",
                desc: "Cheapest model that meets your quality bar is chosen. Haiku handles ~80% of typical tasks.",
                color: "#22c55e",
                tag: "routing",
              },
              {
                num: "04",
                title: "Response + Receipt",
                desc: "Inference runs. Response returned to your agent alongside a full environmental receipt.",
                color: "#60a5fa",
                tag: "inference",
              },
              {
                num: "05",
                title: "Offset + Audit",
                desc: "Micro-levy routed to Stripe Climate. Receipt logged to dashboard. Budget deducted.",
                color: "#22c55e",
                tag: "offset",
              },
            ].map((step, i) => (
              <>
                <div
                  key={step.num}
                  style={{
                    padding: "1.5rem 1.25rem",
                    borderTop: `2px solid ${step.color}`,
                    backgroundColor: "#0d0d0d",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                    minHeight: "180px",
                  }}
                >
                  <span
                    className="font-condensed"
                    style={{ fontSize: "2.2rem", color: step.color, letterSpacing: "-0.02em", lineHeight: 1 }}
                  >
                    {step.num}
                  </span>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "#f0ece4", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                    {step.title}
                  </p>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#3a3a3a", lineHeight: 1.6 }}>
                    {step.desc}
                  </p>
                </div>
                {i < 4 && (
                  <div key={`arrow-${i}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                    <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
                      <path d="M0 6H17M17 6L12 1M17 6L12 11" stroke="#2a2a2a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </>
            ))}
          </div>

          {/* ── Receipt preview strip ── */}
          <div
            style={{
              backgroundColor: "#0a0f0a",
              border: "1px solid rgba(34,197,94,0.12)",
              borderRadius: "8px",
              padding: "1.25rem 1.5rem",
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "1.5rem",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#22c55e", boxShadow: "0 0 6px #22c55e", display: "inline-block" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#22c55e", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                Sample Receipt
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1.5rem" }}>
              {[
                { label: "Requested", value: "opus-4-6" },
                { label: "Routed to", value: "haiku-4-5", green: true },
                { label: "CO₂e", value: "0.047g" },
                { label: "Energy", value: "0.20 Wh" },
                { label: "Water", value: "0.36 mL" },
                { label: "Savings", value: "80%", green: true },
                { label: "Levy", value: "$0.000024 → Stripe Climate" },
              ].map((f) => (
                <div key={f.label}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#2a2a2a", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "3px" }}>{f.label}</p>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700, color: (f as any).green ? "#22c55e" : "#5a5a5a" }}>{f.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          MANIFESTO CTA
      ══════════════════════════════════════════════════════ */}
      <section className="py-32 px-6 relative overflow-hidden topo-bg" style={{ borderTop: "1px solid #111" }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 50% 70% at 50% 50%, rgba(34,197,94,0.04), transparent 70%)",
        }} />
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="label mb-5" style={{ color: "#2a2a2a" }}>The bet</p>
          <h2
            className="font-black leading-tight mb-6 text-balance"
            style={{ fontSize: "clamp(2.4rem, 5.5vw, 4.5rem)", letterSpacing: "-0.04em" }}
          >
            In 5 years, no serious company will deploy AI agents without carbon accountability.
          </h2>
          <p className="text-lg mb-10" style={{ color: "#3a3a3a" }}>
            The same way no serious company deploys software without security today.
          </p>
          <div className="flex items-center justify-center gap-2 text-2xl font-black mb-10" style={{ color: "#22c55e", fontFamily: "var(--font-condensed)", letterSpacing: "0.05em" }}>
            WE WANT TO BE THE DEFAULT WAY THAT HAPPENS.
          </div>
          <Link
            href={user ? "/dashboard" : "/login"}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold transition-all duration-150"
            style={{ backgroundColor: "#22c55e", color: "#000" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = "#4ade80")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = "#22c55e")}
          >
            {user ? "Open Dashboard" : "Get started free"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-5" style={{ borderTop: "1px solid #111" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-3.5 h-3.5" style={{ color: "#22c55e" }} />
            <span className="text-xs font-semibold" style={{ color: "#2a2a2a", fontFamily: "var(--font-display)" }}>GreenLedger</span>
          </div>
          <p className="text-xs" style={{ color: "#2a2a2a", fontFamily: "var(--font-mono)" }}>
            Carbon accountability for the agentic AI economy.
          </p>
        </div>
      </footer>

    </div>
  );
}
