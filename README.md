# Workforce AI — Custom Build

A fully independent, from-scratch implementation of two Hunar Voice AI products —
an **AI Hiring Assistant** and a **People Search & Reachout engine** — built on a
completely separate stack from this project's original Next.js/shadcn app, with
its own design system, its own backend, and its own database schema.

**Live:** https://workforce-ai-final.vercel.app
**Repo:** https://github.com/kl987456/workforce-ai-custom

---

## What's in here

| Page | Route | What it does |
|---|---|---|
| Landing | `/` | Three.js hero, product overview, autonomous agents overview |
| Hiring Assistant ("Voice Ops Console") | `/hiring-assistant` | Create a requisition, add candidates, trigger a real Hunar voice phone screen, watch the live call state and extracted result |
| People Search & Reachout | `/talent-search` | Paste a JD, get a ranked shortlist from a 1,000+ profile seeded talent pool, view it as a radial Match Graph, and trigger individual or batch voice reachout calls |

Every call — hiring screen or reachout — is a **real** outbound call placed through
Hunar's live `/calls` API, tracked end-to-end via signed webhooks
(`call_status_updated`, `call_recording_done`, `call_result_done`,
`call_summary`), verified with HMAC-SHA256 before anything is written to the
database.

## Stack

- **Backend:** FastAPI + asyncpg, deployed as a Vercel Python Function (`api/`)
- **Frontend:** Vite + React 19 + TypeScript + Tailwind v4, deployed as a static SPA (`web/`)
- **Database:** Neon Postgres, isolated in its own `custom_app` schema (fully
  independent of the original app's tables in the same project's database)
- **Motion:** Framer Motion (page transitions, 3D tilt cards, spring physics)
- **3D:** Three.js (landing page hero)
- **Voice:** Hunar Voice AI (`api.voice.hunar.ai`) — 6 selectable personas (Neha, Roy, Zoe, Sam, Mira, Eesha)

One Vercel project serves both: `vercel.json` builds the Vite app to
`web/dist` and rewrites everything to `index.html` (SPA fallback) except
`/api/*`, which routes to the Python function.

## Features

- **Voice persona picker** — choose which of Hunar's 6 personas conducts the call, per requisition/search
- **Match Graph** — candidates arranged around the job at a distance driven by their real match score (closer = stronger match), each node showing their actual photo
- **Live call console** — call timer, retry-budget, and connection gauges read from the real call row; a decorative (explicitly labeled) oscilloscope waveform while a call is live
- **Autonomous Agents suite** — see below

### Autonomous Agents

All eight are rule-based reads of the structured fields Hunar's own voice agent
already extracts from the conversation (`recommendation`, `open_to_opportunity`,
`next_step`, …) — **no separate LLM/agent API key is used anywhere in this
suite.** Toggle "Autonomous Dial Engine" on any requisition/search to turn all
of this on for it.

1. **Autonomous Dial Engine** — new candidates get dialed the moment they're added, no manual "Call" click
2. **Batch-Sourcing Agent** — the instant a Talent Search sweep finishes, auto-dials the top matches if autonomous mode is on
3. **Auto-Triage Agent** — tags each completed call advance/hold/reject from Hunar's own recommendation field
4. **Cross-Pipeline Sync Agent** — a Talent Search reachout that comes back interested is auto-mirrored into the matching Hiring requisition
5. **Smart Retry Agent** — a "maybe later" result schedules one more autonomous attempt a few days out
6. **Guardrail Requeue Agent** — autonomous runs simply don't fire outside allowed calling hours; the next scheduled run picks the queue back up
7. **Do-Not-Call Guard** — an explicit "don't contact again" permanently blocks that phone number across every future campaign
8. **Requisition Health Monitor** — passively flags a stalled pipeline or a low advance rate; no dialing of its own

The background sweep runs via Vercel Cron (`/api/autonomous/tick`, protected by
a `CRON_SECRET` bearer check) — capped to once a day on this project's Hobby
plan. A "Run now" button in the UI triggers the same logic on demand for
testing/demos without waiting for the schedule.

## Honesty notes (things this app deliberately does *not* fake)

- The seeded talent pool (1,000+ profiles) is clearly labeled as seeded demo
  data, not a live PDL/Apollo/Proxycurl integration (none were available with
  free API access at build time) — the search adapter is provider-agnostic, so
  swapping in a real one requires zero UI changes.
- There is no live turn-by-turn transcript API from Hunar — only a final
  structured result + recording — so the "conversation feed" renders what's
  actually available (one bubble per extracted field), not a fabricated
  back-and-forth.
- The live-call waveform is explicitly decorative (indicates "call is live",
  not real audio amplitude).

## Local development

```bash
# Backend
cd api
python -m venv venv && ./venv/Scripts/activate  # or source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in DATABASE_URL, HUNAR_API_KEY
uvicorn app.main:app --port 8001 --reload

# Frontend
cd web
npm install
cp .env.example .env.local   # VITE_API_URL=http://localhost:8001
npm run dev
```

## Deployment (Vercel)

Env vars required on the Vercel project:

| Var | Notes |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `HUNAR_API_KEY` | Hunar Voice AI API key |
| `HUNAR_API_BASE_URL` | defaults to `https://api.voice.hunar.ai/external/v1` |
| `CORS_ORIGINS` | `*` is fine for same-origin deployment |
| `APP_BASE_URL` | the deployment's own public HTTPS URL — Hunar rejects non-HTTPS webhook callback URLs, so this must be set explicitly (falls back to Vercel's `VERCEL_URL` if unset) |
| `CRON_SECRET` | any random string; Vercel sends it back as `Authorization: Bearer <value>` when invoking the cron endpoint |

**Known quirk:** on this project, a *second* `vercel --prod` deploy to an
already-deployed project has reliably hung indefinitely (stuck at `UNKNOWN`
status with no build logs), independent of any code/config change. The
reliable workaround used throughout this build: `vercel remove <project> --yes`
then `vercel link --yes --project <same-name>` and redeploy — this always
completes in well under a minute. Re-add all env vars after recreating the
project, since removing it wipes them.
