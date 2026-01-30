from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from spoonos_server.core.profiles import get_profile


router = APIRouter()


@router.get("/v1/profiles/{profile_id}")
def fetch_profile(profile_id: str) -> Dict[str, Any]:
    profile = get_profile(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile
