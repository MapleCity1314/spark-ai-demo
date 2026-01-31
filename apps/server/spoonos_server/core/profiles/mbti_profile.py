from typing import Any, Dict, List, Tuple


def _group_for_type(mbti: str) -> str:
    pairs = mbti[1:]
    if pairs == "NT":
        return "分析家（NT）"
    if pairs == "NF":
        return "外交家（NF）"
    if pairs == "SJ":
        return "守护者（SJ）"
    if pairs == "SP":
        return "探险家（SP）"
    return "未分组"


def _title_for_type(mbti: str) -> str:
    return f"{mbti} 量化交易者画像"


def _answer_map(answers: List[Dict[str, Any]]) -> Dict[str, str]:
    mapping: Dict[str, str] = {}
    for answer in answers:
        qid = str(answer.get("id") or "")
        choice = answer.get("choice") or {}
        choice_id = str(choice.get("id") or "")
        if qid and choice_id:
            mapping[qid] = choice_id.upper()
    return mapping


def _mbti_from_answers(answer_map: Dict[str, str]) -> Tuple[str, Dict[str, str]]:
    dim_map = {
        "q1": ("E", "I"),
        "q2": ("S", "N"),
        "q3": ("T", "F"),
        "q4": ("J", "P"),
    }
    resolved: Dict[str, str] = {}
    letters = []
    for qid, pair in dim_map.items():
        choice = answer_map.get(qid, "A")
        letter = pair[0] if choice == "A" else pair[1]
        resolved[qid] = letter
        letters.append(letter)
    return "".join(letters), resolved


def build_mbti_profile(answers: List[Dict[str, Any]]) -> Dict[str, Any]:
    answer_map = _answer_map(answers)
    mbti_type, resolved = _mbti_from_answers(answer_map)
    group = _group_for_type(mbti_type)
    title = _title_for_type(mbti_type)

    decision_driver = "数据与逻辑驱动" if "T" in mbti_type else "信念与直觉驱动"
    risk_appetite = "中" if "J" in mbti_type else "中高"
    time_horizon = "波段/中期" if "J" in mbti_type else "日内/波段"
    frequency = "中频" if "J" in mbti_type else "高频"

    profile = {
        "mbti_type": mbti_type,
        "group": group,
        "title": title,
        "summary": (
            "基于问卷结果构建的量化交易者画像，体现信息来源、信号偏好、"
            "决策驱动与执行纪律的综合特征。"
        ),
        "trade_style": {
            "frequency": frequency,
            "time_horizon": time_horizon,
            "asset_focus": ["数字资产", "指数", "高流动性标的"],
            "market_preference": "趋势/波动驱动市场",
        },
        "risk_profile": {
            "appetite": risk_appetite,
            "drawdown_tolerance": "中等",
            "position_sizing": "分层仓位 + 动态止损",
            "risk_controls": ["最大回撤阈值", "单笔风险上限", "波动率过滤"],
        },
        "decision_driver": decision_driver,
        "strategy_framework": ["趋势", "均值回归", "波动率", "动量/反转"],
        "quant_signals": ["趋势斜率", "成交量动能", "波动率突破"],
        "metrics_to_track": ["Sharpe", "Max Drawdown", "Win Rate", "Profit Factor"],
        "behavior_biases": ["过度优化", "追涨杀跌"],
        "execution_preferences": ["规则化执行", "动态调整"],
        "strengths": ["结构化决策", "风险纪律明确"],
        "risks": ["对噪音敏感", "在极端行情中易过拟合"],
        "next_steps": ["完善回测体系", "建立对立观点检查清单"],
        "confidence": {
            "score": 0.62,
            "evidence": [
                f"Q1→{resolved.get('q1','')}",
                f"Q2→{resolved.get('q2','')}",
                f"Q3→{resolved.get('q3','')}",
                f"Q4→{resolved.get('q4','')}",
            ],
        },
    }

    profile_prompt = (
        f"用户画像：{mbti_type}，{group}。"
        f"交易风格：{frequency}/{time_horizon}，偏趋势与波动策略。"
        f"风险偏好：{risk_appetite}，强调纪律与回撤控制。"
        f"决策驱动：{decision_driver}，执行偏好规则化。"
    )

    return {"profile": profile, "profile_prompt": profile_prompt}
