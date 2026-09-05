import { useState } from "react";
import { Bot, Zap, Loader2 } from "lucide-react";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import { api } from "../../lib/api";
import { cn } from "../../lib/cn";
import type { Campaign } from "../../lib/types";

export function AutonomousPanel({ campaign, onUpdated }: { campaign: Campaign; onUpdated: () => void }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function handleToggle(next: boolean) {
    if (next) {
      setConfirmOpen(true);
      return;
    }
    setLoading(true);
    try {
      await api.setAutonomous(campaign.id, false);
      toast.success("Autonomous dialing turned off");
      onUpdated();
    } catch (e) {
      toast.error("Could not update", e instanceof Error ? e.message : undefined);
    } finally {
      setLoading(false);
    }
  }

  async function confirmEnable() {
    setLoading(true);
    try {
      const data = await api.setAutonomous(campaign.id, true);
      const dialed = data.autonomousDial?.dialed ?? 0;
      toast.success(
        "Autonomous dialing enabled",
        dialed > 0 ? `Dialed ${dialed} candidate(s) already in the pipeline.` : undefined
      );
      setConfirmOpen(false);
      onUpdated();
    } catch (e) {
      toast.error("Could not enable", e instanceof Error ? e.message : undefined);
    } finally {
      setLoading(false);
    }
  }

  async function runNow() {
    setLoading(true);
    try {
      const summary = await api.runAutonomousNow(campaign.id);
      if (summary.skipped) {
        toast.error("Skipped this run", summary.skipped);
      } else {
        toast.success(
          `Dialed ${summary.dialed} candidate(s)`,
          summary.errors.length ? `${summary.errors.length} failed` : undefined
        );
      }
      onUpdated();
    } catch (e) {
      toast.error("Run failed", e instanceof Error ? e.message : undefined);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3 py-2">
      <div className="flex min-w-[180px] flex-1 items-center gap-2">
        <Bot className="h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <div className="text-xs font-semibold">Autonomous Dial Engine</div>
          <div className="text-[10px] text-on-surface-variant">
            {campaign.autonomous_enabled
              ? "On — new candidates are dialed automatically."
              : "Off — calls need a manual trigger."}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {campaign.autonomous_enabled && (
          <Button size="sm" variant="outline" onClick={runNow} disabled={loading} className="gap-1.5">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />} Run now
          </Button>
        )}
        <button
          type="button"
          role="switch"
          aria-checked={campaign.autonomous_enabled}
          aria-label="Toggle autonomous dialing"
          onClick={() => handleToggle(!campaign.autonomous_enabled)}
          disabled={loading}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
            campaign.autonomous_enabled ? "bg-primary-container" : "bg-outline-variant/50"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
              campaign.autonomous_enabled ? "translate-x-5" : "translate-x-0.5"
            )}
          />
        </button>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Enable autonomous dialing?"
        description={`The system will automatically place real Hunar voice calls to every candidate already in "${campaign.title}", and to every new one added from now on — without asking you first each time.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={confirmEnable} disabled={loading} className="gap-1.5">
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Enable
            </Button>
          </>
        }
      >
        <p className="text-xs text-on-surface-variant">
          It also auto-triages completed calls (advance/hold/reject), retries a "maybe later" response after a
          few days, and permanently stops calling anyone who says not to contact them again.
        </p>
      </Modal>
    </div>
  );
}
