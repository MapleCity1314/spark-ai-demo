import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

PROFILE_STORE: Dict[str, Dict[str, Any]] = {}


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def create_profile(payload: Dict[str, Any]) -> Dict[str, Any]:
    profile_id = str(uuid.uuid4())
    record = {
        "profile_id": profile_id,
        "created_at": _utc_now(),
        **payload,
    }
    PROFILE_STORE[profile_id] = record
    return record


def get_profile(profile_id: str) -> Optional[Dict[str, Any]]:
    return PROFILE_STORE.get(profile_id)
