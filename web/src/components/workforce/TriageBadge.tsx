import { ThumbsUp, PauseCircle, ThumbsDown } from "lucide-react";
import type { Triage } from "../../lib/types";
import { cn } from "../../lib/cn";

const STYLES: Record<Triage, string> = {
  advance: "bg-tertiary-fixed text-on-tertiary-fixed",
  hold: "bg-amber-100 text-amber-800",
  reject: "bg-error-container text-on-error-container",
};

const ICONS: Record<Triage, typeof ThumbsUp> = {
  advance: ThumbsUp,
  hold: PauseCircle,
  reject: ThumbsDown,
};

const LABELS: Record<Triage, string> = {
  advance: "Auto-triaged: advance",
  hold: "Auto-triaged: hold",
  reject: "Auto-triaged: reject",
};

/** Rule-based read of Hunar's own extracted recommendation/interest field — not a separate AI call. */
export function TriageBadge({ triage }: { triage: Triage | null | undefined }) {
  if (!triage) return null;
  const Icon = ICONS[triage];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", STYLES[triage])}>
      <Icon className="h-2.5 w-2.5" /> {LABELS[triage]}
    </span>
  );
}
