import json
import uuid
from typing import Any, Awaitable, Callable, Dict, List, Optional

from spoon_ai.chat import ChatBot

from spoonos_server.config import AppConfig
from spoonos_server.schemas import SubAgentSpec
from spoonos_server.tools.toolkits import load_toolkits, resolve_toolkits
from spoonos_server.mcp.loader import load_mcp_tools

try:
    from spoon_ai.agents.spoon_react import SpoonReactAI
except Exception:  # pragma: no cover - optional dependency
    SpoonReactAI = None

try:
    from spoon_ai.tools.base import BaseTool
except Exception:  # pragma: no cover - optional dependency
    BaseTool = None


if BaseTool:
    class SubAgentTool(BaseTool):
        name: str = "subAgentCall"
        description: str = "Call a named sub-agent with a message and description."
        skip_toolcall_wrap: bool = True
        parameters: dict = {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "Sub-agent name"},
                "message": {"type": "string", "description": "Message to send"},
                "description": {
                    "type": "string",
                    "description": "Describe what this sub-agent call is doing",
                },
            },
            "required": ["name", "message", "description"],
        }

        def __init__(
            self,
            agents: Dict[str, Any],
            emit: Optional[Callable[[Dict[str, Any]], Awaitable[None]]] = None,
        ) -> None:
            super().__init__()
            self._agents = agents
            self._emit = emit

        def set_emit(
            self, emit: Optional[Callable[[Dict[str, Any]], Awaitable[None]]]
        ) -> None:
            self._emit = emit

        def _looks_like_ai_message(self, payload: Any) -> bool:
            return (
                isinstance(payload, dict)
                and isinstance(payload.get("id"), str)
                and isinstance(payload.get("role"), str)
                and isinstance(payload.get("parts"), list)
            )

        def _coerce_ai_message(self, result: Any) -> Dict[str, Any]:
            if self._looks_like_ai_message(result):
                return result
            if isinstance(result, str):
                try:
                    parsed = json.loads(result)
                except json.JSONDecodeError:
                    parsed = None
                if self._looks_like_ai_message(parsed):
                    return parsed  # type: ignore[return-value]
                return {
                    "id": str(uuid.uuid4()),
                    "role": "assistant",
                    "parts": [
                        {"type": "text", "text": result, "state": "done"},
                    ],
                }
            return {
                "id": str(uuid.uuid4()),
                "role": "assistant",
                "parts": [
                    {"type": "text", "text": str(result), "state": "done"},
                ],
            }

        def _extract_text(self, ai_message: Dict[str, Any]) -> str:
            parts = ai_message.get("parts", [])
            texts = []
            for part in parts:
                if isinstance(part, dict) and part.get("type") == "text":
                    texts.append(part.get("text", ""))
            return "".join(texts).strip()

        async def _emit_tool_message(
            self,
            tool_call_id: str,
            name: str,
            message: str,
            description: str,
            *,
            state: str = "output-available",
            output: Optional[Dict[str, Any]] = None,
            error_text: Optional[str] = None,
        ) -> None:
            if not self._emit:
                return
            if error_text:
                state = "output-error"
            tool_part: Dict[str, Any] = {
                "type": "tool-subAgentCall",
                "toolCallId": tool_call_id,
                "state": state,
                "input": {
                    "name": name,
                    "message": message,
                    "description": description,
                },
            }
            if error_text:
                tool_part["errorText"] = error_text
            else:
                tool_part["output"] = output
            ai_message = {
                "id": str(uuid.uuid4()),
                "role": "assistant",
                "parts": [tool_part],
            }
            await self._emit(ai_message)

        async def execute(
            self, name: str, message: str, description: str = ""
        ) -> str:
            if not description:
                description = f"Call sub-agent {name}"
            tool_call_id = str(uuid.uuid4())
            agent = self._agents.get(name)
            if not agent:
                error_text = f"Unknown sub-agent: {name}"
                await self._emit_tool_message(
                    tool_call_id,
                    name,
                    message,
                    description,
                    state="output-error",
                    error_text=error_text,
                )
                return error_text

            await self._emit_tool_message(
                tool_call_id,
                name,
                message,
                description,
                state="input-available",
            )
            result = await agent.run(request=message)
            ai_message = self._coerce_ai_message(result)
            await self._emit_tool_message(
                tool_call_id,
                name,
                message,
                description,
                state="output-available",
                output=ai_message,
            )
            text = self._extract_text(ai_message)
            if text:
                return text
            return json.dumps(ai_message, ensure_ascii=False)
else:
    SubAgentTool = None


def _create_subagent(
    spec: SubAgentSpec, config: AppConfig, system_prompt: str
) -> Optional[Any]:
    if SpoonReactAI is None:
        return None

    provider = spec.provider or config.llm.provider
    model = spec.model or config.llm.model
    toolkits = resolve_toolkits(spec.toolkits, config.toolkits.default_toolkits)
    tools = load_toolkits(toolkits)

    mcp_enabled = spec.mcp_enabled
    if mcp_enabled is None:
        mcp_enabled = config.mcp.enabled
    if mcp_enabled:
        tools.extend(load_mcp_tools(config.mcp))

    agent = SpoonReactAI(
        name=spec.name,
        llm=ChatBot(llm_provider=provider, model_name=model),
        tools=tools,
        max_steps=6,
    )
    if system_prompt:
        agent.system_prompt = system_prompt
    return agent


def create_subagents(
    specs: Optional[List[SubAgentSpec]], config: AppConfig
) -> Dict[str, Any]:
    if not specs:
        return {}

    agents: Dict[str, Any] = {}
    for spec in specs:
        prompt = spec.system_prompt or ""
        agent = _create_subagent(spec, config, prompt)
        if agent is not None:
            agents[spec.name] = agent

    return agents
