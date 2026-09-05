import httpx
from .. import config


class HunarApiError(Exception):
    def __init__(self, status: int, body):
        self.status = status
        self.body = body
        super().__init__(f"Hunar API error ({status}): {body}")


def _headers():
    if not config.HUNAR_API_KEY:
        raise RuntimeError("HUNAR_API_KEY is not set")
    return {"Content-Type": "application/json", "X-API-Key": config.HUNAR_API_KEY}


async def _request(method: str, path: str, json_body: dict | None = None):
    url = f"{config.HUNAR_API_BASE_URL}{path}"
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.request(method, url, headers=_headers(), json=json_body)
    body = res.json() if res.content else None
    if res.status_code >= 400:
        raise HunarApiError(res.status_code, body)
    return body


async def create_agent(payload: dict) -> dict:
    return await _request("POST", "/agents/", payload)


async def get_agent(agent_id: str) -> dict:
    return await _request("GET", f"/agents/{agent_id}/")


async def create_call(payload: dict) -> dict:
    return await _request("POST", "/calls/", payload)


async def get_call(call_id: str) -> dict:
    return await _request("GET", f"/calls/{call_id}/")


async def list_numbers() -> dict:
    return await _request("GET", "/numbers/")
