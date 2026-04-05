"use client";

import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea, Label } from "recharts";
import { motion } from "framer-motion";

/* ── Model benchmark data ──────────────────────────────────────── */
/* co2: relative energy index (1=lowest, 10=highest)
   capability: quality/task-score (0–100)
   usage: bubble size proxy */
const MODELS = [
  { name: "Haiku 3",        co2: 1.2,  capability: 70,  usage: 48, optimal: true  },
  { name: "Haiku 3.5",      co2: 1.6,  capability: 76,  usage: 42, optimal: true  },
  { name: "GPT-4o Mini",    co2: 1.8,  capability: 74,  usage: 38, optimal: true  },
  { name: "Gemini Flash",   co2: 1.5,  capability: 73,  usage: 35, optimal: true  },
  { name: "GPT-3.5 Turbo",  co2: 2.4,  capability: 67,  usage: 22, optimal: true  },
  { name: "Sonnet 3",       co2: 4.8,  capability: 85,  usage: 30, optimal: false },
  { name: "Gemini Pro",     co2: 5.2,  capability: 87,  usage: 15, optimal: false },
  { name: "Sonnet 3.5",     co2: 6.4,  capability: 92,  usage: 18, optimal: false },
  { name: "GPT-4o",         co2: 7.1,  capability: 91,  usage: 12, optimal: false },
  { name: "GPT-4 Turbo",    co2: 8.6,  capability: 93,  usage: 8,  optimal: false },
  { name: "Opus 3",         co2: 9.5,  capability: 97,  usage: 5,  optimal: false },
];

const OPTIMAL = MODELS.filter(m => m.optimal);
const OTHER   = MODELS.filter(m => !m.optimal);

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;
  const r = Math.max(5, Math.sqrt(payload.usage) * 1.4);
  const isOptimal = payload.optimal;
  return (
    <g>
      <circle
        cx={cx} cy={cy} r={r}
        fill={isOptimal ? "rgba(34,197,94,0.18)" : "rgba(161,161,161,0.12)"}
        stroke={isOptimal ? "#22c55e" : "#3a3a3a"}
        strokeWidth={1.5}
      />
      <text
        x={cx} y={cy - r - 5}
        textAnchor="middle"
        style={{
          fill: isOptimal ? "#a1a1a1" : "#525252",
          fontSize: "10px",
          fontFamily: "var(--font-mono)",
        }}
      >
        {payload.name}
      </text>
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      className="rounded-lg px-3 py-2.5 text-xs"
      style={{
        backgroundColor: "var(--bg-raised)",
        border: "1px solid var(--border-bright)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
      }}
    >
      <p className="font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>{d.name}</p>
      <div className="space-y-0.5">
        <div className="flex justify-between gap-6">
          <span style={{ color: "var(--text-muted)" }}>Carbon index</span>
          <span style={{ color: d.optimal ? "var(--green-accent)" : "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
            {d.co2.toFixed(1)} / 10
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span style={{ color: "var(--text-muted)" }}>Capability</span>
          <span style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{d.capability}</span>
        </div>
        {d.optimal && (
          <p className="mt-2 text-[10px]" style={{ color: "var(--green-accent)" }}>
            ✓ Preferred by Green Router
          </p>
        )}
      </div>
    </div>
  );
};

export default function ModelMatrix() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="rounded-xl"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
            >
              Model Intelligence Matrix
            </h3>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              Carbon footprint vs. capability — Green Router targets the optimal zone
            </p>
          </div>
          <div className="flex items-center gap-4 mt-0.5">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--green-accent)", opacity: 0.7 }} />
              <span className="label">Green Router picks</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#3a3a3a" }} />
              <span className="label">Available models</span>
            </div>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 10, right: 40, bottom: 40, left: 10 }}>
          {/* Optimal zone shading */}
          <ReferenceArea
            x1={0} x2={3.5}
            y1={65} y2={100}
            fill="rgba(34,197,94,0.04)"
            stroke="rgba(34,197,94,0.12)"
            strokeDasharray="4 4"
          />

          <XAxis
            type="number" dataKey="co2"
            domain={[0, 11]}
            name="Carbon Index"
            tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-mono)" }}
            axisLine={{ stroke: "var(--border-bright)" }}
            tickLine={false}
          >
            <Label
              value="← Greener                              Higher Carbon →"
              position="bottom"
              offset={20}
              style={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-mono)" }}
            />
          </XAxis>
          <YAxis
            type="number" dataKey="capability"
            domain={[55, 100]}
            name="Capability"
            tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-mono)" }}
            axisLine={{ stroke: "var(--border-bright)" }}
            tickLine={false}
          >
            <Label
              value="Capability"
              angle={-90}
              position="insideLeft"
              offset={20}
              style={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-mono)" }}
            />
          </YAxis>

          <Tooltip content={<CustomTooltip />} cursor={false} />

          {/* Non-optimal models */}
          <Scatter
            name="Standard"
            data={OTHER}
            shape={<CustomDot />}
          />

          {/* Optimal models (Green Router picks) */}
          <Scatter
            name="Optimal"
            data={OPTIMAL}
            shape={<CustomDot />}
          />
        </ScatterChart>
      </ResponsiveContainer>

      {/* Annotation strip */}
      <div
        className="mx-6 mb-5 px-4 py-2.5 rounded-lg flex items-center gap-3"
        style={{ backgroundColor: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.12)" }}
      >
        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "var(--green-accent)" }} />
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          <span style={{ color: "var(--green-accent)", fontWeight: 500 }}>Green Router</span>
          {" "}automatically routes requests to models in the optimal zone — high capability, minimal carbon footprint.
          Flagship models are used only when task complexity demands it.
        </p>
      </div>
    </motion.div>
  );
}
