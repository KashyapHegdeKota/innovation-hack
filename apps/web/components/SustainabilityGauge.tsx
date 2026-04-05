"use client";

interface SustainabilityGaugeProps {
  score: number;
  previousScore?: number | null;
  size?: number;
}

export default function SustainabilityGauge({ score, previousScore, size = 180 }: SustainabilityGaugeProps) {
  const radius = (size - 20) / 2;
  const circumference = Math.PI * radius;
  const progress = (score / 100) * circumference;
  const center = size / 2;

  const getColor = (s: number) => {
    if (s >= 75) return "#22c55e";
    if (s >= 50) return "#f59e0b";
    return "#ef4444";
  };

  const getGlow = (s: number) => {
    if (s >= 75) return "rgba(34,197,94,0.6)";
    if (s >= 50) return "rgba(245,158,11,0.6)";
    return "rgba(239,68,68,0.6)";
  };

  const getLabel = (s: number) => {
    if (s >= 90) return "Excellent";
    if (s >= 75) return "Good";
    if (s >= 50) return "Fair";
    if (s >= 25) return "Poor";
    return "Critical";
  };

  const color = getColor(score);
  const glowColor = getGlow(score);
  const change = previousScore != null ? score - previousScore : null;
  const filterId = "gauge-glow";

  return (
    <div className="relative rounded-xl border glow-hover overflow-hidden flex flex-col items-center p-6"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>

      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${glowColor.replace("0.6", "0.5")}, transparent)` }} />

      <h3 className="text-[10px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
        Sustainability Score
      </h3>

      <svg width={size} height={size / 2 + 30} viewBox={`0 0 ${size} ${size / 2 + 30}`}>
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity={0.6} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>

        {/* Track */}
        <path d={`M 10 ${center} A ${radius} ${radius} 0 0 1 ${size - 10} ${center}`}
          fill="none" stroke="var(--border)" strokeWidth="8" strokeLinecap="round" />

        {/* Progress with glow */}
        <path d={`M 10 ${center} A ${radius} ${radius} 0 0 1 ${size - 10} ${center}`}
          fill="none" stroke={glowColor} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{ transition: "stroke-dasharray 1.2s ease-in-out", filter: `blur(4px)` }}
          opacity={0.4} />
        <path d={`M 10 ${center} A ${radius} ${radius} 0 0 1 ${size - 10} ${center}`}
          fill="none" stroke="url(#gaugeGrad)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{ transition: "stroke-dasharray 1.2s ease-in-out" }} />

        {/* Score */}
        <text x={center} y={center - 8} textAnchor="middle" className="font-mono font-bold"
          style={{ fill: "var(--text-primary)", fontSize: "34px", fontWeight: 800 }}>
          {score}
        </text>
        <text x={center} y={center + 14} textAnchor="middle"
          style={{ fill: color, fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>
          {getLabel(score)}
        </text>
      </svg>

      {change !== null && (
        <div className="flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full"
          style={{ backgroundColor: change >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)" }}>
          <span className="text-xs font-semibold" style={{ color: change >= 0 ? "var(--green-accent)" : "var(--red-accent)" }}>
            {change >= 0 ? "+" : ""}{change} from last period
          </span>
        </div>
      )}
    </div>
  );
}
