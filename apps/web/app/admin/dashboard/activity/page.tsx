"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Zap, ArrowDownRight } from "lucide-react";
import { listReceipts } from "@/lib/greenledger-api";

/* -- helpers --------------------------------------------------------- */
function shortModel(m: string) {
  return m.replace("claude-", "").replace("gpt-", "").replace("gemini-", "");
}

/* -- animation variants (matches user-facing dashboard) -------------- */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

/* -- section label --------------------------------------------------- */
function Sec({ children }: { children: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        marginBottom: "1.25rem",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "9px",
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </span>
      <div
        style={{
          flex: 1,
          height: "1px",
          backgroundColor: "var(--rule, #1e1e1e)",
        }}
      />
    </div>
  );
}

/* -- main page ------------------------------------------------------- */
export default function AdminActivityPage() {
  const [live, setLive] = useState(false);
  const [grouped, setGrouped] = useState<Record<string, any[]>>({});
  const [stats, setStats] = useState({
    today: 0,
    downgrades: 0,
    totalCo2e: 0,
    totalQueries: 0,
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await listReceipts({ limit: 200 });
        setLive(true);
        const raw: any[] = Array.isArray(res.data) ? res.data : [];

        const allEvents = raw
          .map((r: any) => ({
            timestamp: r.timestamp,
            agent: r.agent_id || "unknown",
            event:
              r.requested_model &&
              r.model &&
              r.requested_model !== r.model
                ? `Downgrade: ${shortModel(r.requested_model)} \u2192 ${shortModel(r.model)}`
                : `Inference: ${shortModel(r.model || "unknown")}`,
            detail: `${(r.environmental_cost?.co2e_g ?? 0).toFixed(4)}g CO\u2082e`,
            isDowngrade: !!(
              r.requested_model &&
              r.model &&
              r.requested_model !== r.model
            ),
            co2e: r.environmental_cost?.co2e_g ?? 0,
          }))
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() -
              new Date(a.timestamp).getTime()
          );

        // Group by day
        const groups: Record<string, any[]> = {};
        allEvents.forEach((e) => {
          const day = new Date(e.timestamp).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          if (!groups[day]) groups[day] = [];
          groups[day].push(e);
        });
        setGrouped(groups);

        const todayStr = new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        setStats({
          today: (groups[todayStr] || []).length,
          downgrades: allEvents.filter((e) => e.isDowngrade).length,
          totalCo2e: allEvents.reduce((s, e) => s + (e.co2e || 0), 0),
          totalQueries: allEvents.length,
        });
      } catch {
        setGrouped({});
        setStats({
          today: 0,
          downgrades: 0,
          totalCo2e: 0,
          totalQueries: 0,
        });
      }
    }
    load();
  }, []);

  const metrics = [
    {
      label: "Total Events",
      value: stats.totalQueries.toLocaleString(),
      accent: false,
    },
    {
      label: "Downgrades",
      value: stats.downgrades.toLocaleString(),
      accent: true,
    },
    {
      label: "Total CO\u2082e",
      value: `${stats.totalCo2e.toFixed(3)}g`,
      accent: false,
    },
    {
      label: "Events Today",
      value: stats.today.toLocaleString(),
      accent: false,
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      style={{ maxWidth: "1200px", margin: "0 auto" }}
    >
      {/* -- Page header ------------------------------------------------ */}
      <motion.div
        variants={item}
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "2.5rem",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "6px",
            }}
          >
            <Activity
              style={{ width: 20, height: 20, color: "var(--blue-accent)" }}
            />
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.8rem",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                color: "var(--text-primary)",
                lineHeight: 1,
                textTransform: "uppercase",
              }}
            >
              Activity Feed
            </h1>
          </div>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "var(--text-muted)",
              marginTop: "6px",
              letterSpacing: "0.04em",
            }}
          >
            Real-time platform events
          </p>
        </div>

        {/* Live badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            paddingTop: "4px",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              display: "inline-block",
              flexShrink: 0,
              backgroundColor: live ? "#22c55e" : "#525252",
              boxShadow: live ? "0 0 6px #22c55e" : "none",
              animation: "pulse-green 2s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: live ? "#22c55e" : "var(--text-muted)",
            }}
          >
            {live ? "Live" : "Mock"}
          </span>
        </div>
      </motion.div>

      {/* -- Hero metrics row ------------------------------------------- */}
      <motion.div
        variants={item}
        style={{
          borderTop: "1px solid var(--rule, #1e1e1e)",
          paddingTop: "2rem",
          borderBottom: "1px solid var(--rule, #1e1e1e)",
          paddingBottom: "2rem",
          marginBottom: "2.5rem",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${metrics.length}, 1fr)`,
            width: "100%",
          }}
        >
          {metrics.map((m, i) => (
            <div
              key={m.label}
              style={{
                borderLeft:
                  i > 0 ? "1px solid var(--rule, #1e1e1e)" : "none",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "clamp(1.2rem, 2vw, 1.8rem)",
                  fontWeight: 700,
                  color: m.accent ? "#22c55e" : "var(--text-primary)",
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                }}
              >
                {m.value}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* -- Date-grouped activity feed --------------------------------- */}
      {Object.entries(grouped).map(([date, events]) => (
        <motion.div
          key={date}
          variants={item}
          style={{
            borderTop: "1px solid var(--rule, #1e1e1e)",
            paddingTop: "2rem",
            marginBottom: "2.5rem",
          }}
        >
          <Sec>{`${date}  \u00b7  ${events.length} events`}</Sec>

          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            {/* Date group header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.75rem 1.25rem",
                backgroundColor: "var(--bg-card)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                }}
              >
                {date}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                {events.length} events
              </span>
            </div>

            {/* Event rows */}
            <div style={{ backgroundColor: "var(--bg-card)" }}>
              <AnimatePresence>
                {events.map((a: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "0.75rem 1.25rem",
                      borderBottom:
                        i < events.length - 1
                          ? "1px solid var(--border)"
                          : undefined,
                      cursor: "default",
                      transition: "background-color 100ms ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "var(--bg-card-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        backgroundColor: a.isDowngrade
                          ? "rgba(34,197,94,0.1)"
                          : "rgba(96,165,250,0.1)",
                        border: `1px solid ${
                          a.isDowngrade
                            ? "rgba(34,197,94,0.18)"
                            : "rgba(96,165,250,0.18)"
                        }`,
                      }}
                    >
                      {a.isDowngrade ? (
                        <ArrowDownRight
                          style={{
                            width: 14,
                            height: 14,
                            color: "var(--green-accent)",
                          }}
                        />
                      ) : (
                        <Zap
                          style={{
                            width: 14,
                            height: 14,
                            color: "var(--blue-accent)",
                          }}
                        />
                      )}
                    </div>

                    {/* Timestamp */}
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        color: "var(--text-muted)",
                        width: "3.5rem",
                        flexShrink: 0,
                      }}
                    >
                      {new Date(a.timestamp).toLocaleTimeString("en", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    {/* Agent name */}
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "var(--text-primary)",
                        width: "8rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {a.agent}
                    </span>

                    {/* Event description */}
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {a.event}
                    </span>

                    {/* Detail */}
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        flexShrink: 0,
                      }}
                    >
                      {a.detail}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Empty state */}
      {Object.keys(grouped).length === 0 && (
        <motion.div
          variants={item}
          style={{
            borderTop: "1px solid var(--rule, #1e1e1e)",
            paddingTop: "2rem",
          }}
        >
          <Sec>Activity</Sec>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--text-muted)",
              textAlign: "center",
              padding: "3rem 0",
            }}
          >
            No activity yet — run a CLI query to populate
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
