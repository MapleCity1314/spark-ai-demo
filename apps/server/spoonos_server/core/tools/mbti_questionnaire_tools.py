from typing import Any, Dict, List, Optional

try:
    from spoon_ai.tools.base import BaseTool
except Exception:  # pragma: no cover - optional dependency
    BaseTool = None


def _tool_schema(properties: Dict[str, Any], required: Optional[list] = None) -> dict:
    schema = {"type": "object", "properties": properties}
    if required:
        schema["required"] = required
    return schema


def _build_questionnaire() -> Dict[str, Any]:
    questions: List[Dict[str, Any]] = [
        {
            "id": "q1",
            "dimension": "E/I",
            "question": "你做交易决策时更偏向哪种信息来源？",
            "options": [
                {"id": "A", "text": "社群/市场情绪与公开讨论"},
                {"id": "B", "text": "独立研究与数据验证"},
            ],
        },
        {
            "id": "q2",
            "dimension": "S/N",
            "question": "你更依赖哪类信号构建交易观点？",
            "options": [
                {"id": "A", "text": "价格行为/技术面/盘口数据"},
                {"id": "B", "text": "宏观趋势/基本面/长期叙事"},
            ],
        },
        {
            "id": "q3",
            "dimension": "T/F",
            "question": "你在做决策时更看重什么？",
            "options": [
                {"id": "A", "text": "可量化指标与逻辑一致性"},
                {"id": "B", "text": "直觉判断与情境理解"},
            ],
        },
        {
            "id": "q4",
            "dimension": "J/P",
            "question": "你的执行方式更接近哪一种？",
            "options": [
                {"id": "A", "text": "严格执行既定规则与止损"},
                {"id": "B", "text": "灵活调整仓位与策略"},
            ],
        },
    ]
    return {
        "title": "MBTI 量化交易者画像问卷（测试版）",
        "version": "v1",
        "current_index": 0,
        "questions": questions,
    }


if BaseTool:
    class MBTITraderQuestionnaireTool(BaseTool):
        name: str = "mbti_trader_questionnaire"
        description: str = "生成 MBTI 量化交易者画像问卷（结构化题目）。"
        parameters: dict = _tool_schema(
            {
                "version": {
                    "type": "string",
                    "description": "问卷版本（可选，默认 v1）。",
                }
            }
        )

        async def execute(self, version: Optional[str] = None) -> Dict[str, Any]:
            payload = _build_questionnaire()
            if version and version != "v1":
                payload["version"] = version
            return payload

else:
    MBTITraderQuestionnaireTool = None
