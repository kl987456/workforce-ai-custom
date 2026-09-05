"""Rule-based reads of Hunar's own structured call result — no LLM call, no
extra API key. Every function here just looks at fields Hunar already
extracted from the conversation (recommendation, open_to_opportunity,
next_step) and maps them to an action. This is what backs the Auto-Triage,
Do-Not-Call Guard, and Smart Retry autonomous agents.
"""


def derive_triage(result: dict | None, purpose: str) -> str | None:
    """Normalizes the purpose-specific result field into advance/hold/reject."""
    if not result:
        return None
    if purpose == "HIRING_SCREEN":
        rec = str(result.get("recommendation") or "").lower()
        if rec in ("advance", "hold", "reject"):
            return rec
        return None
    if purpose == "TALENT_REACHOUT":
        opp = str(result.get("open_to_opportunity") or "").lower()
        if opp == "yes":
            return "advance"
        if opp == "maybe_later":
            return "hold"
        if opp == "no":
            return "reject"
        return None
    return None


def wants_no_further_contact(result: dict | None) -> bool:
    """Only fires on an explicit opt-out phrase in next_step — a plain 'no' to
    this one opportunity is a normal reject, not a do-not-call signal."""
    if not result:
        return False
    next_step = str(result.get("next_step") or "").lower()
    return "do not contact" in next_step or "don't contact" in next_step or "do-not-contact" in next_step


def wants_follow_up(result: dict | None, purpose: str) -> bool:
    if not result:
        return False
    if purpose == "TALENT_REACHOUT":
        return str(result.get("open_to_opportunity") or "").lower() == "maybe_later"
    if purpose == "HIRING_SCREEN":
        return str(result.get("recommendation") or "").lower() == "hold"
    return False
