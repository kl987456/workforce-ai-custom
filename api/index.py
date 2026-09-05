import os
import sys

# Vercel's Python runtime imports this file via a custom loader (not a plain
# `python index.py`), so it does NOT automatically add this file's own
# directory to sys.path the way a normal script execution would. Without
# this, `from app.main import app` fails with ModuleNotFoundError even
# though app/ sits right next to this file, because Python can't find it.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app  # noqa: E402,F401 — Vercel's Python runtime looks for `app` here
