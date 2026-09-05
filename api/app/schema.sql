-- Custom-app schema. Lives in its own Postgres schema (custom_app), not
-- "public", so it's fully isolated from the original Next.js app's tables
-- in the same Neon database — a `drizzle-kit push` there reconciles drift
-- only within "public" and cannot see or drop anything in here.
--
-- Every table reference below (and in every router) is schema-qualified
-- (custom_app.capp_x) rather than relying on `search_path` — Neon's pooled
-- endpoint runs PgBouncer in transaction mode, which does not reliably
-- persist a session-level SET search_path across separate queries/
-- transactions, since consecutive requests can be routed to different
-- backend connections. Qualifying every reference is immune to that.
CREATE SCHEMA IF NOT EXISTS custom_app;

CREATE TABLE IF NOT EXISTS custom_app.capp_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hunar_agent_id TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL CHECK (purpose IN ('HIRING_SCREEN', 'TALENT_REACHOUT')),
  name TEXT NOT NULL,
  language TEXT NOT NULL,
  voice_persona TEXT NOT NULL,
  persona_name TEXT,
  agent_prompt TEXT NOT NULL,
  objective TEXT NOT NULL,
  introduction TEXT NOT NULL,
  result_prompt TEXT NOT NULL,
  result_schema JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS custom_app.capp_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('HIRING', 'TALENT_SEARCH')),
  title TEXT NOT NULL,
  department TEXT,
  location TEXT,
  job_description TEXT NOT NULL,
  parsed_filters JSONB,
  agent_id UUID REFERENCES custom_app.capp_agents(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS custom_app.capp_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES custom_app.capp_campaigns(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  role_title TEXT,
  company TEXT,
  location TEXT,
  years_experience DOUBLE PRECISION,
  skills JSONB NOT NULL DEFAULT '[]',
  match_score DOUBLE PRECISION,
  source TEXT NOT NULL DEFAULT 'MANUAL' CHECK (source IN ('MANUAL', 'SEEDED_SEARCH')),
  profile JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS custom_app.capp_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hunar_call_id TEXT UNIQUE,
  request_id TEXT,
  candidate_id UUID NOT NULL REFERENCES custom_app.capp_candidates(id),
  agent_id UUID NOT NULL REFERENCES custom_app.capp_agents(id),
  campaign_id UUID REFERENCES custom_app.capp_campaigns(id),
  status TEXT NOT NULL DEFAULT 'NOT_STARTED',
  lifecycle_status TEXT,
  answered_by TEXT,
  retry_count INTEGER DEFAULT 0,
  duration_seconds DOUBLE PRECISION,
  recording_url TEXT,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS custom_app.capp_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  call_id TEXT,
  request_id TEXT,
  signature_valid BOOLEAN NOT NULL,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_capp_candidates_campaign ON custom_app.capp_candidates(campaign_id);
CREATE INDEX IF NOT EXISTS idx_capp_calls_campaign ON custom_app.capp_calls(campaign_id);
CREATE INDEX IF NOT EXISTS idx_capp_calls_candidate ON custom_app.capp_calls(candidate_id);

-- Autonomous Dial Engine: an opt-in per-requisition/search toggle. When on,
-- new candidates get dialed automatically (see routers/autonomous.py) instead
-- of requiring a manual "Call"/"Trigger Reachout" click — rule-based on the
-- structured fields Hunar already returns, no LLM/agent API key involved.
ALTER TABLE custom_app.capp_campaigns ADD COLUMN IF NOT EXISTS autonomous_enabled BOOLEAN NOT NULL DEFAULT false;

-- Smart Retry Agent: a "maybe later"/"hold" result schedules one more
-- autonomous attempt a few days out instead of just sitting there.
ALTER TABLE custom_app.capp_candidates ADD COLUMN IF NOT EXISTS next_follow_up_at TIMESTAMPTZ;

-- Do-Not-Call Guard: set the moment a candidate's result says not to
-- contact them again (matched by phone, so it holds across every
-- campaign/candidate row for that number, not just this one).
ALTER TABLE custom_app.capp_candidates ADD COLUMN IF NOT EXISTS do_not_contact BOOLEAN NOT NULL DEFAULT false;

-- Cross-Pipeline Sync Agent adds candidates with source REACHOUT_SYNC —
-- widen the existing check constraint to allow it.
ALTER TABLE custom_app.capp_candidates DROP CONSTRAINT IF EXISTS capp_candidates_source_check;
ALTER TABLE custom_app.capp_candidates ADD CONSTRAINT capp_candidates_source_check
  CHECK (source IN ('MANUAL', 'SEEDED_SEARCH', 'REACHOUT_SYNC'));
