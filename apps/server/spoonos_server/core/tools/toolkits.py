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
    from spoonos_server.core.tools.crypto_tools import (
        EcosystemTool,
        MarketDataTool,
        OnChainTool,
        RiskAnalysisTool,
        SocialSentimentTool,
        TargetAnalysisTool,
        TechnicalAnalysisTool,
        VolatilityTool,
        SentimentTool,
    )
except Exception:  # pragma: no cover - optional toolkit
    EcosystemTool = None
    MarketDataTool = None
    OnChainTool = None
    RiskAnalysisTool = None
    SocialSentimentTool = None
    TargetAnalysisTool = None
    TechnicalAnalysisTool = None
    VolatilityTool = None
    SentimentTool = None


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
    "profile": lambda: [MBTIProfileCreateTool()] if MBTIProfileCreateTool else [],
    "crypto": lambda: [
        tool()
        for tool in (
            MarketDataTool,
            SentimentTool,
            SocialSentimentTool,
            TargetAnalysisTool,
            TechnicalAnalysisTool,
            VolatilityTool,
            RiskAnalysisTool,
            EcosystemTool,
            OnChainTool,
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
