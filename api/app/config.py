import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

DATABASE_URL = os.environ.get("DATABASE_URL", "")
HUNAR_API_KEY = os.environ.get("HUNAR_API_KEY", "")
HUNAR_API_BASE_URL = os.environ.get(
    "HUNAR_API_BASE_URL", "https://api.voice.hunar.ai/external/v1"
).rstrip("/")
# On Vercel, VERCEL_URL is auto-injected with the live deployment's hostname
# (a fresh one per preview, a stable one for production) — used as the
# fallback so webhook callback URLs are always correct without hand-setting
# APP_BASE_URL per deployment.
_vercel_url = os.environ.get("VERCEL_URL")
_default_base_url = f"https://{_vercel_url}" if _vercel_url else "http://localhost:8000"
APP_BASE_URL = os.environ.get("APP_BASE_URL", _default_base_url).rstrip("/")
CORS_ORIGINS = [o.strip() for o in os.environ.get("CORS_ORIGINS", "*").split(",")]
