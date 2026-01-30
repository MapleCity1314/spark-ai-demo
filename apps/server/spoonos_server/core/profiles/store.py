import json
import os
import sqlite3
import threading
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

DB_PATH = os.getenv("SPOONOS_PROFILE_DB", "/tmp/spoonos_profiles.sqlite3")

_LOCK = threading.Lock()


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS profiles (
            profile_id TEXT PRIMARY KEY,
            created_at TEXT NOT NULL,
            payload_json TEXT NOT NULL
        )
        """
    )
    return conn


_CONN = _get_conn()


def create_profile(payload: Dict[str, Any]) -> Dict[str, Any]:
    profile_id = str(uuid.uuid4())
    record = {"profile_id": profile_id, "created_at": _utc_now(), **payload}
    payload_json = json.dumps(record, ensure_ascii=False)
    with _LOCK:
        _CONN.execute(
            "INSERT INTO profiles (profile_id, created_at, payload_json) VALUES (?, ?, ?)",
            (profile_id, record["created_at"], payload_json),
        )
        _CONN.commit()
    return record


def get_profile(profile_id: str) -> Optional[Dict[str, Any]]:
    with _LOCK:
        cursor = _CONN.execute(
            "SELECT payload_json FROM profiles WHERE profile_id = ?",
            (profile_id,),
        )
        row = cursor.fetchone()
    if not row:
        return None
    try:
        return json.loads(row[0])
    except json.JSONDecodeError:
        return None
