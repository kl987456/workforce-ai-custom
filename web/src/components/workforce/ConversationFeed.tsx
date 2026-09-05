import { Bot, Clock, PhoneOff } from "lucide-react";
import { Avatar } from "./Avatar";
import { CallStatusBadge } from "./CallStatusBadge";
import { TriageBadge } from "./TriageBadge";
import type { Call } from "../../lib/types";

function formatDuration(seconds: number | null) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function humanize(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Presents a call's REAL Hunar data — recording + extracted result fields —
 * as a conversation-style feed. There is no live turn-by-turn transcript API
 * from Hunar (only a final structured result + recording), so this renders
 * what's actually available: one bubble per extracted field, not a
 * fabricated back-and-forth.
 */
export function ConversationFeed({ call }: { call: Call }) {
  const name = call.candidate?.name ?? "Candidate";
  const hasResult = call.result && Object.keys(call.result).length > 0;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Avatar name={name} size={40} />
          <div>
            <div className="font-medium text-on-surface">{name}</div>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
              <CallStatusBadge status={call.status} />
              <TriageBadge triage={call.triage} />
              {call.answered_by && <span className="font-mono">answered by {call.answered_by.toLowerCase()}</span>}
            </div>
          </div>
        </div>
        {call.duration_seconds != null && (
          <span className="flex items-center gap-1 text-xs text-on-surface-variant">
            <Clock className="h-3 w-3" /> {formatDuration(call.duration_seconds)}
          </span>
        )}
      </div>

      {(call.status === "NOT_CONNECTED" || call.status === "FAILED") && (
        <div className="flex items-center gap-1.5 rounded-xl bg-surface-container-low p-3 text-xs text-on-surface-variant">
          <PhoneOff className="h-3.5 w-3.5" />
          {call.status === "NOT_CONNECTED" ? "Candidate did not answer." : "Call failed to place."}
        </div>
      )}

      {call.recording_url && (
        <audio controls className="h-9 w-full" src={call.recording_url}>
          Your browser does not support audio playback.
        </audio>
      )}

      {hasResult ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
              Extracted from the call with {name}:
            </div>
          </div>
          <div className="ml-9 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {Object.entries(call.result!).map(([key, value]) => (
              <div key={key} className="flex flex-col rounded-2xl rounded-tl-sm bg-primary-fixed px-3 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-on-primary-fixed/70">
                  {humanize(key)}
                </span>
                <span className="text-sm text-on-primary-fixed">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-on-surface-variant">
          {call.status === "COMPLETED"
            ? "Waiting on Hunar's result webhook to deliver the extracted answers…"
            : "Results will appear here once the call ends."}
        </p>
      )}
    </div>
  );
}
