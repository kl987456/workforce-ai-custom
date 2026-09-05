import { Avatar } from "./Avatar";
import { CallStatusBadge } from "./CallStatusBadge";
import { TriageBadge } from "./TriageBadge";
import { TriggerCallButton } from "./TriggerCallButton";
import type { Candidate, Call } from "../../lib/types";
import { cn } from "../../lib/cn";

export function QueueRow({
  candidate,
  campaignId,
  purpose,
  onCallCreated,
  latestCall,
  active,
  onFocus,
}: {
  candidate: Candidate;
  campaignId: string;
  purpose: "HIRING_SCREEN" | "TALENT_REACHOUT";
  onCallCreated: () => void;
  latestCall?: Call;
  active?: boolean;
  onFocus?: () => void;
}) {
  return (
    <div
      onClick={onFocus}
      className={cn(
        "flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 transition-colors",
        onFocus && "cursor-pointer",
        active ? "border-primary-container bg-accent" : "border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container-low"
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <Avatar name={candidate.name} size={30} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium">{candidate.name}</span>
            {candidate.source === "REACHOUT_SYNC" && (
              <span
                title="Auto-added by the Cross-Pipeline Sync Agent after a Talent Search reachout came back interested"
                className="shrink-0 rounded-md border border-primary-container/40 px-1 py-0.5 text-[9px] font-medium text-primary"
              >
                synced
              </span>
            )}
          </div>
          <div className="truncate text-[11px] text-on-surface-variant">{candidate.role_title}</div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {latestCall ? (
          <>
            <TriageBadge triage={latestCall.triage} />
            <CallStatusBadge status={latestCall.status} />
          </>
        ) : (
          <TriggerCallButton
            candidate={candidate}
            campaignId={campaignId}
            purpose={purpose}
            onCallCreated={onCallCreated}
            label="Call"
          />
        )}
      </div>
    </div>
  );
}
