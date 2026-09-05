import { AlertTriangle } from "lucide-react";
import type { CampaignHealth } from "../../lib/types";

/** Requisition Health Monitor — a passive read of existing pipeline data, no dialing of its own. */
export function HealthBanner({ health }: { health: CampaignHealth | null }) {
  if (!health || (!health.stalled && !health.lowAdvanceRate)) return null;

  const messages: string[] = [];
  if (health.stalled) messages.push("No call activity in the last 24 hours.");
  if (health.lowAdvanceRate) {
    messages.push(`Advance rate is low (${Math.round((health.advanceRate ?? 0) * 100)}%).`);
  }

  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div>
        <span className="font-semibold">Requisition health: </span>
        {messages.join(" ")}
      </div>
    </div>
  );
}
