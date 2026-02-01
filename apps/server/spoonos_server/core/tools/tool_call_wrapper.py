import inspect
import json
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
            context: Optional[Dict[str, Any]] = None,
        ) -> None:
            name = getattr(tool, "name", tool.__class__.__name__)
            description = getattr(tool, "description", "") or ""
            parameters = getattr(tool, "parameters", {}) or {}
            super().__init__(
                name=name,
                description=description,
                parameters=parameters,
            )
            self._tool = tool
            self._emit = emit
            self._context = context or {}

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
            if "session_id" in self._context and "session_id" not in kwargs:
                try:
                    signature = inspect.signature(self._tool.execute)
                    accepts_kwargs = any(
                        param.kind == inspect.Parameter.VAR_KEYWORD
                        for param in signature.parameters.values()
                    )
                    if accepts_kwargs or "session_id" in signature.parameters:
                        kwargs["session_id"] = self._context["session_id"]
                except (TypeError, ValueError):
                    kwargs["session_id"] = self._context["session_id"]
            tool_cache = self._context.get("tool_cache")
            cache_key = None
            if tool_cache is not None:
                key_payload = {
                    "tool": getattr(self._tool, "name", self._tool.__class__.__name__),
                    "kwargs": {
                        key: value for key, value in kwargs.items() if key != "session_id"
                    },
                }
                try:
                    cache_key = json.dumps(key_payload, ensure_ascii=False, sort_keys=True)
                except TypeError:
                    cache_key = str(key_payload)
                cached = tool_cache.get(cache_key)
                if cached is not None:
                    tool_call_id = str(uuid.uuid4())
                    input_payload = {"description": self.description, **kwargs}
                    await self._emit_tool_message(
                        tool_call_id,
                        "input-available",
                        input_payload,
                    )
                    await self._emit_tool_message(
                        tool_call_id,
                        "output-available",
                        input_payload,
                        output=cached,
                    )
                    return cached
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
                if tool_cache is not None and cache_key is not None:
                    tool_cache[cache_key] = result
                return result
            except Exception as exc:
                await self._emit_tool_message(
                    tool_call_id,
                    "output-error",
                    input_payload,
                    error_text=str(exc),
                )
                return {"error": str(exc)}
else:
    ToolCallWrapper = None


def wrap_tools_for_calls(
    tools: List[Any],
    context: Optional[Dict[str, Any]] = None,
) -> Tuple[List[Any], List[Any]]:
    if not ToolCallWrapper:
        return tools, []

    wrapped: List[Any] = []
    wrappers: List[Any] = []
    for tool in tools:
        if getattr(tool, "skip_toolcall_wrap", False):
            wrapped.append(tool)
            continue
        wrapper = ToolCallWrapper(tool, context=context)
        wrapped.append(wrapper)
        wrappers.append(wrapper)
    return wrapped, wrappers
