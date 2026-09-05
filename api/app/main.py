from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import config, db
from .routers import campaigns, calls, webhooks, health, autonomous


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.init_schema()
    yield


app = FastAPI(title="Workforce AI (custom) API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(campaigns.router)
app.include_router(calls.router)
app.include_router(webhooks.router)
app.include_router(autonomous.router)


@app.get("/api")
async def root():
    return {"ok": True, "service": "workforce-ai-custom-api"}
