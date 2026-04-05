"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";

const item = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const } },
};

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="relative group"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--rule)",
        borderRadius: "6px",
        padding: "0.75rem 1rem",
        marginTop: "0.5rem",
      }}
    >
      <pre style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-primary)", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--rule)", color: copied ? "#22c55e" : "var(--text-muted)" }}
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      </button>
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <motion.div variants={item} style={{ display: "grid", gridTemplateColumns: "40px 1fr", gap: "1.25rem", paddingBottom: "2rem", borderBottom: "1px solid var(--rule)", marginBottom: "2rem" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          border: "1px solid var(--green-accent)",
          backgroundColor: "rgba(34,197,94,0.06)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700,
          color: "var(--green-accent)", flexShrink: 0,
        }}>
          {number}
        </div>
        <div style={{ width: "1px", flex: 1, backgroundColor: "var(--rule)" }} />
      </div>
      <div style={{ paddingTop: "4px" }}>
        <p style={{ fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
          {title}
        </p>
        {children}
      </div>
    </motion.div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "0.5rem", lineHeight: 1.6 }}>
      {children}
    </p>
  );
}

export default function CliInstallPage() {
  return (
    <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}>

      {/* Header */}
      <motion.div variants={item} className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-black" style={{ fontSize: "1.75rem", letterSpacing: "-0.04em", color: "var(--text-primary)", lineHeight: 1 }}>
            CLI Installation
          </h1>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "5px" }}>
            Connect the GreenLedger CLI to track your AI agent emissions
          </p>
        </div>
      </motion.div>

      {/* Steps */}
      <div>

        <Step number={1} title="Install the CLI">
          <Note>Requires Python 3.11+. Run this in your terminal:</Note>
          <CodeBlock code="pip install greenledger" />
          <Note>Verify the install worked:</Note>
          <CodeBlock code="python3 -m cli.main --version" />
        </Step>

        <Step number={2} title="Run setup & log in">
          <Note>This opens a browser window to authenticate with your Google account — the same one you used to log into this dashboard.</Note>
          <CodeBlock code="python3 -m cli.main setup" />
          <Note>Enter your API keys when prompted (Anthropic, OpenAI, etc.). Press Enter to skip any you don&apos;t have.</Note>
        </Step>

        <Step number={3} title="Point the CLI at the live backend">
          <Note>Set these environment variables so the CLI sends data to the deployed backend instead of localhost:</Note>
          <CodeBlock code={`export ROUTER_URL=https://innovation-hack.onrender.com/v1/analyze
export INFER_URL=https://innovation-hack.onrender.com/v1/infer
export RECEIPTS_URL=https://innovation-hack.onrender.com/v1/receipts`} />
          <Note>To make these permanent, add them to your ~/.zshrc or ~/.bashrc.</Note>
        </Step>

        <Step number={4} title="Start the CLI and run a query">
          <Note>Launch the interactive CLI:</Note>
          <CodeBlock code="python3 -m cli.main" />
          <Note>Select a model, type a prompt, and send it. You&apos;ll see an environmental receipt after each response.</Note>
        </Step>

        <motion.div variants={item} style={{ display: "grid", gridTemplateColumns: "40px 1fr", gap: "1.25rem", paddingBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "4px" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              border: "1px solid var(--green-accent)",
              backgroundColor: "rgba(34,197,94,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700,
              color: "var(--green-accent)", flexShrink: 0,
            }}>
              5
            </div>
          </div>
          <div style={{ paddingTop: "4px" }}>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
              View your data on the dashboard
            </p>
            <Note>Refresh this dashboard after sending a query. Your receipts will appear in Overview → Recent Activity and in the Receipts page. Each agent you run shows up separately in the Agents leaderboard.</Note>
            <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", backgroundColor: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: "6px" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#22c55e" }}>
                ✓ You&apos;re all set — every query is now carbon-tracked automatically.
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
