import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Literal, Optional

from .. import db
from ..lib.agent_templates import VOICE_PERSONAS
from ..lib.ensure_agent import get_or_create_agent
from ..lib.people_search import parse_job_description, search_candidates
from ..lib.phone import E164_REGEX
from ..lib.triage import derive_triage
from ..serialize import row_to_dict
from .autonomous import run_campaign_dials

router = APIRouter(prefix="/api/campaigns", tags=["campaigns"])

PURPOSE_BY_KIND = {"HIRING": "HIRING_SCREEN", "TALENT_SEARCH": "TALENT_REACHOUT"}

CAMPAIGN_SELECT = """
    SELECT c.*, a.voice_persona, a.persona_name
    FROM custom_app.capp_campaigns c
    LEFT JOIN custom_app.capp_agents a ON a.id = c.agent_id
"""


class CreateCampaignBody(BaseModel):
    kind: Literal["HIRING", "TALENT_SEARCH"]
    title: str = Field(min_length=2)
    department: Optional[str] = None
    location: Optional[str] = None
    jobDescription: str = Field(min_length=10)
    voicePersona: Optional[str] = None
    autonomousEnabled: bool = False


class SetAutonomousBody(BaseModel):
    autonomousEnabled: bool


class AddCandidateBody(BaseModel):
    name: str = Field(min_length=2)
    phone: str
    email: Optional[str] = None
    roleTitle: Optional[str] = None
    location: Optional[str] = None
    skills: Optional[list[str]] = None


@router.get("")
async def list_campaigns(kind: Optional[str] = None):
    pool = await db.get_pool()
    async with pool.acquire() as conn:
        if kind in ("HIRING", "TALENT_SEARCH"):
            rows = await conn.fetch(CAMPAIGN_SELECT + " WHERE c.kind = $1 ORDER BY c.created_at DESC", kind)
        else:
            rows = await conn.fetch(CAMPAIGN_SELECT + " ORDER BY c.created_at DESC")
    return {"campaigns": [row_to_dict(r, ("parsed_filters",)) for r in rows]}


@router.get("/voice-personas")
async def list_voice_personas():
    return {"personas": [{"code": code, "name": name} for code, name in VOICE_PERSONAS.items()]}


@router.post("", status_code=201)
async def create_campaign(body: CreateCampaignBody):
    pool = await db.get_pool()
    parsed = parse_job_description(body.jobDescription)
    purpose = PURPOSE_BY_KIND[body.kind]

    async with pool.acquire() as conn:
        agent = await get_or_create_agent(purpose, body.voicePersona) if body.voicePersona else None
        row = await conn.fetchrow(
            """
            INSERT INTO custom_app.capp_campaigns
              (kind, title, department, location, job_description, parsed_filters, agent_id, autonomous_enabled)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            RETURNING *
            """,
            body.kind,
            body.title,
            body.department,
            body.location or parsed.get("location"),
            body.jobDescription,
            json.dumps(parsed),
            agent["id"] if agent else None,
            body.autonomousEnabled,
        )
        campaign = row_to_dict(row, ("parsed_filters",))
        campaign["voice_persona"] = agent["voice_persona"] if agent else None
        campaign["persona_name"] = agent["persona_name"] if agent else None

        seeded = []
        if body.kind == "TALENT_SEARCH":
            results = search_candidates(parsed, limit=60)
            if results:
                # One multi-row INSERT instead of N sequential round-trips — with 60
                # seeded matches, sequential awaited inserts took 8-10+ seconds and
                # made the UI look hung; this does it in a single round-trip.
                cols = (
                    "campaign_id", "name", "email", "phone", "role_title", "company",
                    "location", "years_experience", "skills", "match_score", "source", "profile",
                )
                values_sql = []
                args: list = []
                for i, r in enumerate(results):
                    base = i * len(cols)
                    placeholders = ", ".join(f"${base + j + 1}" for j in range(len(cols)))
                    values_sql.append(f"({placeholders})")
                    args.extend([
                        campaign["id"], r["name"], r["email"], r["phone"], r["title"],
                        r["company"], r["location"], r["yearsExperience"],
                        json.dumps(r["skills"]), r["matchScore"], "SEEDED_SEARCH",
                        json.dumps({"summary": r["summary"], "provider": "seeded-demo-pool"}),
                    ])
                query = f"""
                    INSERT INTO custom_app.capp_candidates ({", ".join(cols)})
                    VALUES {", ".join(values_sql)}
                    RETURNING *
                """
                rows = await conn.fetch(query, *args)
                seeded = [row_to_dict(row, ("skills", "profile")) for row in rows]

        dial_summary = None
        if body.autonomousEnabled:
            # Batch-Sourcing Agent: don't wait for the next tick — a fresh
            # search in autonomous mode starts dialing its top matches
            # immediately.
            dial_summary = await run_campaign_dials(conn, dict(row))

        return {"campaign": campaign, "candidates": seeded, "autonomousDial": dial_summary}


@router.get("/{campaign_id}")
async def get_campaign(campaign_id: str):
    pool = await db.get_pool()
    async with pool.acquire() as conn:
        crow = await conn.fetchrow(CAMPAIGN_SELECT + " WHERE c.id = $1", campaign_id)
        if not crow:
            raise HTTPException(404, "Campaign not found")

        candidate_rows = await conn.fetch(
            "SELECT * FROM custom_app.capp_candidates WHERE campaign_id = $1 ORDER BY match_score DESC NULLS LAST",
            campaign_id,
        )
        call_rows = await conn.fetch(
            """
            SELECT c.*, agents.purpose AS agent_purpose, row_to_json(cand.*) AS candidate_json
            FROM custom_app.capp_calls c
            LEFT JOIN custom_app.capp_candidates cand ON cand.id = c.candidate_id
            LEFT JOIN custom_app.capp_agents agents ON agents.id = c.agent_id
            WHERE c.campaign_id = $1
            ORDER BY c.created_at DESC
            """,
            campaign_id,
        )

    calls = []
    triages = []  # (status, updated_at as real datetime, triage) — for health, before datetime->str conversion
    for r in call_rows:
        d = row_to_dict(r, ("result",))
        cand_json = d.pop("candidate_json", None)
        purpose = d.pop("agent_purpose", None)
        triage = derive_triage(d.get("result"), purpose) if purpose else None
        d["triage"] = triage
        triages.append((r["status"], r["updated_at"], triage))
        if cand_json:
            cand = json.loads(cand_json) if isinstance(cand_json, str) else cand_json
            if cand.get("skills") and isinstance(cand["skills"], str):
                cand["skills"] = json.loads(cand["skills"])
            d["candidate"] = cand
        calls.append(d)

    return {
        "campaign": row_to_dict(crow, ("parsed_filters",)),
        "candidates": [row_to_dict(r, ("skills", "profile")) for r in candidate_rows],
        "calls": calls,
        "health": _compute_health(candidate_rows, triages),
    }


def _compute_health(candidate_rows, triages: list) -> dict:
    """Requisition Health Monitor — a passive read of existing data, no
    dialing of its own. Flags a pipeline that's stalled or trending badly so
    it surfaces as a banner instead of silently sitting there."""
    from datetime import datetime, timedelta, timezone

    completed_triaged = [t for (status, _, t) in triages if status == "COMPLETED" and t]
    advance_rate = (
        len([t for t in completed_triaged if t == "advance"]) / len(completed_triaged)
        if completed_triaged
        else None
    )

    stalled = False
    if candidate_rows and triages:
        latest = max((u if u.tzinfo else u.replace(tzinfo=timezone.utc)) for (_, u, _) in triages)
        stalled = (datetime.now(timezone.utc) - latest) > timedelta(hours=24)
    elif candidate_rows and not triages:
        stalled = True

    return {
        "stalled": stalled,
        "lowAdvanceRate": advance_rate is not None and len(completed_triaged) >= 3 and advance_rate < 0.2,
        "advanceRate": advance_rate,
    }


@router.patch("/{campaign_id}/autonomous")
async def set_autonomous(campaign_id: str, body: SetAutonomousBody):
    pool = await db.get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE custom_app.capp_campaigns SET autonomous_enabled = $1 WHERE id = $2 RETURNING *",
            body.autonomousEnabled,
            campaign_id,
        )
        if not row:
            raise HTTPException(404, "Campaign not found")
        dial_summary = None
        if body.autonomousEnabled:
            # Turning it on for an existing requisition/search immediately
            # sweeps whoever's already sitting there not-yet-called.
            dial_summary = await run_campaign_dials(conn, dict(row))
    return {"campaign": row_to_dict(row, ("parsed_filters",)), "autonomousDial": dial_summary}


@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: str):
    pool = await db.get_pool()
    async with pool.acquire() as conn:
        crow = await conn.fetchrow("SELECT id FROM custom_app.capp_campaigns WHERE id = $1", campaign_id)
        if not crow:
            raise HTTPException(404, "Campaign not found")
        await conn.execute("DELETE FROM custom_app.capp_calls WHERE campaign_id = $1", campaign_id)
        await conn.execute("DELETE FROM custom_app.capp_candidates WHERE campaign_id = $1", campaign_id)
        await conn.execute("DELETE FROM custom_app.capp_campaigns WHERE id = $1", campaign_id)
    return {"ok": True}


@router.post("/{campaign_id}/candidates", status_code=201)
async def add_candidate(campaign_id: str, body: AddCandidateBody):
    if not E164_REGEX.match(body.phone):
        raise HTTPException(
            422, "Phone must be E.164 format: + followed by country code and number, e.g. +917411771293"
        )
    pool = await db.get_pool()
    async with pool.acquire() as conn:
        campaign = await conn.fetchrow("SELECT * FROM custom_app.capp_campaigns WHERE id = $1", campaign_id)
        if not campaign:
            raise HTTPException(404, "Campaign not found")
        row = await conn.fetchrow(
            """
            INSERT INTO custom_app.capp_candidates
              (campaign_id, name, email, phone, role_title, location, skills, source)
            VALUES ($1,$2,$3,$4,$5,$6,$7,'MANUAL')
            RETURNING *
            """,
            campaign_id,
            body.name,
            body.email,
            body.phone,
            body.roleTitle or campaign["title"],
            body.location,
            json.dumps(body.skills or []),
        )
    return {"candidate": row_to_dict(row, ("skills", "profile"))}
