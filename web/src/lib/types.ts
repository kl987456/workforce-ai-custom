export interface Campaign {
  id: string;
  kind: "HIRING" | "TALENT_SEARCH";
  title: string;
  department: string | null;
  location: string | null;
  job_description: string;
  voice_persona: string | null;
  persona_name: string | null;
  autonomous_enabled: boolean;
  created_at: string;
}

export interface Candidate {
  id: string;
  campaign_id: string | null;
  name: string;
  email: string | null;
  phone: string;
  role_title: string | null;
  company: string | null;
  location: string | null;
  years_experience: number | null;
  skills: string[];
  match_score: number | null;
  source: "MANUAL" | "SEEDED_SEARCH" | "REACHOUT_SYNC";
  profile: { summary?: string; provider?: string; reachout_result?: Record<string, unknown> } | null;
  do_not_contact?: boolean;
  next_follow_up_at?: string | null;
  created_at: string;
}

export type Triage = "advance" | "hold" | "reject";

export interface CampaignHealth {
  stalled: boolean;
  lowAdvanceRate: boolean;
  advanceRate: number | null;
}

export interface AutonomousDialSummary {
  campaignId: string;
  dialed: number;
  errors: { candidateId: string; error: string }[];
  skipped?: string;
}

export type CallStatus =
  | "NOT_STARTED"
  | "SCHEDULED"
  | "INITIATED"
  | "RINGING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "NOT_CONNECTED"
  | "FAILED"
  | "CANCELLED";

export interface Call {
  id: string;
  hunar_call_id: string | null;
  request_id: string | null;
  candidate_id: string;
  agent_id: string;
  campaign_id: string | null;
  status: CallStatus;
  lifecycle_status: string | null;
  answered_by: string | null;
  retry_count: number | null;
  duration_seconds: number | null;
  recording_url: string | null;
  result: Record<string, unknown> | null;
  triage: Triage | null;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  updated_at: string;
  candidate?: Candidate;
}

export const TERMINAL_STATUSES = new Set<CallStatus>([
  "COMPLETED",
  "NOT_CONNECTED",
  "FAILED",
  "CANCELLED",
]);
