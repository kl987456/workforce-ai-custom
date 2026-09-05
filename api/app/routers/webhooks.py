import json
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from .. import config, db
from ..lib.webhook import verify_hunar_webhook_signature
from ..lib.triage import derive_triage, wants_follow_up, wants_no_further_contact
from ..serialize import row_to_dict

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])

FOLLOW_UP_DELAY = timedelta(days=3)


def _parse_dt(v):
    if not v:
        return None
    try:
        return datetime.fromisoformat(v.replace("Z", "+00:00"))
    except ValueError:
        return None


async def _sync_reachout_to_hiring(conn, campaign: dict, candidate: dict, call_result: dict) -> None:
    """Cross-Pipeline Sync Agent: a Talent Search reachout that came back
    'advance' gets mirrored into a Hiring requisition — reusing an existing
    one with the same title, or creating it — so a warm lead doesn't just
    sit in the search results."""
    hiring = await conn.fetchrow(
        "SELECT * FROM custom_app.capp_campaigns WHERE kind = 'HIRING' AND title = $1 LIMIT 1",
        campaign["title"],
    )
    if not hiring:
        hiring = await conn.fetchrow(
            """
            INSERT INTO custom_app.capp_campaigns (kind, title, department, location, job_description, agent_id)
            VALUES ('HIRING', $1, $2, $3, $4, NULL)
            RETURNING *
            """,
            campaign["title"],
            campaign["department"],
            campaign["location"],
            campaign["job_description"],
        )

    existing = await conn.fetchrow(
        "SELECT id FROM custom_app.capp_candidates WHERE campaign_id = $1 AND phone = $2",
        hiring["id"],
        candidate["phone"],
    )
    if existing:
        return

    skills = candidate["skills"]
    if isinstance(skills, str):
        skills = json.loads(skills)

    await conn.execute(
        """
        INSERT INTO custom_app.capp_candidates
          (campaign_id, name, email, phone, role_title, company, location, years_experience, skills, match_score, source, profile)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'REACHOUT_SYNC',$11)
        """,
        hiring["id"],
        candidate["name"],
        candidate["email"],
        candidate["phone"],
        candidate["role_title"],
        candidate["company"],
        candidate["location"],
        candidate["years_experience"],
        json.dumps(skills or []),
        candidate["match_score"],
        json.dumps({"reachout_result": call_result}),
    )


@router.post("/hunar")
async def hunar_webhook(request: Request):
    raw_body = await request.body()
    signature_header = request.headers.get("x-hunar-signature")
    timestamp_header = request.headers.get("x-hunar-timestamp")

    signature_valid = False
    if config.HUNAR_API_KEY:
        signature_valid = verify_hunar_webhook_signature(
            signature_header, timestamp_header, raw_body, [config.HUNAR_API_KEY]
        )

    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError:
        return JSONResponse({"error": "Invalid JSON body"}, status_code=400)

    pool = await db.get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO custom_app.capp_webhook_events (event_type, call_id, request_id, signature_valid, payload)
            VALUES ($1,$2,$3,$4,$5)
            """,
            payload.get("event_type"),
            payload.get("call_id"),
            payload.get("request_id"),
            signature_valid,
            json.dumps(payload),
        )

        if not signature_valid:
            return JSONResponse({"error": "Invalid signature"}, status_code=401)

        match_value = payload.get("request_id") or payload.get("call_id")
        if not match_value:
            return {"ok": True}

        by_request_id = bool(payload.get("request_id"))
        column = "id" if by_request_id else "hunar_call_id"

        result = payload.get("result")
        updated = await conn.fetchrow(
            f"""
            UPDATE custom_app.capp_calls SET
              status = COALESCE($1, status),
              lifecycle_status = COALESCE($2, lifecycle_status),
              answered_by = COALESCE($3, answered_by),
              retry_count = COALESCE($4, retry_count),
              duration_seconds = COALESCE($5, duration_seconds),
              started_at = COALESCE($6, started_at),
              ended_at = COALESCE($7, ended_at),
              recording_url = COALESCE($8, recording_url),
              result = COALESCE($9, result),
              updated_at = now()
            WHERE {column} = $10
            RETURNING *
            """,
            payload.get("status"),
            payload.get("lifecycle_status"),
            payload.get("answered_by"),
            payload.get("retry_count"),
            payload.get("duration_seconds"),
            _parse_dt(payload.get("started_at")),
            _parse_dt(payload.get("ended_at")),
            payload.get("recording_url"),
            json.dumps(result) if result else None,
            match_value,
        )

        # The autonomous agents below only have something to do once a
        # structured result has actually landed (call_result_done) — best
        # effort, since a failure here shouldn't fail the webhook and trigger
        # Hunar's own retry logic for what was otherwise a successful delivery.
        if updated and result:
            try:
                candidate = await conn.fetchrow(
                    "SELECT * FROM custom_app.capp_candidates WHERE id = $1", updated["candidate_id"]
                )
                agent = await conn.fetchrow(
                    "SELECT purpose FROM custom_app.capp_agents WHERE id = $1", updated["agent_id"]
                )
                purpose = agent["purpose"] if agent else None

                if candidate and purpose:
                    if wants_no_further_contact(result):
                        await conn.execute(
                            "UPDATE custom_app.capp_candidates SET do_not_contact = true WHERE phone = $1",
                            candidate["phone"],
                        )
                    elif wants_follow_up(result, purpose):
                        await conn.execute(
                            "UPDATE custom_app.capp_candidates SET next_follow_up_at = $1 WHERE id = $2",
                            datetime.now(timezone.utc) + FOLLOW_UP_DELAY,
                            candidate["id"],
                        )

                    if (
                        purpose == "TALENT_REACHOUT"
                        and derive_triage(result, purpose) == "advance"
                        and updated["campaign_id"]
                    ):
                        campaign = await conn.fetchrow(
                            "SELECT * FROM custom_app.capp_campaigns WHERE id = $1", updated["campaign_id"]
                        )
                        if campaign:
                            await _sync_reachout_to_hiring(conn, dict(campaign), dict(candidate), result)
            except Exception as e:  # noqa: BLE001 — deliberately swallow, see comment above
                print(f"Autonomous post-call processing failed (non-fatal): {e}")

    return {"ok": True}
