import type { CallStatus } from "../../lib/types";
import { cn } from "../../lib/cn";

const STYLES: Record<CallStatus, string> = {
  NOT_STARTED: "bg-surface-container text-on-surface-variant",
  SCHEDULED: "bg-secondary-fixed text-on-secondary-fixed",
  INITIATED: "bg-secondary-fixed text-on-secondary-fixed",
  RINGING: "bg-amber-100 text-amber-800 animate-pulse",
  IN_PROGRESS: "bg-amber-100 text-amber-800 animate-pulse",
  COMPLETED: "bg-tertiary-fixed text-on-tertiary-fixed",
  NOT_CONNECTED: "bg-surface-container text-on-surface-variant",
  FAILED: "bg-error-container text-on-error-container",
  CANCELLED: "bg-surface-container text-on-surface-variant",
};

const LABELS: Record<CallStatus, string> = {
  NOT_STARTED: "Not started",
  SCHEDULED: "Scheduled",
  INITIATED: "Dialing…",
  RINGING: "Ringing…",
  IN_PROGRESS: "In progress…",
  COMPLETED: "Completed",
  NOT_CONNECTED: "Not connected",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

export function CallStatusBadge({ status }: { status: CallStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", STYLES[status])}>
      {LABELS[status]}
    </span>
  );
}
