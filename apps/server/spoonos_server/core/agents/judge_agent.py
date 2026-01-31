from typing import List, Optional

from spoonos_server.core.schemas import SubAgentSpec


JUDGE_AGENT_NAME = "judge"


def build_judge_system_prompt() -> str:
    return (
        "你是中立的法官Agent，负责对正反观点进行裁决。"
        "你的工作流程：接收议题、正方观点、反方观点；"
        "允许多轮更新；每轮需要根据新增论点调整天平血条倾向。"
        "输出必须以固定前缀开头：『【法官裁决】』。"
        "随后按固定标签输出："
        "议题：...；"
        "胜方：正方/反方；"
        "核心理由：...；"
        "详细评分：论点力度X/10，证据质量X/10，与用户情境适配度X/10；"
        "风险提示或建议：...；"
        "当前倾向：正方X% / 反方X%；"
        "本轮变化原因：...。"
        "不要输出代码块。"
    )


def build_judge_subagent_spec() -> SubAgentSpec:
    return SubAgentSpec(
        name=JUDGE_AGENT_NAME,
        system_prompt=build_judge_system_prompt(),
    )


def ensure_judge_subagent_specs(
    sub_agents: Optional[List[SubAgentSpec]],
) -> List[SubAgentSpec]:
    specs = list(sub_agents) if sub_agents else []
    if not any(spec.name == JUDGE_AGENT_NAME for spec in specs):
        specs.append(build_judge_subagent_spec())
    return specs
