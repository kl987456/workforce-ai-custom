import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal, Optional

from .. import config, db
from ..lib import hunar
from ..lib.ensure_agent import get_or_create_default_agent
from ..lib.phone import E164_REGEX
from ..serialize import row_to_dict


async def _resolve_agent(conn, purpose: str, campaign_id):
    """Use the persona the requisition/search was created with, if any —
    falling back to the fixed default agent for campaign-less calls or
    campaigns created before the persona picker existed."""
    if campaign_id:
        campaign = await conn.fetchrow(
            "SELECT agent_id FROM custom_app.capp_campaigns WHERE id = $1", campaign_id
        )
        if campaign and campaign["agent_id"]:
            agent = await conn.fetchrow(
                "SELECT * FROM custom_app.capp_agents WHERE id = $1", campaign["agent_id"]
            )
            if agent:
                return dict(agent)
    return await get_or_create_default_agent(purpose)

router = APIRouter(prefix="/api/calls", tags=["calls"])


class CreateCallBody(BaseModel):
    candidateId: str
    purpose: Literal["HIRING_SCREEN", "TALENT_REACHOUT"]
    campaignId: Optional[str] = None
    phoneOverride: Optional[str] = None


class BulkCallBody(BaseModel):
    candidateIds: list[str]
    purpose: Literal["HIRING_SCREEN", "TALENT_REACHOUT"]
    campaignId: Optional[str] = None


async def _place_call(conn, candidate, agent, campaign_id: Optional[str], phone_override: Optional[str]):
    phone = phone_override or candidate["phone"]
    if not E164_REGEX.match(phone):
        return None, "Phone number must be in E.164 format, e.g. +917411771293"

    call_row = await conn.fetchrow(
        """
        INSERT INTO custom_app.capp_calls (candidate_id, agent_id, campaign_id, status)
        VALUES ($1,$2,$3,'NOT_STARTED')
        RETURNING *
        """,
        candidate["id"],
        agent["id"],
        campaign_id,
    )

    webhook_url = f"{config.APP_BASE_URL}/api/webhooks/hunar"
    skills = candidate["skills"]
    if isinstance(skills, str):
        skills = json.loads(skills)

    try:
        hunar_call = await hunar.create_call(
            {
                "agent_id": agent["hunar_agent_id"],
                "callee_name": candidate["name"],
                "mobile_number": phone,
                "request_id": str(call_row["id"]),
                "custom_data": {
                    "role_title": candidate["role_title"] or "the role",
                    "company": candidate["company"] or "our company",
                    "key_skills": ", ".join(skills or []),
                },
                "guardrails": {
                    "allowed_days": ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
                    "earliest_call_time": "08:00",
                    "last_call_time": "21:00",
                },
                "retry_config": {"max_retry_count": 1, "retry_interval_hours": 3},
                "callback_config": {
                    "call_status_callback_url": webhook_url,
                    "call_recording_callback_url": webhook_url,
                    "call_result_callback_url": webhook_url,
                    "call_summary_callback_url": webhook_url,
                },
            }
        )
        updated = await conn.fetchrow(
            """
            UPDATE custom_app.capp_calls SET hunar_call_id=$1, status=$2, lifecycle_status=$3, updated_at=now()
            WHERE id=$4 RETURNING *
            """,
            hunar_call["id"],
            hunar_call.get("status", "INITIATED"),
            hunar_call.get("lifecycle_status"),
            call_row["id"],
        )
        return row_to_dict(updated, ("result",)), None
    except hunar.HunarApiError as e:
        await conn.execute(
            "UPDATE custom_app.capp_calls SET status='FAILED', updated_at=now() WHERE id=$1", call_row["id"]
        )
        return None, str(e)


@router.get("")
async def list_calls(campaignId: Optional[str] = None):
    pool = await db.get_pool()
    async with pool.acquire() as conn:
        if campaignId:
            rows = await conn.fetch(
                "SELECT * FROM custom_app.capp_calls WHERE campaign_id = $1 ORDER BY created_at DESC", campaignId
            )
        else:
            rows = await conn.fetch("SELECT * FROM custom_app.capp_calls ORDER BY created_at DESC")
    return {"calls": [row_to_dict(r, ("result",)) for r in rows]}


@router.post("", status_code=201)
async def create_call(body: CreateCallBody):
    pool = await db.get_pool()
    async with pool.acquire() as conn:
        candidate = await conn.fetchrow(
            "SELECT * FROM custom_app.capp_candidates WHERE id = $1", body.candidateId
        )
        if not candidate:
            raise HTTPException(404, "Candidate not found")

        agent = await _resolve_agent(conn, body.purpose, body.campaignId)
        call, error = await _place_call(conn, candidate, agent, body.campaignId, body.phoneOverride)
        if error:
            raise HTTPException(502, error)
        return {"call": call}


@router.post("/bulk", status_code=201)
async def create_bulk_calls(body: BulkCallBody):
    pool = await db.get_pool()
    results = []
    errors = []
    async with pool.acquire() as conn:
        agent = await _resolve_agent(conn, body.purpose, body.campaignId)
        for candidate_id in body.candidateIds:
            candidate = await conn.fetchrow(
                "SELECT * FROM custom_app.capp_candidates WHERE id = $1", candidate_id
            )
            if not candidate:
                errors.append({"candidateId": candidate_id, "error": "not found"})
                continue
            call, error = await _place_call(conn, candidate, agent, body.campaignId, None)
            if error:
                errors.append({"candidateId": candidate_id, "error": error})
            else:
                results.append(call)
    return {"placed": results, "errors": errors}
