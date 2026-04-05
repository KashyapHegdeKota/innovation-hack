"use client";

import { Construction } from "lucide-react";

export default function LevyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Carbon Levy</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Micro-levies routed to verified carbon removal via Stripe Climate</p>
      </div>
      <div className="rounded-xl border p-16 flex flex-col items-center justify-center gap-4"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
        <Construction className="w-8 h-8" style={{ color: "var(--text-muted)" }} />
        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>In progress — being built by the team</p>
      </div>
    </div>
  );
}
