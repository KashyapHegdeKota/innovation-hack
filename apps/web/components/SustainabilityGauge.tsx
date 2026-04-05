"use client";

interface SustainabilityGaugeProps {
  score: number;
  previousScore?: number | null;
  size?: number;
}

export default function SustainabilityGauge({ score, previousScore, size = 180 }: SustainabilityGaugeProps) {
  const radius = (size - 24) / 2;
  const circumference = Math.PI * radius;
  const progress = (score / 100) * circumference;
  const center = size / 2;

  const getColor = (s: number) => {
    if (s >= 75) return "#22c55e";
    if (s >= 50) return "#f59e0b";
    return "#f87171";
  };

  const getGrade = (s: number) => {
    if (s >= 90) return "A+";
    if (s >= 80) return "A";
    if (s >= 70) return "B";
    if (s >= 55) return "C";
    if (s >= 40) return "D";
    return "F";
  };

  const getLabel = (s: number) => {
    if (s >= 90) return "Excellent";
    if (s >= 75) return "Good";
    if (s >= 50) return "Fair";
    if (s >= 25) return "Poor";
    return "Critical";
  };

  const color  = getColor(score);
  const grade  = getGrade(score);
  const change = previousScore != null ? score - previousScore : null;

  /* Tick marks at every 10%, inward */
  const getArcPoint = (t: number, r: number) => {
    const angle = Math.PI * (1 - t);
    return { x: center + r * Math.cos(angle), y: center - r * Math.sin(angle) };
  };

  const ticks = Array.from({ length: 11 }, (_, i) => {
    const t = i / 10;
    const isMajor = i % 5 === 0;
    return {
      outer: getArcPoint(t, radius),
      inner: getArcPoint(t, radius - (isMajor ? 9 : 5)),
      isMajor,
    };
  });

  const svgH = size / 2 + 36;

  return (
    <div
      className="relative rounded-xl flex flex-col items-center justify-center p-5 h-full transition-colors duration-150"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-bright)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
    >
      <span className="label mb-3">Sustainability Score</span>

      <svg width={size} height={svgH} viewBox={`0 0 ${size} ${svgH}`}>
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity={0.5} />
            <stop offset="100%" stopColor={color} stopOpacity={1} />
          </linearGradient>
        </defs>

        {/* Track */}
        <path
          d={`M 12 ${center} A ${radius} ${radius} 0 0 1 ${size - 12} ${center}`}
          fill="none" stroke="var(--border-bright)" strokeWidth="6" strokeLinecap="round"
        />

        {/* Progress */}
        <path
          d={`M 12 ${center} A ${radius} ${radius} 0 0 1 ${size - 12} ${center}`}
          fill="none" stroke="url(#gaugeGrad)" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)" }}
        />

        {/* Tick marks */}
        {ticks.map((tick, i) => (
          <line
            key={i}
            x1={tick.outer.x} y1={tick.outer.y}
            x2={tick.inner.x} y2={tick.inner.y}
            stroke={tick.isMajor ? "#2a2a2a" : "#1e1e1e"}
            strokeWidth={tick.isMajor ? 1.5 : 1}
            strokeLinecap="round"
          />
        ))}

        {/* Score */}
        <text
          x={center} y={center - 8}
          textAnchor="middle"
          style={{ fill: "var(--text-primary)", fontSize: "40px", fontWeight: 800, fontFamily: "var(--font-mono)", letterSpacing: "-0.04em" }}
        >
          {score}
        </text>

        {/* Grade · Label */}
        <text
          x={center} y={center + 15}
          textAnchor="middle"
          style={{ fill: color, fontSize: "12px", fontWeight: 600, fontFamily: "var(--font-display)" }}
        >
          {grade} · {getLabel(score)}
        </text>
      </svg>

      {change !== null && (
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full mt-1"
          style={{
            backgroundColor: change >= 0 ? "rgba(34,197,94,0.07)" : "rgba(248,113,113,0.07)",
            border: `1px solid ${change >= 0 ? "rgba(34,197,94,0.15)" : "rgba(248,113,113,0.15)"}`,
          }}
        >
          <span
            className="text-xs font-medium"
            style={{ color: change >= 0 ? "var(--green-accent)" : "var(--red-accent)", fontFamily: "var(--font-mono)" }}
          >
            {change >= 0 ? "+" : ""}{change} pts
          </span>
          <span className="label">vs last period</span>
        </div>
      )}
    </div>
  );
}
