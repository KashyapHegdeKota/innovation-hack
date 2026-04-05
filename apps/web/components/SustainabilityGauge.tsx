"use client";

interface SustainabilityGaugeProps {
  score: number; // 0-100
  previousScore?: number | null;
  size?: number;
}

export default function SustainabilityGauge({ score, previousScore, size = 180 }: SustainabilityGaugeProps) {
  const radius = (size - 20) / 2;
  const circumference = Math.PI * radius; // semicircle
  const progress = (score / 100) * circumference;
  const center = size / 2;

  const getColor = (s: number) => {
    if (s >= 75) return "var(--green-accent)";
    if (s >= 50) return "var(--amber-accent)";
    return "var(--red-accent)";
  };

  const getLabel = (s: number) => {
    if (s >= 90) return "Excellent";
    if (s >= 75) return "Good";
    if (s >= 50) return "Fair";
    if (s >= 25) return "Poor";
    return "Critical";
  };

  const change = previousScore != null ? score - previousScore : null;

  return (
    <div
      className="rounded-xl border p-6 flex flex-col items-center"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <h3 className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
        Sustainability Score
      </h3>
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        {/* Background arc */}
        <path
          d={`M 10 ${center} A ${radius} ${radius} 0 0 1 ${size - 10} ${center}`}
          fill="none"
          stroke="var(--border)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d={`M 10 ${center} A ${radius} ${radius} 0 0 1 ${size - 10} ${center}`}
          fill="none"
          stroke={getColor(score)}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{ transition: "stroke-dasharray 1s ease-in-out" }}
        />
        {/* Score text */}
        <text
          x={center}
          y={center - 10}
          textAnchor="middle"
          className="font-mono font-bold"
          style={{ fill: "var(--text-primary)", fontSize: "32px" }}
        >
          {score}
        </text>
        <text
          x={center}
          y={center + 12}
          textAnchor="middle"
          style={{ fill: getColor(score), fontSize: "12px", fontWeight: 500 }}
        >
          {getLabel(score)}
        </text>
      </svg>
      {change !== null && (
        <p className="text-xs mt-2" style={{ color: change >= 0 ? "var(--green-accent)" : "var(--red-accent)" }}>
          {change >= 0 ? "+" : ""}{change} from last period
        </p>
      )}
    </div>
  );
}
