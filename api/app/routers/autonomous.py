from datetime import datetime, timezone
from fastapi import APIRouter, Header, HTTPException
from typing import Optional

from .. import config, db
from .calls import _place_call, _resolve_agent

router = APIRouter(prefix="/api/autonomous", tags=["autonomous"])

PURPOSE_BY_KIND = {"HIRING": "HIRING_SCREEN", "TALENT_SEARCH": "TALENT_REACHOUT"}

# Caps bound how many real phone calls one run can fire off — same spirit as
# Hunar's own guardrails, just applied before we ever call Hunar's API.
MAX_PER_CAMPAIGN_PER_RUN = 5
MAX_TOTAL_PER_TICK = 20

# Guardrail Requeue Agent: rather than trust the request will land inside
# Hunar's own allowed-hours window, autonomous runs simply don't fire outside
# it at all — the next tick (whenever cron runs again) picks the queue back
# up once we're back in-window. Simplified to one fixed UTC window rather
# than per-candidate local time, which nothing in this app tracks.
AUTONOMOUS_START_HOUR_UTC = 8
AUTONOMOUS_END_HOUR_UTC = 21


def _within_calling_hours() -> bool:
    hour = datetime.now(timezone.utc).hour
    return AUTONOMOUS_START_HOUR_UTC <= hour < AUTONOMOUS_END_HOUR_UTC


async def run_campaign_dials(conn, campaign: dict) -> dict:
    """The core of the Autonomous Dial Engine, Batch-Sourcing Agent, and Smart
    Retry Agent: find candidates in `campaign` who either have never been
    called, or were explicitly scheduled for a follow-up attempt, and dial
    them — skipping anyone on the Do-Not-Call list (enforced again inside
    _place_call itself) and anyone outside allowed calling hours."""
    if not _within_calling_hours():
        return {"campaignId": campaign["id"], "dialed": 0, "errors": [], "skipped": "outside allowed calling hours"}

    purpose = PURPOSE_BY_KIND[campaign["kind"]]
    candidates = await conn.fetch(
        """
        SELECT c.* FROM custom_app.capp_candidates c
        WHERE c.campaign_id = $1
          AND c.do_not_contact = false
          AND (
            NOT EXISTS (SELECT 1 FROM custom_app.capp_calls WHERE candidate_id = c.id)
            OR (c.next_follow_up_at IS NOT NULL AND c.next_follow_up_at <= now())
          )
        ORDER BY c.match_score DESC NULLS LAST, c.created_at ASC
        LIMIT $2
        """,
        campaign["id"],
        MAX_PER_CAMPAIGN_PER_RUN,
    )
    if not candidates:
        return {"campaignId": campaign["id"], "dialed": 0, "errors": []}

    # Clear the follow-up flag before dialing so a failed attempt doesn't
    # re-trigger every subsequent tick — one autonomous follow-up is enough.
    await conn.execute(
        "UPDATE custom_app.capp_candidates SET next_follow_up_at = NULL WHERE id = ANY($1::uuid[])",
        [c["id"] for c in candidates],
    )

    agent = await _resolve_agent(conn, purpose, campaign["id"])
    dialed = 0
    errors = []
    for candidate in candidates:
        _call, error = await _place_call(conn, candidate, agent, campaign["id"], None)
        if error:
            errors.append({"candidateId": str(candidate["id"]), "error": error})
        else:
            dialed += 1
    return {"campaignId": campaign["id"], "dialed": dialed, "errors": errors}


@router.post("/run/{campaign_id}")
async def run_campaign_now(campaign_id: str):
    pool = await db.get_pool()
    async with pool.acquire() as conn:
        campaign = await conn.fetchrow("SELECT * FROM custom_app.capp_campaigns WHERE id = $1", campaign_id)
        if not campaign:
            raise HTTPException(404, "Campaign not found")
        if not campaign["autonomous_enabled"]:
            raise HTTPException(400, "Autonomous mode is not enabled for this requisition/search")
        return await run_campaign_dials(conn, dict(campaign))


@router.post("/tick")
async def tick(authorization: Optional[str] = Header(None)):
    # Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically
    # when CRON_SECRET is set as an env var — verified here so nobody else
    # can trigger mass autonomous dialing by hitting this URL directly.
    if config.CRON_SECRET and authorization != f"Bearer {config.CRON_SECRET}":
        raise HTTPException(401, "Unauthorized")

    pool = await db.get_pool()
    results = []
    total_dialed = 0
    async with pool.acquire() as conn:
        campaigns = await conn.fetch("SELECT * FROM custom_app.capp_campaigns WHERE autonomous_enabled = true")
        for campaign in campaigns:
            if total_dialed >= MAX_TOTAL_PER_TICK:
                break
            r = await run_campaign_dials(conn, dict(campaign))
            total_dialed += r["dialed"]
            results.append(r)
    return {"ranAt": datetime.now(timezone.utc).isoformat(), "totalDialed": total_dialed, "campaigns": results}
