import inspect
import uuid
from typing import Any, Awaitable, Callable, Dict, List, Optional, Tuple

try:
    from spoon_ai.tools.base import BaseTool
except Exception:  # pragma: no cover - optional dependency
    BaseTool = None


if BaseTool:
    class ToolCallWrapper(BaseTool):
        def __init__(
            self,
            tool: Any,
            emit: Optional[Callable[[Dict[str, Any]], Awaitable[None]]] = None,
        ) -> None:
            super().__init__()
            self._tool = tool
            self._emit = emit
            self.name = getattr(tool, "name", tool.__class__.__name__)
            self.description = getattr(tool, "description", "") or ""
            self.parameters = getattr(tool, "parameters", {}) or {}

        def set_emit(
            self, emit: Optional[Callable[[Dict[str, Any]], Awaitable[None]]]
        ) -> None:
            self._emit = emit

        async def _emit_tool_message(
            self,
            tool_call_id: str,
            state: str,
            input_payload: Dict[str, Any],
            *,
            output: Any = None,
            error_text: Optional[str] = None,
        ) -> None:
            if not self._emit:
                return
            tool_part: Dict[str, Any] = {
                "type": f"tool-{self.name}",
                "toolCallId": tool_call_id,
                "state": state,
                "input": input_payload,
            }
            if error_text:
                tool_part["errorText"] = error_text
            elif state == "output-available":
                tool_part["output"] = output
            ai_message = {
                "id": str(uuid.uuid4()),
                "role": "assistant",
                "parts": [tool_part],
            }
            await self._emit(ai_message)

        async def execute(self, **kwargs: Any) -> Any:
            tool_call_id = str(uuid.uuid4())
            input_payload = {"description": self.description, **kwargs}
            await self._emit_tool_message(
                tool_call_id, "input-available", input_payload
            )
            try:
                result = self._tool.execute(**kwargs)
                if inspect.isawaitable(result):
                    result = await result
                await self._emit_tool_message(
                    tool_call_id,
                    "output-available",
                    input_payload,
                    output=result,
                )
                return result
            except Exception as exc:
                await self._emit_tool_message(
                    tool_call_id,
                    "output-error",
                    input_payload,
                    error_text=str(exc),
                )
                raise
else:
    ToolCallWrapper = None


def wrap_tools_for_calls(
    tools: List[Any],
) -> Tuple[List[Any], List[Any]]:
    if not ToolCallWrapper:
        return tools, []

    wrapped: List[Any] = []
    wrappers: List[Any] = []
    for tool in tools:
        if getattr(tool, "skip_toolcall_wrap", False):
            wrapped.append(tool)
            continue
        wrapper = ToolCallWrapper(tool)
        wrapped.append(wrapper)
        wrappers.append(wrapper)
    return wrapped, wrappers
