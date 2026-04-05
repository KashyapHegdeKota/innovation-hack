"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";
import { ArrowRight, ArrowUpRight, Leaf } from "lucide-react";

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


/* ── Carbon pathways chart — pure SVG, no Recharts ─────────────── */
type Scenario = "1.5" | "2" | "3";

// [year, historical, path15, path20, path30, removal15, removal20]
// historical=NaN for future years, path/removal=NaN for historical years
const RAW: [number, number, number, number, number, number, number][] = [
  [1980, 22.5, NaN, NaN, NaN, NaN, NaN],
  [1985, 23.8, NaN, NaN, NaN, NaN, NaN],
  [1990, 26.1, NaN, NaN, NaN, NaN, NaN],
  [1995, 27.4, NaN, NaN, NaN, NaN, NaN],
  [2000, 29.2, NaN, NaN, NaN, NaN, NaN],
  [2005, 32.8, NaN, NaN, NaN, NaN, NaN],
  [2010, 35.6, NaN, NaN, NaN, NaN, NaN],
  [2015, 38.2, NaN, NaN, NaN, NaN, NaN],
  [2020, 41.8, 41.8, 41.8, 41.8,  0.0,  0.0],
  [2025,  NaN, 36.0, 39.5, 43.2, -1.0, -0.4],
  [2030,  NaN, 28.0, 35.0, 44.8, -2.5, -0.9],
  [2035,  NaN, 19.0, 29.5, 45.5, -4.2, -1.6],
  [2040,  NaN, 10.5, 23.0, 45.8, -5.8, -2.4],
  [2045,  NaN,  3.5, 16.0, 45.5, -7.0, -3.2],
  [2050,  NaN, -1.5,  9.0, 44.8, -8.0, -4.0],
  [2055,  NaN, -4.5,  3.5, 43.2, -8.8, -4.8],
  [2060,  NaN, -6.5, -1.0, 41.5, -9.4, -5.5],
  [2065,  NaN, -7.8, -4.0, 39.5, -9.8, -6.2],
  [2070,  NaN, -8.8, -6.5, 37.5,-10.0, -6.8],
  [2075,  NaN, -9.5, -8.5, 35.0,-10.2, -7.2],
  [2080,  NaN,-10.0, -9.8, 32.0,-10.3, -7.5],
  [2085,  NaN,-10.4,-10.5, 29.0,-10.3, -7.8],
  [2090,  NaN,-10.6,-10.8, 26.0,-10.2, -8.0],
  [2095,  NaN,-10.7,-11.0, 23.5,-10.1, -8.1],
  [2100,  NaN,-10.8,-11.2, 21.5,-10.0, -8.2],
];

const SCENARIOS: Record<Scenario, { label: string; color: string; pathIdx: number; removalIdx: number | null; desc: string }> = {
  "1.5": { label: "~1.5°C",              color: "#60a5fa", pathIdx: 2, removalIdx: 5, desc: "Aggressive cuts + large-scale carbon removal" },
  "2":   { label: "~2°C",                color: "#a78bfa", pathIdx: 3, removalIdx: 6, desc: "Gradual reduction over 30 years, moderate removal" },
  "3":   { label: "~3°C (Current path)", color: "#9ca3af", pathIdx: 4, removalIdx: null, desc: "Business as usual — catastrophic warming" },
};

function CarbonChart() {
  const [scenario, setScenario] = useState<Scenario>("1.5");
  const [hoverX, setHoverX] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const cfg = SCENARIOS[scenario];

  // Chart dimensions
  const W = 900, H = 340;
  const PAD = { top: 16, right: 24, bottom: 40, left: 52 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const MIN_Y = -20, MAX_Y = 55;
  const MIN_X = 1980, MAX_X = 2100;

  const toX = (year: number) => PAD.left + ((year - MIN_X) / (MAX_X - MIN_X)) * cW;
  const toY = (val: number)  => PAD.top  + ((MAX_Y - val)  / (MAX_Y - MIN_Y)) * cH;

  // Build SVG path from data column (skip NaN)
  const makePath = (colIdx: number) => {
    const pts = RAW.filter(r => !isNaN(r[colIdx]));
    if (pts.length === 0) return "";
    return pts.map((r, i) => `${i === 0 ? "M" : "L"}${toX(r[0]).toFixed(1)},${toY(r[colIdx]).toFixed(1)}`).join(" ");
  };

  // Removal area polygon (fill between removal line and y=0)
  const makeRemovalArea = (colIdx: number) => {
    const pts = RAW.filter(r => !isNaN(r[colIdx]));
    if (pts.length === 0) return "";
    const top = pts.map(r => `${toX(r[0]).toFixed(1)},${toY(0).toFixed(1)}`).join(" ");
    const bottom = pts.map(r => `${toX(r[0]).toFixed(1)},${toY(r[colIdx]).toFixed(1)}`).reverse().join(" ");
    return `M ${top} L ${bottom} Z`;
  };

  // Hover tooltip
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = W / rect.width;
    const mx = (e.clientX - rect.left) * scaleX;
    const year = MIN_X + ((mx - PAD.left) / cW) * (MAX_X - MIN_X);
    setHoverX(Math.round(year / 5) * 5);
  };

  const hoverRow = hoverX ? RAW.find(r => r[0] === hoverX) : null;

  const yTicks = [-20, -10, 0, 10, 20, 30, 40, 50];
  const xTicks = [1980, 1990, 2000, 2010, 2020, 2030, 2040, 2050, 2060, 2070, 2080, 2090, 2100];

  return (
    <div style={{ backgroundColor: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: "12px", padding: "1.75rem" }}>
      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#6b7280", whiteSpace: "nowrap" }}>
          Limit temperature increase to:
        </span>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {(["1.5", "2", "3"] as Scenario[]).map(s => (
            <button key={s} onClick={() => setScenario(s)} style={{
              padding: "4px 14px", borderRadius: "20px",
              fontFamily: "monospace", fontSize: "11px", fontWeight: 600, cursor: "pointer",
              border: scenario === s ? "none" : "1px solid #2a2a2a",
              backgroundColor: scenario === s ? SCENARIOS[s].color : "transparent",
              color: scenario === s ? "#000" : "#6b7280",
              transition: "all 0.15s",
            }}>
              {SCENARIOS[s].label}
            </button>
          ))}
        </div>
        <span style={{ fontFamily: "monospace", fontSize: "10px", color: "#374151", marginLeft: "auto" }}>
          {cfg.desc}
        </span>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "1.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
        {[
          { color: "#d1d5db", dash: false, label: "Historical emissions" },
          { color: cfg.color,  dash: true,  label: `${cfg.label} path` },
          ...(cfg.removalIdx !== null ? [{ color: "#818cf8", dash: false, label: "Carbon removal" }] : []),
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="22" height="8">
              <line x1="0" y1="4" x2="22" y2="4" stroke={l.color} strokeWidth="2" strokeDasharray={l.dash ? "5 3" : undefined} />
            </svg>
            <span style={{ fontFamily: "monospace", fontSize: "10px", color: "#6b7280" }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* SVG Chart */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block", cursor: "crosshair" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverX(null)}
      >
        {/* Y gridlines */}
        {yTicks.map(v => (
          <g key={v}>
            <line x1={PAD.left} y1={toY(v)} x2={W - PAD.right} y2={toY(v)} stroke="#1f2937" strokeWidth="1" />
            <text x={PAD.left - 6} y={toY(v) + 4} textAnchor="end" fill="#6b7280" fontSize="10" fontFamily="monospace">{v}</text>
          </g>
        ))}

        {/* X axis ticks */}
        {xTicks.map(yr => (
          <g key={yr}>
            <text x={toX(yr)} y={H - PAD.bottom + 16} textAnchor="middle" fill="#6b7280" fontSize="10" fontFamily="monospace">{yr}</text>
          </g>
        ))}

        {/* Y=0 zero line */}
        <line x1={PAD.left} y1={toY(0)} x2={W - PAD.right} y2={toY(0)} stroke="#374151" strokeWidth="1.5" />

        {/* 2020 divider */}
        <line x1={toX(2020)} y1={PAD.top} x2={toX(2020)} y2={H - PAD.bottom} stroke="#374151" strokeWidth="1" strokeDasharray="5 4" />
        <text x={toX(2020)} y={PAD.top - 4} textAnchor="middle" fill="#4b5563" fontSize="10" fontFamily="monospace">2020</text>

        {/* Axis labels */}
        <text x={PAD.left - 40} y={PAD.top + cH / 2} textAnchor="middle" fill="#4b5563" fontSize="9" fontFamily="monospace"
          transform={`rotate(-90, ${PAD.left - 40}, ${PAD.top + cH / 2})`}>
          NET CO₂ (GtCO₂/YR)
        </text>
        <text x={PAD.left + cW / 2} y={H - 4} textAnchor="middle" fill="#4b5563" fontSize="9" fontFamily="monospace" letterSpacing="2">YEAR</text>

        {/* Carbon removal area */}
        {cfg.removalIdx !== null && (
          <path d={makeRemovalArea(cfg.removalIdx)} fill="rgba(99,102,241,0.15)" />
        )}

        {/* Historical line */}
        <path d={makePath(1)} fill="none" stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Scenario path */}
        <path d={makePath(cfg.pathIdx)} fill="none" stroke={cfg.color} strokeWidth="2.5"
          strokeDasharray="8 5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Removal line */}
        {cfg.removalIdx !== null && (
          <path d={makePath(cfg.removalIdx)} fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* 2020 dot */}
        <circle cx={toX(2020)} cy={toY(41.8)} r="4" fill="#0d0d0d" stroke="#d1d5db" strokeWidth="2" />

        {/* Hover crosshair + tooltip */}
        {hoverX !== null && hoverRow && (
          <>
            <line x1={toX(hoverX)} y1={PAD.top} x2={toX(hoverX)} y2={H - PAD.bottom}
              stroke="#4b5563" strokeWidth="1" strokeDasharray="3 3" />
            {/* tooltip box */}
            {(() => {
              const tx = toX(hoverX);
              const boxX = tx > W - 160 ? tx - 145 : tx + 10;
              const vals = [
                { label: "Historical", v: hoverRow[1], color: "#d1d5db" },
                { label: cfg.label,    v: hoverRow[cfg.pathIdx], color: cfg.color },
                ...(cfg.removalIdx !== null ? [{ label: "Removal", v: hoverRow[cfg.removalIdx], color: "#818cf8" }] : []),
              ].filter(x => !isNaN(x.v));
              if (vals.length === 0) return null;
              return (
                <g>
                  <rect x={boxX} y={PAD.top + 4} width="130" height={14 + vals.length * 16}
                    rx="4" fill="#111827" stroke="#374151" strokeWidth="1" />
                  <text x={boxX + 8} y={PAD.top + 16} fill="#9ca3af" fontSize="10" fontFamily="monospace">{hoverX}</text>
                  {vals.map((v, i) => (
                    <text key={v.label} x={boxX + 8} y={PAD.top + 30 + i * 16} fill={v.color} fontSize="10" fontFamily="monospace">
                      {v.label}: {v.v.toFixed(1)} Gt
                    </text>
                  ))}
                </g>
              );
            })()}
          </>
        )}
      </svg>

      <p style={{ fontFamily: "monospace", fontSize: "9px", color: "#374151", marginTop: "0.75rem", lineHeight: 1.6 }}>
        Source: Global Carbon Project (historical) · CICERO/IPCC AR6 (pathways) · GreenLedger routes every inference levy to verified carbon removal.
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
