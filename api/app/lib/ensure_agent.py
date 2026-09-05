import json
from .. import db
from . import hunar
from .agent_templates import DEFAULT_PERSONA, VOICE_PERSONAS, build_agent_template


async def get_or_create_agent(purpose: str, persona_code: str) -> dict:
    if persona_code not in VOICE_PERSONAS:
        persona_code = DEFAULT_PERSONA[purpose]

    pool = await db.get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM custom_app.capp_agents WHERE purpose = $1 AND voice_persona = $2 LIMIT 1",
            purpose,
            persona_code,
        )
        if row:
            return dict(row)

        template = build_agent_template(purpose, persona_code)
        created = await hunar.create_agent(template)

        row = await conn.fetchrow(
            """
            INSERT INTO custom_app.capp_agents
              (hunar_agent_id, purpose, name, language, voice_persona, persona_name,
               agent_prompt, objective, introduction, result_prompt, result_schema)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            RETURNING *
            """,
            created["id"],
            purpose,
            template["name"],
            template["language"],
            template["voice_persona"],
            template.get("persona_name"),
            template["agent_prompt"],
            template["objective"],
            template["introduction"],
            template["result_prompt"],
            json.dumps(template["result_schema"]),
        )
        return dict(row)


async def get_or_create_default_agent(purpose: str) -> dict:
    return await get_or_create_agent(purpose, DEFAULT_PERSONA[purpose])
