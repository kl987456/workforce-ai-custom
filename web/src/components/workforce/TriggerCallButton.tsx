import { useState } from "react";
import { Phone, Loader2 } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { api } from "../../lib/api";
import { isE164, phoneHint } from "../../lib/phone";
import { useToast } from "../ui/Toast";
import type { Candidate } from "../../lib/types";

export function TriggerCallButton({
  candidate,
  campaignId,
  purpose,
  onCallCreated,
  label,
}: {
  candidate: Candidate;
  campaignId: string;
  purpose: "HIRING_SCREEN" | "TALENT_REACHOUT";
  onCallCreated: () => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(candidate.phone);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const hint = phoneHint(phone);
  const isSeeded = candidate.source === "SEEDED_SEARCH";

  async function handleCall() {
    setLoading(true);
    try {
      await api.createCall({
        candidateId: candidate.id,
        campaignId,
        purpose,
        phoneOverride: phone,
      });
      toast.success(`Hunar call placed to ${candidate.name}`, "Track status below — results arrive via webhook.");
      setOpen(false);
      onCallCreated();
    } catch (e) {
      toast.error("Could not place call", e instanceof Error ? e.message : undefined);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Phone className="h-3.5 w-3.5" />
        {label ?? (purpose === "HIRING_SCREEN" ? "Call — Hunar Screen" : "Trigger Reachout")}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Place Hunar voice call to ${candidate.name}?`}
        description={`This places a real outbound call via the Hunar Voice AI API.${
          isSeeded
            ? " This is a seeded demo profile with a fictional number — replace it with a real, consented number to actually test the call."
            : ""
        }`}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleCall} disabled={loading || !isE164(phone)} className="gap-1.5">
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Place call
            </Button>
          </>
        }
      >
        <label className="text-xs font-medium text-on-surface-variant">
          Phone number (E.164 — any country)
        </label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+917411771293 or +15551234567"
          className={`h-10 rounded-xl border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 ${
            hint ? "border-error" : "border-outline-variant/50"
          }`}
        />
        {hint ? (
          <p className="text-xs text-error">{hint}</p>
        ) : (
          <p className="text-xs text-on-surface-variant">
            Always + and country code — +91 India, +1 US/Canada, +44 UK, etc.
          </p>
        )}
      </Modal>
    </>
  );
}
