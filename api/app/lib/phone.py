import re

E164_REGEX = re.compile(r"^\+[1-9]\d{6,14}$")


def is_e164(phone: str) -> bool:
    return bool(E164_REGEX.match(phone.strip()))


def phone_hint(phone: str) -> str | None:
    trimmed = phone.strip()
    if not trimmed:
        return None
    if is_e164(trimmed):
        return None
    if not trimmed.startswith("+"):
        digits = re.sub(r"\D", "", trimmed)
        if len(digits) == 10:
            return f"Missing country code — for example, in India that'd be +91{digits}"
        return "Must start with + and a country code (no spaces or dashes), e.g. +917411771293"
    return "Must be + followed by 7-15 digits only, e.g. +917411771293"
