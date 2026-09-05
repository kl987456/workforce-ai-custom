import hmac
import hashlib
import base64
import time

MAX_TIMESTAMP_SKEW_SECONDS = 300


def verify_hunar_webhook_signature(
    signature_header: str | None,
    timestamp_header: str | None,
    raw_body: bytes,
    trusted_api_keys: list[str],
) -> bool:
    if not signature_header or not signature_header.strip():
        return False
    if not timestamp_header or not timestamp_header.strip():
        return False

    try:
        timestamp = float(timestamp_header.strip())
    except ValueError:
        return False

    if abs(time.time() - timestamp) > MAX_TIMESTAMP_SKEW_SECONDS:
        return False

    signatures = [s.strip() for s in signature_header.split(",") if s.strip()]
    if not signatures:
        return False

    message = f"{timestamp_header.strip()}.".encode("utf-8") + raw_body

    for key in trusted_api_keys:
        digest = hmac.new(key.encode("utf-8"), message, hashlib.sha256).digest()
        computed = base64.b64encode(digest).decode("ascii")
        for sig in signatures:
            if hmac.compare_digest(sig, computed):
                return True

    return False
