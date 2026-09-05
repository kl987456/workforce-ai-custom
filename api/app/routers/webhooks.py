import json
from datetime import datetime
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from .. import config, db
from ..lib.webhook import verify_hunar_webhook_signature

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


def _parse_dt(v):
    if not v:
        return None
    try:
        return datetime.fromisoformat(v.replace("Z", "+00:00"))
    except ValueError:
        return None


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
        await conn.execute(
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

    return {"ok": True}
