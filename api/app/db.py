import asyncpg
from . import config

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            config.DATABASE_URL, min_size=0, max_size=5, ssl="require"
        )
    return _pool


async def init_schema():
    pool = await get_pool()
    with open(__file__.replace("db.py", "schema.sql"), "r", encoding="utf-8") as f:
        sql = f.read()
    async with pool.acquire() as conn:
        await conn.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA public;")
        await conn.execute(sql)
