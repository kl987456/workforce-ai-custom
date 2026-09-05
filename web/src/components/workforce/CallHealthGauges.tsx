import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Call } from "../../lib/types";

// Matches the retry_config guardrail set on every call in the calls router (max 1 retry).
const MAX_RETRIES = 1;
// Scales the call-timer ring only — a typical hiring-screen length, not a claimed benchmark.
const TARGET_SCREEN_SECONDS = 240;

function Gauge({
  label,
  value,
  max,
  display,
  color,
  size = 76,
}: {
  label: string;
  value: number;
  max: number;
  display: string;
  color: string;
  size?: number;
}) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const offset = circumference - pct * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-outline-variant)" strokeWidth={strokeWidth} />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ type: "spring", stiffness: 90, damping: 20 }}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 5px ${color})` }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold" style={{ color }}>
          {display}
        </span>
      </div>
      <span className="text-center text-[10px] uppercase tracking-wider text-on-surface-variant">{label}</span>
    </div>
  );
}

/**
 * Three real-data gauges read off the active call row — no fabricated
 * "AI confidence" or sentiment scores. Call timer ticks from started_at while
 * live; retry budget and connection state are the actual guardrail/status
 * fields Hunar reports.
 */
export function CallHealthGauges({ call }: { call: Call }) {
  const isLive = call.status === "IN_PROGRESS" || call.status === "RINGING";
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isLive]);

  const elapsedSeconds = call.started_at
    ? Math.max(
        0,
        Math.round(
          ((isLive ? now : call.ended_at ? new Date(call.ended_at).getTime() : now) - new Date(call.started_at).getTime()) / 1000
        )
      )
    : call.duration_seconds ?? 0;
  const durationDisplay = `${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, "0")}`;

  const retries = call.retry_count ?? 0;

  const connectionPct = isLive ? 100 : call.status === "COMPLETED" ? 100 : call.status === "FAILED" || call.status === "NOT_CONNECTED" ? 15 : 55;
  const connectionDisplay = isLive ? "LIVE" : call.status === "COMPLETED" ? "OK" : call.status === "FAILED" || call.status === "NOT_CONNECTED" ? "—" : "…";
  const connectionColor = isLive
    ? "var(--color-tertiary)"
    : call.status === "COMPLETED"
      ? "var(--color-tertiary)"
      : call.status === "FAILED" || call.status === "NOT_CONNECTED"
        ? "var(--color-error)"
        : "var(--color-on-surface-variant)";

  return (
    <div className="flex items-center justify-around gap-2 rounded-2xl border border-outline-variant/30 bg-surface-container-low/60 p-3">
      <Gauge label="Call timer" value={elapsedSeconds} max={TARGET_SCREEN_SECONDS} display={durationDisplay} color="var(--color-primary)" />
      <Gauge label="Retry budget" value={MAX_RETRIES - retries} max={MAX_RETRIES} display={`${retries}/${MAX_RETRIES}`} color="var(--color-secondary)" />
      <Gauge label="Connection" value={connectionPct} max={100} display={connectionDisplay} color={connectionColor} />
    </div>
  );
}
