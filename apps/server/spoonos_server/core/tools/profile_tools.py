from typing import Any, Dict, Optional

from spoonos_server.core.profiles import create_profile

try:
    from spoon_ai.tools.base import BaseTool
except Exception:  # pragma: no cover - optional dependency
    BaseTool = None


def _tool_schema(properties: Dict[str, Any], required: Optional[list] = None) -> dict:
    schema = {"type": "object", "properties": properties}
    if required:
        schema["required"] = required
    return schema


if BaseTool:
    class MBTIProfileCreateTool(BaseTool):
        name: str = "mbti_profile_create"
        description: str = (
            "生成并存储 MBTI 量化交易者画像，返回 profile_id 与结构化画像。"
        )
        parameters: dict = _tool_schema(
            {
                "profile": {
                    "type": "object",
                    "description": "结构化用户画像，包含 MBTI 类型与量化交易者模型细节。",
                },
                "questionnaire_data": {
                    "type": "object",
                    "description": "问卷数据或评分结果（可选）。",
                },
                "profile_prompt": {
                    "type": "string",
                    "description": "可直接作为 system prompt 的画像提示词（可选）。",
                },
                "notes": {
                    "type": "string",
                    "description": "生成画像时的简要说明或备注（可选）。",
                },
            },
            required=["profile"],
        )

        async def execute(
            self,
            profile: Dict[str, Any],
            questionnaire_data: Optional[Dict[str, Any]] = None,
            profile_prompt: Optional[str] = None,
            notes: Optional[str] = None,
        ) -> Dict[str, Any]:
            payload = {
                "profile": profile,
                "questionnaire_data": questionnaire_data or {},
                "profile_prompt": profile_prompt or "",
                "notes": notes or "",
            }
            return create_profile(payload)

else:
    MBTIProfileCreateTool = None
