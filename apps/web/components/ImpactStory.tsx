"use client";

import { motion } from "framer-motion";
import { Trees, Car, Smartphone, Leaf } from "lucide-react";

interface ImpactStoryProps {
  co2SavedG: number;       // grams of CO2 avoided
  carbonRemovedG: number;  // grams sent to Stripe Climate
  totalInferences: number;
}

// Conversion constants
const TREE_ABSORBS_G_PER_YEAR = 21_000; // ~21kg CO2/year per tree
const CAR_EMITS_G_PER_MILE    = 404;    // ~404g CO2/mile
const PHONE_CHARGE_G          = 8.22;   // ~8.22g CO2 per phone charge

function ImpactCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
  delay,
  description,
}: {
  icon: any;
  label: string;
  value: string;
  unit: string;
  color: string;
  delay: number;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className="relative rounded-xl border glow-hover instrument overflow-hidden group"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${color}66, transparent)` }} />

      <div className="p-4 pb-3">
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
          style={{ backgroundColor: `${color}11`, border: `1px solid ${color}22` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-1 mb-1 data-flicker">
          <span
            className="font-black leading-none"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "clamp(1.4rem, 2vw, 1.8rem)",
              letterSpacing: "-0.05em",
              color,
            }}
          >
            {value}
          </span>
          <span className="text-xs font-medium" style={{ color: `${color}99`, fontFamily: "var(--font-mono)" }}>
            {unit}
          </span>
        </div>

        {/* Label */}
        <p className="text-[11px] font-semibold mb-0.5" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-display)" }}>
          {label}
        </p>
        <p className="terminal-label">{description}</p>
      </div>

      {/* Bottom accent */}
      <div
        className="h-px mx-4 mb-3"
        style={{ background: `linear-gradient(90deg, ${color}55, ${color}11, transparent)`, opacity: 0.6 }}
      />
    </motion.div>
  );
}

export default function ImpactStory({ co2SavedG, carbonRemovedG, totalInferences }: ImpactStoryProps) {
  const treeDays   = co2SavedG > 0 ? (co2SavedG / TREE_ABSORBS_G_PER_YEAR * 365).toFixed(1) : "0";
  const milesSaved = co2SavedG > 0 ? (co2SavedG / CAR_EMITS_G_PER_MILE).toFixed(2)          : "0";
  const phones     = co2SavedG > 0 ? Math.round(co2SavedG / PHONE_CHARGE_G).toString()       : "0";
  const removedMg  = carbonRemovedG > 0 ? (carbonRemovedG * 1000).toFixed(0)                 : "0";

  const cards = [
    {
      icon: Trees,
      label: "Tree absorption equivalent",
      value: treeDays,
      unit: "tree-days",
      color: "#22c55e",
      delay: 0.0,
      description: "CO₂ a tree would absorb in that many days",
    },
    {
      icon: Car,
      label: "Driving equivalent avoided",
      value: milesSaved,
      unit: "miles",
      color: "#14b8a6",
      delay: 0.1,
      description: "Equivalent car driving emissions saved",
    },
    {
      icon: Smartphone,
      label: "Phone charges equivalent",
      value: phones,
      unit: "charges",
      color: "#a855f7",
      delay: 0.2,
      description: "CO₂ of that many smartphone charges",
    },
    {
      icon: Leaf,
      label: "Carbon permanently removed",
      value: removedMg,
      unit: "mg",
      color: "#f59e0b",
      delay: 0.3,
      description: "Sent to Stripe Climate for removal",
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <p className="terminal-label" style={{ color: "var(--text-muted)" }}>Environmental Impact</p>
        <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
        <p className="terminal-label" style={{ color: "var(--green)" }}>
          {co2SavedG.toFixed(3)}g CO₂ total savings
        </p>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {cards.map((c) => (
          <ImpactCard key={c.label} {...c} />
        ))}
      </div>
    </div>
  );
}
