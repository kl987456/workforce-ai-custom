import { Radio } from "lucide-react";
import type { Call } from "../../lib/types";

function eventLabel(call: Call): string {
  const name = call.candidate?.name ?? "Candidate";
  switch (call.status) {
    case "INITIATED":
      return `${name} · dialing`;
    case "RINGING":
      return `${name} · ringing`;
    case "IN_PROGRESS":
      return `${name} · live`;
    case "COMPLETED":
      return `${name} · screen completed`;
    case "NOT_CONNECTED":
      return `${name} · no answer`;
    case "FAILED":
      return `${name} · call failed`;
    case "CANCELLED":
      return `${name} · cancelled`;
    default:
      return `${name} · ${call.status.toLowerCase()}`;
  }
}

/** Scrolling marquee of real call-status events for the active requisition — not sample data. */
export function ActivityTicker({ calls }: { calls: Call[] }) {
  if (calls.length === 0) return null;

  const events = [...calls]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 12)
    .map(eventLabel);
  const track = [...events, ...events];

  return (
    <div className="flex items-center gap-2 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-low/60 px-3 py-2">
      <span className="flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-tertiary">
        <Radio className="h-3 w-3 animate-pulse" /> Feed
      </span>
      <div className="flex-1 overflow-hidden">
        <div className="flex w-max animate-[ticker-scroll_26s_linear_infinite] gap-8 whitespace-nowrap font-mono text-xs text-on-surface-variant">
          {track.map((e, i) => (
            <span key={i}>{e}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
