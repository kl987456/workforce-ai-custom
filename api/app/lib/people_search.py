import json
import re
from pathlib import Path

_SEED_PATH = Path(__file__).parent / "seed_data.json"
with open(_SEED_PATH, "r", encoding="utf-8") as f:
    SEEDED_TALENT_POOL: list[dict] = json.load(f)

STOPWORDS = {
    "the", "and", "for", "with", "you", "our", "are", "will", "have", "has",
    "this", "that", "from", "your", "who", "role", "job", "team", "work",
    "years", "year", "experience", "strong", "ability", "must", "should",
    "we're", "we", "looking", "candidate", "candidates", "responsibilities",
    "requirements", "about", "company", "a", "an", "of", "to", "in", "on",
    "is", "as", "or", "at", "be", "not", "into", "using",
}


def parse_job_description(raw: str) -> dict:
    tokens = re.sub(r"[^a-z0-9+.#\s]", " ", raw.lower()).split()
    keywords = list(dict.fromkeys(t for t in tokens if len(t) > 1 and t not in STOPWORDS))

    seniority_match = re.search(
        r"\b(intern|junior|entry[- ]level|mid[- ]level|senior|staff|principal|lead|director|vp|head of)\b",
        raw,
        re.IGNORECASE,
    )
    # Only trust an explicit remote/hybrid/on-site keyword, or a "City, ST"-shaped
    # pattern — a bare capitalized word is not a reliable location signal.
    location_match = re.search(r"\b(remote|hybrid|on[- ]site)\b", raw, re.IGNORECASE) or re.search(
        r"\b[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s?[A-Z]{2}\b", raw
    )
    years_match = re.search(r"(\d{1,2})\s*\+?\s*(?:years?|yrs?)", raw, re.IGNORECASE)

    return {
        "raw": raw,
        "keywords": keywords,
        "seniority": seniority_match.group(0).lower() if seniority_match else None,
        "location": location_match.group(0) if location_match else None,
        "min_years_experience": int(years_match.group(1)) if years_match else None,
    }


def _score_candidate(candidate: dict, query: dict) -> float:
    haystack = " ".join(
        [candidate["title"], candidate["summary"], candidate["company"], *candidate["skills"]]
    ).lower()

    keywords = query["keywords"]
    hits = sum(1 for kw in keywords if kw in haystack)
    keyword_score = hits / max(len(keywords), 1)

    matched_skills = [
        s
        for s in candidate["skills"]
        if any(kw in s.lower() or s.lower() in kw for kw in keywords)
    ]
    skill_score = len(matched_skills) / max(len(candidate["skills"]), 1)

    seniority = query.get("seniority")
    seniority_score = 1.0 if seniority and seniority in candidate["title"].lower() else 0.0

    min_years = query.get("min_years_experience")
    if min_years is None:
        experience_score = 0.5
    else:
        gap = candidate["yearsExperience"] - min_years
        experience_score = max(0.7, 1 - gap * 0.02) if gap >= 0 else max(0, 1 + gap * 0.18)

    base = keyword_score * 0.4 + skill_score * 0.3 + seniority_score * 0.1 + experience_score * 0.2
    return max(0.0, min(1.0, base))


def search_candidates(query: dict, limit: int = 12) -> list[dict]:
    scored = [
        {**c, "matchScore": _score_candidate(c, query)} for c in SEEDED_TALENT_POOL
    ]
    scored.sort(key=lambda c: c["matchScore"], reverse=True)
    top = scored[:limit]
    for c in top:
        c["matchScore"] = round(c["matchScore"] * 1000) / 10
    return top
