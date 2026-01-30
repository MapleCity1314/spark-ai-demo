import json
import logging
import os
import time
import uuid
from typing import Any, AsyncIterator, Dict, List, Optional, Tuple

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict, Field

from spoonos_server.core.agents.react_agent import create_react_agent, stream_agent_events
from spoonos_server.core.config import load_config


router = APIRouter()
config = load_config()
logger = logging.getLogger("spoonos.openai")
debug_enabled = os.getenv("SPOONOS_OPENAI_DEBUG", "").lower() in {"1", "true", "yes"}


class OpenAIChatMessage(BaseModel):
    role: str = Field(..., pattern="^(system|user|assistant|tool)$")
    content: str


class OpenAIChatCompletionRequest(BaseModel):
    model: Optional[str] = None
    messages: List[OpenAIChatMessage]
    stream: Optional[bool] = False
    temperature: Optional[float] = None
    model_config = ConfigDict(extra="allow")


def _extract_parts(event: Any) -> Tuple[Optional[str], List[Dict[str, Any]]]:
    text: Optional[str] = None
    tool_parts: List[Dict[str, Any]] = []
    if isinstance(event, dict):
        parts = event.get("parts")
        if isinstance(parts, list):
            texts: List[str] = []
            for part in parts:
                if not isinstance(part, dict):
                    continue
                part_type = part.get("type")
                if part_type == "text":
                    part_text = part.get("text")
                    if isinstance(part_text, str):
                        texts.append(part_text)
                elif isinstance(part_type, str) and part_type.startswith("tool-"):
                    tool_parts.append(part)
            if texts:
                text = "".join(texts)
        if text is None:
            for key in ("delta", "content", "text"):
                value = event.get(key)
                if isinstance(value, str):
                    text = value
                    break
    return text, tool_parts


def _select_user_message(messages: List[OpenAIChatMessage]) -> str:
    for message in reversed(messages):
        if message.role == "user" and message.content:
            return message.content
    raise HTTPException(status_code=400, detail="No user message found.")


def _build_system_prompt(messages: List[OpenAIChatMessage]) -> Optional[str]:
    prompts = [message.content for message in messages if message.role == "system"]
    return "\n".join(prompts) if prompts else None


@router.post("/v1/chat/completions")
async def chat_completions(request: OpenAIChatCompletionRequest):
    if not request.messages:
        raise HTTPException(status_code=400, detail="messages required.")

    user_message = _select_user_message(request.messages)
    system_prompt = _build_system_prompt(request.messages)
    if debug_enabled:
        logger.info(
            "openai.completions request: model=%s stream=%s messages=%s",
            request.model,
            request.stream,
            len(request.messages),
        )

    provider = getattr(request, "provider", None)
    toolkits = getattr(request, "toolkits", None)
    mcp_enabled = getattr(request, "mcp_enabled", None)
    sub_agents = getattr(request, "sub_agents", None)
    timeout = getattr(request, "timeout", 120.0)

    model_name = request.model
    if not model_name or model_name == "spoonos":
        model_name = config.llm.model
    if debug_enabled:
        logger.info(
            "openai.completions resolved model=%s provider=%s", model_name, provider
        )

    agent = create_react_agent(
        config=config,
        system_prompt=system_prompt,
        profile_prompt=getattr(request, "profile_prompt", None),
        session_id=getattr(request, "session_id", None),
        provider=provider,
        model=model_name,
        toolkits=toolkits,
        mcp_enabled=mcp_enabled,
        sub_agents=sub_agents,
    )

    created = int(time.time())
    completion_id = f"chatcmpl-{uuid.uuid4()}"
    model = model_name or config.llm.model

    async def stream_response() -> AsyncIterator[str]:
        last_text = ""
        sent_role = False
        emitted_any = False
        seen_tool_calls: Dict[str, str] = {}
        tool_outputs: List[Dict[str, Any]] = []
        async for event in stream_agent_events(agent, user_message, timeout):
            if debug_enabled:
                logger.info("openai.completions raw_event=%s", event)
            text, tool_parts = _extract_parts(event)
            if text is None and not tool_parts:
                if debug_enabled:
                    logger.info(
                        "openai.completions skip event (no text/tools) keys=%s",
                        list(event.keys()) if isinstance(event, dict) else type(event),
                    )
                continue

            if text is not None:
                delta_text = (
                    text[len(last_text) :] if text.startswith(last_text) else text
                )
                last_text = text
                if delta_text or not sent_role:
                    emitted_any = True
                    delta: dict[str, Any] = {}
                    if not sent_role:
                        delta["role"] = "assistant"
                        sent_role = True
                    if delta_text:
                        delta["content"] = delta_text
                    chunk = {
                        "id": completion_id,
                        "object": "chat.completion.chunk",
                        "created": created,
                        "model": model,
                        "choices": [
                            {
                                "index": 0,
                                "delta": delta,
                                "finish_reason": None,
                            }
                        ],
                    }
                    yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"

            for part in tool_parts:
                tool_type = part.get("type", "")
                tool_name = tool_type.replace("tool-", "", 1) if tool_type else "tool"
                tool_call_id = part.get("toolCallId") or str(uuid.uuid4())
                state = part.get("state")
                input_payload = part.get("input", {}) or {}

                if state in {"input-available", "input-streaming", "approval-requested"}:
                    if tool_call_id not in seen_tool_calls:
                        seen_tool_calls[tool_call_id] = tool_name
                        args = (
                            input_payload
                            if isinstance(input_payload, dict)
                            else {"input": input_payload}
                        )
                        delta = {
                            "tool_calls": [
                                {
                                    "index": 0,
                                    "id": tool_call_id,
                                    "type": "function",
                                    "function": {
                                        "name": tool_name,
                                        "arguments": json.dumps(
                                            args, ensure_ascii=False
                                        ),
                                    },
                                }
                            ],
                        }
                        if not sent_role:
                            delta["role"] = "assistant"
                            sent_role = True
                        chunk = {
                            "id": completion_id,
                            "object": "chat.completion.chunk",
                            "created": created,
                            "model": model,
                            "choices": [
                                {
                                    "index": 0,
                                    "delta": delta,
                                    "finish_reason": None,
                                }
                            ],
                        }
                        yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"

                if state in {"output-available", "output-error"}:
                    output = part.get("output")
                    if output is None:
                        output = part.get("errorText")
                    tool_outputs.append(
                        {
                            "tool_call_id": tool_call_id,
                            "name": tool_name,
                            "state": state,
                            "output": output,
                        }
                    )
                    content = (
                        output
                        if isinstance(output, str)
                        else json.dumps(output, ensure_ascii=False)
                    )
                    delta = {"content": content}
                    if not sent_role:
                        delta["role"] = "assistant"
                        sent_role = True
                    chunk = {
                        "id": completion_id,
                        "object": "chat.completion.chunk",
                        "created": created,
                        "model": model,
                        "choices": [
                            {
                                "index": 0,
                                "delta": delta,
                                "finish_reason": None,
                            }
                        ],
                    }
                    yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
        if debug_enabled:
            logger.info(
                "openai.completions stream done: emitted_any=%s chars=%s",
                emitted_any,
                len(last_text),
            )
        logger.info("openai.completions final_text=%s", last_text)
        if tool_outputs:
            logger.info("openai.completions tool_outputs=%s", tool_outputs)

        done = {
            "id": completion_id,
            "object": "chat.completion.chunk",
            "created": created,
            "model": model,
            "choices": [
                {
                    "index": 0,
                    "delta": {},
                    "finish_reason": "stop",
                }
            ],
        }
        yield f"data: {json.dumps(done, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"

    if request.stream:
        return StreamingResponse(stream_response(), media_type="text/event-stream")

    final_text = ""
    async for event in stream_agent_events(agent, user_message, timeout):
        text = _extract_text(event)
        if text is not None:
            final_text = text

    response = {
        "id": completion_id,
        "object": "chat.completion",
        "created": created,
        "model": model,
        "choices": [
            {
                "index": 0,
                "message": {"role": "assistant", "content": final_text},
                "finish_reason": "stop",
            }
        ],
    }
    return response
