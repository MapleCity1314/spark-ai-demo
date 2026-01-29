import asyncio
from typing import Any, Dict, Optional

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
    class EchoTool(BaseTool):
        name: str = "test_echo"
        description: str = "测试工具：回显输入文本。"
        parameters: dict = _tool_schema(
            {"text": {"type": "string", "description": "要回显的文本"}},
            required=["text"],
        )

        async def execute(self, text: str) -> str:
            return text


    class JsonRenderTool(BaseTool):
        name: str = "test_json_render"
        description: str = "测试工具：将输入拼成简单 JSON。"
        parameters: dict = _tool_schema(
            {
                "title": {"type": "string", "description": "标题"},
                "content": {"type": "string", "description": "正文"},
                "meta": {"type": "object", "description": "可选元信息"},
            },
            required=["title", "content"],
        )

        async def execute(
            self, title: str, content: str, meta: Optional[dict] = None
        ) -> Dict[str, Any]:
            return {"title": title, "content": content, "meta": meta or {}}


    class DelayTool(BaseTool):
        name: str = "test_delay"
        description: str = "测试工具：延迟指定秒数后返回。"
        parameters: dict = _tool_schema(
            {"seconds": {"type": "number", "description": "延迟秒数"}},
            required=["seconds"],
        )

        async def execute(self, seconds: float) -> str:
            await asyncio.sleep(max(0.0, float(seconds)))
            return f"delayed:{seconds}"


    class ErrorTool(BaseTool):
        name: str = "test_error"
        description: str = "测试工具：触发错误分支。"
        parameters: dict = _tool_schema(
            {
                "message": {
                    "type": "string",
                    "description": "错误信息",
                }
            },
            required=["message"],
        )

        async def execute(self, message: str) -> str:
            raise RuntimeError(message)

else:
    EchoTool = None
    JsonRenderTool = None
    DelayTool = None
    ErrorTool = None
