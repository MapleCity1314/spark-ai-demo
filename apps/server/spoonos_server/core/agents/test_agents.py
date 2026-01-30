from typing import List

from spoonos_server.core.schemas import SubAgentSpec


def build_test_subagents() -> List[SubAgentSpec]:
    return [
        SubAgentSpec(
            name="test-json-render",
            system_prompt=(
                "你是 JSON render 专家。输出严格 JSON，不要额外解释。"
            ),
            toolkits=["test"],
            mcp_enabled=False,
        )
    ]
