from fastapi import APIRouter
from ..lib import hunar

router = APIRouter(prefix="/api/health", tags=["health"])


@router.get("")
async def health():
    try:
        await hunar.list_numbers()
        return {"hunar": "connected"}
    except Exception as e:
        return {"hunar": "unreachable", "error": str(e)}
