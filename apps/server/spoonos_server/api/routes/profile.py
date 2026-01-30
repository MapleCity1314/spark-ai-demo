from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from spoonos_server.core.profiles import create_profile, get_profile
from spoonos_server.core.profiles.mbti_profile import build_mbti_profile


router = APIRouter()


class QuestionnaireAnswer(BaseModel):
    id: str
    choice: Dict[str, Any]


class ProfileCreateRequest(BaseModel):
    questionnaire_answers: List[QuestionnaireAnswer]
    questionnaire_version: Optional[str] = "v1"


@router.get("/v1/profiles/{profile_id}")
def fetch_profile(profile_id: str) -> Dict[str, Any]:
    profile = get_profile(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.post("/v1/profiles")
def create_profile_from_questionnaire(
    request: ProfileCreateRequest,
) -> Dict[str, Any]:
    payload = build_mbti_profile(
        [answer.model_dump() for answer in request.questionnaire_answers]
    )
    stored = create_profile(
        {
            "profile": payload["profile"],
            "questionnaire_data": {
                "version": request.questionnaire_version,
                "answers": [answer.model_dump() for answer in request.questionnaire_answers],
            },
            "profile_prompt": payload["profile_prompt"],
            "notes": "auto-generated from questionnaire",
        }
    )
    return stored
