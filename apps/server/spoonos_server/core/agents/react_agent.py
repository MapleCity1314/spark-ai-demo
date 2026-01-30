import asyncio
import uuid
from typing import Any, AsyncIterator, Dict, List, Optional

from spoon_ai.agents.spoon_react import SpoonReactAI
from spoon_ai.chat import ChatBot
from spoon_ai.tools import ToolManager

from spoonos_server.core.config import AppConfig
from spoonos_server.core.mcp.loader import load_mcp_tools
from spoonos_server.core.schemas import SubAgentSpec
from spoonos_server.core.tools.toolkits import load_toolkits, resolve_toolkits
from spoonos_server.core.tools.tool_call_wrapper import wrap_tools_for_calls
from spoonos_server.core.agents.sub_agents import SubAgentTool, create_subagents


DEFAULT_SYSTEM_PROMPT = (
    "You are a SpoonOS ReAct agent. Be concise, structured, and tool-aware. "
    "Use tools when they can improve accuracy. If a tool is needed, call it."
)


def _build_tool_list(tool_manager: ToolManager) -> str:
    tool_map = getattr(tool_manager, "tool_map", None)
    if not tool_map:
        return "- (no tools loaded)"
    lines = []
    for tool in tool_map.values():
        desc = getattr(tool, "description", "") or ""
        lines.append(f"- {tool.name}: {desc}")
    return "\n".join(lines)


def create_react_agent(
    config: AppConfig,
    system_prompt: Optional[str],
    provider: Optional[str],
    model: Optional[str],
    toolkits: Optional[List[str]],
    mcp_enabled: Optional[bool],
    sub_agents: Optional[List[SubAgentSpec]],
) -> SpoonReactAI:
    selected_toolkits = resolve_toolkits(toolkits, config.toolkits.default_toolkits)
    tools = load_toolkits(selected_toolkits)

    if mcp_enabled is None:
        mcp_enabled = config.mcp.enabled
    if mcp_enabled:
        tools.extend(load_mcp_tools(config.mcp))

    subagent_map = create_subagents(sub_agents, config)
    subagent_tool = None
    if subagent_map and SubAgentTool:
        subagent_tool = SubAgentTool(subagent_map)
        tools.append(subagent_tool)

    tools, tool_wrappers = wrap_tools_for_calls(tools)

    tool_manager = ToolManager(tools)
    tool_list = _build_tool_list(tool_manager)

    prompt = system_prompt or DEFAULT_SYSTEM_PROMPT
    prompt = f"{prompt}\n\nAvailable tools:\n{tool_list}"

    agent = SpoonReactAI(
        name="spoon_react_server",
        llm=ChatBot(
            llm_provider=provider or config.llm.provider,
            model_name=model or config.llm.model,
        ),
        tools=tool_manager,
        max_steps=8,
    )
    agent.system_prompt = prompt
    async def emit(ai_message: Dict[str, Any]) -> None:
        await agent.output_queue.put(ai_message)

    for wrapper in tool_wrappers:
        wrapper.set_emit(emit)

    if subagent_tool:
        subagent_tool.set_emit(emit)
    return agent


def _looks_like_ai_message(payload: Any) -> bool:
    return (
        isinstance(payload, dict)
        and isinstance(payload.get("id"), str)
        and isinstance(payload.get("role"), str)
        and isinstance(payload.get("parts"), list)
    )


def _serialize_chunk(chunk: Any) -> Dict[str, Any]:
    if isinstance(chunk, dict):
        return chunk
    if isinstance(chunk, str):
        return {"delta": chunk}
    delta = getattr(chunk, "delta", None)
    if delta is not None:
        return {"delta": delta}
    content = getattr(chunk, "content", None)
    if content is not None:
        return {"delta": content}
    return {"delta": str(chunk)}


def _build_text_message(message_id: str, text: str, state: str) -> Dict[str, Any]:
    return {
        "id": message_id,
        "role": "assistant",
        "parts": [
            {"type": "text", "text": text, "state": state},
        ],
    }


async def stream_agent_events(
    agent: SpoonReactAI, user_message: str, timeout: float
) -> AsyncIterator[Dict[str, Any]]:
    agent.clear()
    agent.task_done.clear()

    original_timeout = getattr(agent, "_default_timeout", timeout)
    agent._default_timeout = timeout

    async def run_and_signal() -> str:
        try:
            return await agent.run(request=user_message)
        finally:
            agent.task_done.set()

    run_task = asyncio.create_task(run_and_signal())
    queue = agent.output_queue
    message_id = str(uuid.uuid4())
    buffer = ""

    try:
        while True:
            if agent.task_done.is_set() and queue.empty():
                break
            try:
                chunk = await asyncio.wait_for(queue.get(), timeout=0.5)
                if _looks_like_ai_message(chunk):
                    yield chunk
                    continue
                payload = _serialize_chunk(chunk)
                delta = (
                    payload.get("delta")
                    or payload.get("content")
                    or payload.get("text")
                )
                if delta is not None:
                    buffer += str(delta)
                    yield _build_text_message(message_id, buffer, "streaming")
            except asyncio.TimeoutError:
                if run_task.done():
                    break

        await run_task
        if buffer:
            yield _build_text_message(message_id, buffer, "done")
    finally:
        agent._default_timeout = original_timeout
