"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Leaf, Check, X } from "lucide-react";
import { useUser } from "@auth0/nextjs-auth0/client";

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

const WITHOUT = [
  "Teams pick AI models based on habit, not efficiency",
  "No visibility into carbon footprint per request",
  "Flagship models used for trivial tasks",
  "Zero audit trail for AI infrastructure decisions",
  "ESG reports built from estimates and guesswork",
];

const WITH = [
  "Automatic routing to most efficient qualified model",
  "Real-time CO₂ accounting for every single inference",
  "Complexity-matched routing — ~23% cost reduction",
  "Full request log with routing rationale",
  "Accurate, auditable environmental reporting",
];

const BEFORE_CODE = `import anthropic

client = anthropic.Anthropic()
response = client.messages.create(
    model="claude-opus-4-6",    # Most capable = most carbon
    messages=[{"role": "user",
               "content": "Summarize this email..."}]
)

# No idea what this cost the planet.`;

const AFTER_CODE = `import greenledger

gl = greenledger.Client(api_key="gl_...")
response = gl.infer(
    prompt="Summarize this email...",
    quality="standard",          # GL picks greenest match
    agent_id="inbox-agent",
)

print(response.receipt)
# { model: "claude-haiku-3",    ← auto-selected
#   co2e: "0.08g",  energy: "0.28Wh",
#   region: "us-west-2 (78% renewable)",
#   offset: "$0.001" → Stripe Climate }`;

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

/* ── Code block ────────────────────────────────────────────────── */
function Code({ code, label, accent }: { code: string; label: string; accent?: boolean }) {
  return (
    <div className="rounded-xl overflow-hidden h-full" style={{
      border: `1px solid ${accent ? "rgba(34,197,94,0.2)" : "#1e1e1e"}`,
      backgroundColor: accent ? "#090f09" : "#0d0d0d",
    }}>
      <div className="flex items-center gap-1.5 px-4 py-2.5" style={{ borderBottom: `1px solid ${accent ? "#1a2e1a" : "#1a1a1a"}` }}>
        {[accent ? "#1e3a1e" : "#2a2a2a", "#1e1e1e", "#1e1e1e"].map((c, i) => (
          <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
        ))}
        <span className="text-[10px] ml-2" style={{ color: accent ? "rgba(34,197,94,0.45)" : "#3a3a3a", fontFamily: "var(--font-mono)" }}>
          {label}
        </span>
      </div>
      <pre className="px-4 py-4 text-xs leading-relaxed overflow-x-auto" style={{
        fontFamily: "var(--font-mono)",
        color: accent ? "#7ec87e" : "#4a4a4a",
        margin: 0,
        whiteSpace: "pre",
      }}>
        {code}
      </pre>
    </div>
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
          WITHOUT / WITH
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 px-6" style={{ backgroundColor: "#060808", borderTop: "1px solid #111" }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <p className="label mb-3" style={{ color: "#3a3a3a" }}>Why it matters</p>
            <h2
              className="font-black"
              style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", letterSpacing: "-0.04em" }}
            >
              One integration.
              <span style={{ color: "#3a3a3a" }}> Everything changes.</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 rounded-xl overflow-hidden" style={{ border: "1px solid #1a1a1a" }}>
            {/* Without */}
            <div className="p-8" style={{ borderRight: "1px solid #1a1a1a" }}>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <X className="w-3 h-3" style={{ color: "#f87171" }} />
                </div>
                <span className="text-sm font-medium" style={{ color: "#525252" }}>Without GreenLedger</span>
              </div>
              <ul className="space-y-4">
                {WITHOUT.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <X className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "rgba(239,68,68,0.3)" }} />
                    <span className="text-sm" style={{ color: "#3a3a3a" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* With */}
            <div className="p-8" style={{ backgroundColor: "#0a0f0a" }}>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.18)" }}>
                  <Check className="w-3 h-3" style={{ color: "#22c55e" }} />
                </div>
                <span className="text-sm font-medium" style={{ color: "#a1a1a1" }}>With GreenLedger</span>
              </div>
              <ul className="space-y-4">
                {WITH.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#22c55e" }} />
                    <span className="text-sm" style={{ color: "#8a8a8a" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS — code comparison
      ══════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 px-6" style={{ borderTop: "1px solid #111" }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <p className="label mb-3" style={{ color: "#3a3a3a" }}>Developer experience</p>
            <h2
              className="font-black"
              style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", letterSpacing: "-0.04em" }}
            >
              One wrapper.
              <span style={{ color: "#3a3a3a" }}> Everything handled.</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 items-stretch">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <X className="w-2.5 h-2.5" style={{ color: "#f87171" }} />
                </div>
                <span className="text-xs" style={{ color: "#3a3a3a" }}>Without carbon awareness</span>
              </div>
              <Code code={BEFORE_CODE} label="without.py" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.18)" }}>
                  <Check className="w-2.5 h-2.5" style={{ color: "#22c55e" }} />
                </div>
                <span className="text-xs" style={{ color: "#6a6a6a" }}>With GreenLedger</span>
              </div>
              <Code code={AFTER_CODE} label="with_greenledger.py" accent />
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
