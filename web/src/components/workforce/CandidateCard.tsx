import { MapPin, Building2, BriefcaseBusiness } from "lucide-react";
import { Avatar } from "./Avatar";
import { MatchGauge } from "./MatchGauge";
import { TriggerCallButton } from "./TriggerCallButton";
import { Card } from "../ui/Card";
import type { Candidate } from "../../lib/types";

export function CandidateCard({
  candidate,
  campaignId,
  purpose,
  onCallCreated,
  selectable,
  selected,
  onToggleSelect,
}: {
  candidate: Candidate;
  campaignId: string;
  purpose: "HIRING_SCREEN" | "TALENT_REACHOUT";
  onCallCreated: () => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  return (
    <Card tilt className="flex flex-col gap-3 transition-shadow hover:shadow-md sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-1 items-start gap-3">
        {selectable && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect?.(candidate.id)}
            className="mt-1.5 h-4 w-4 shrink-0 rounded border-outline-variant/60 accent-primary-container"
          />
        )}
        <Avatar name={candidate.name} size={40} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-on-surface">{candidate.name}</span>
            {candidate.source === "SEEDED_SEARCH" && (
              <span className="rounded-md border border-outline-variant/40 px-1.5 py-0.5 text-[10px] text-on-surface-variant">
                demo profile
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-on-surface-variant">
            <span>{candidate.role_title}</span>
            {candidate.years_experience != null && (
              <span className="flex items-center gap-1">
                <BriefcaseBusiness className="h-3 w-3" /> {candidate.years_experience} yrs
              </span>
            )}
            {candidate.company && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" /> {candidate.company}
              </span>
            )}
            {candidate.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {candidate.location}
              </span>
            )}
          </div>
          {candidate.profile?.summary && (
            <p className="text-xs text-on-surface-variant">{candidate.profile.summary}</p>
          )}
          {candidate.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {candidate.skills.map((s) => (
                <span
                  key={s}
                  className="rounded-md bg-surface-container-low px-1.5 py-0.5 font-mono text-[10px] text-on-surface"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {candidate.match_score != null && <MatchGauge value={candidate.match_score} />}
        <TriggerCallButton
          candidate={candidate}
          campaignId={campaignId}
          purpose={purpose}
          onCallCreated={onCallCreated}
        />
      </div>
    </Card>
  );
}
