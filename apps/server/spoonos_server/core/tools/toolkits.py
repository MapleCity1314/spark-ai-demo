from typing import Any, Dict, List, Optional

from fastapi import HTTPException

try:
    from spoon_toolkits.web.web_scraper import WebScraperTool
except Exception:  # pragma: no cover - optional toolkit
    WebScraperTool = None

try:
    from spoon_toolkits.crypto.neo import (
        GetBestBlockHashTool,
        GetBlockCountTool,
        GetRecentBlocksInfoTool,
    )
except Exception:  # pragma: no cover - optional toolkit
    GetBestBlockHashTool = None
    GetBlockCountTool = None
    GetRecentBlocksInfoTool = None

try:
    from spoonos_server.core.tools.test_tools import (
        DelayTool,
        EchoTool,
        ErrorTool,
        JsonRenderTool,
    )
except Exception:  # pragma: no cover - optional toolkit
    DelayTool = None
    EchoTool = None
    ErrorTool = None
    JsonRenderTool = None

try:
    from spoonos_server.core.tools.profile_tools import MBTIProfileCreateTool
except Exception:  # pragma: no cover - optional toolkit
    MBTIProfileCreateTool = None

try:
    from spoonos_server.core.tools.mbti_questionnaire_tools import (
        MBTITraderQuestionnaireTool,
        MBTITraderQuestionnaireNextTool,
    )
except Exception:  # pragma: no cover - optional toolkit
    MBTITraderQuestionnaireTool = None
    MBTITraderQuestionnaireNextTool = None


TOOLKIT_REGISTRY: Dict[str, Any] = {
    "web": lambda: [WebScraperTool()] if WebScraperTool else [],
    "neo": lambda: [
        tool()
        for tool in (GetBlockCountTool, GetBestBlockHashTool, GetRecentBlocksInfoTool)
        if tool
    ],
    "test": lambda: [
        tool()
        for tool in (EchoTool, JsonRenderTool, DelayTool, ErrorTool)
        if tool
    ],
    "profile": lambda: [
        tool()
        for tool in (
            MBTIProfileCreateTool,
            MBTITraderQuestionnaireTool,
            MBTITraderQuestionnaireNextTool,
        )
        if tool
    ],
}


def resolve_toolkits(
    requested: Optional[List[str]], default_toolkits: List[str]
) -> List[str]:
    if requested is None:
        return default_toolkits
    return requested


def load_toolkits(toolkits: List[str]) -> List[Any]:
    tools: List[Any] = []

    for toolkit_name in toolkits:
        factory = TOOLKIT_REGISTRY.get(toolkit_name)
        if not factory:
            raise HTTPException(
                status_code=400, detail=f"Unknown toolkit: {toolkit_name}"
            )
        tools.extend(factory())

    return tools


def available_toolkits() -> List[str]:
    return sorted(TOOLKIT_REGISTRY.keys())
