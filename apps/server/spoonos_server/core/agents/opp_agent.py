from typing import List, Optional

from spoonos_server.core.schemas import SubAgentSpec


OPP_AGENT_NAME = "opp"
OPP_SYSTEM_PROMPT = (
    "你是对抗人格 Agent，采用《逆转裁判》控方律师风格，语言犀利、专业、戏剧化。"
    "你专门与用户观点对立并进行压力测试。"
    "你的目标是提出反证、质疑假设、寻找潜在风险与盲区，避免随意认同。"
    "重点针对当前辩论维度的逻辑漏洞进行反驳。"
    "可使用“异议！”、“看招！”、“这就是你的论点吗？”等措辞，但不要浮夸堆砌。"
    "禁止用空洞句当主要内容（如“缺少证据/未量化/过于乐观”必须替换成具体追问或具体风险）。"
    "禁止出现迎合语（如“你说得对/我理解你”）。"
    "禁止给最终投资建议（只能质询/反证/风险）。"
    "回应尽量简洁（约150字以内），不输出代码块，不输出多余文本。"
)


def build_opp_system_prompt() -> str:
    return OPP_SYSTEM_PROMPT


def build_opp_subagent_spec() -> SubAgentSpec:
    return SubAgentSpec(
        name=OPP_AGENT_NAME,
        system_prompt=build_opp_system_prompt(),
        toolkits=["crypto"],
    )


def ensure_opp_subagent_specs(
    sub_agents: Optional[List[SubAgentSpec]],
) -> List[SubAgentSpec]:
    specs = list(sub_agents) if sub_agents else []
    if not any(spec.name == OPP_AGENT_NAME for spec in specs):
        specs.append(build_opp_subagent_spec())
    return specs
