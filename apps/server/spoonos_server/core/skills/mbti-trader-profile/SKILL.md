---
name: mbti-trader-profile
description: "基于 MBTI 量化交易者模型生成用户画像，并输出结构化画像 + profile_id。"
---

# MBTI 量化交易者画像技能

## 适用场景
- 第一轮交互式问卷结束后，已得到一组结构化问卷数据/评分
- 需要生成“量化交易者用户画像”，并存储为可复用的画像上下文

## 核心模型要点（简要）
- E/I：信息来源与噪音过滤（社群情绪 vs. 独立研究）
- S/N：交易依据（技术面/价格行为 vs. 宏观/基本面/趋势）
- T/F：执行逻辑（系统化/量化 vs. 叙事/直觉）
- J/P：风控与纪律（固定规则/止损 vs. 弹性/动态调整）

四大组：
- 分析家（NT）：系统化、高盈亏比、宏观/量化模型
- 守护者（SJ）：风险厌恶、本金保护、偏稳健套利
- 探险家（SP）：短线动能、反应快、风险承受高
- 外交家（NF）：叙事/信念驱动、愿景导向

## 画像生成要求
- 使用**简体中文**
- 描述清晰、细节充分，**在基础模型上延申**（量化视角）
- 必须包含量化交易者画像的核心结构：
  1) MBTI 类型与分组
  2) 交易风格（频率/时长/市场/资产）
  3) 风险偏好与风险控制
  4) 决策驱动因子（数据/逻辑 vs. 信念/直觉）
  5) 典型策略框架（如趋势/均值回归/套利/波动率）
  6) 量化指标与可观测信号
  7) 行为偏差与弱点
  8) 交易纪律与执行偏好
  9) 画像置信度与证据（来自问卷数据）

## 输出结构（建议 JSON 结构）
建议生成如下结构（字段可扩展，但需完整）：

```json
{
  "mbti_type": "INTJ",
  "group": "分析家（NT）",
  "title": "系统架构师",
  "summary": "...",
  "trade_style": {
    "frequency": "低频/中频/高频",
    "time_horizon": "日内/波段/中长线",
    "asset_focus": ["..."],
    "market_preference": "..."
  },
  "risk_profile": {
    "appetite": "低/中/高",
    "drawdown_tolerance": "...",
    "position_sizing": "...",
    "risk_controls": ["..."]
  },
  "decision_driver": "数据与逻辑驱动 / 信念与直觉驱动",
  "strategy_framework": ["趋势", "套利", "波动率", "均值回归"],
  "quant_signals": ["..."],
  "metrics_to_track": ["Sharpe", "Win Rate", "Max Drawdown"],
  "behavior_biases": ["过度优化", "过度交易"],
  "execution_preferences": ["规则化执行", "动态调整"],
  "strengths": ["..."],
  "risks": ["..."],
  "next_steps": ["..."],
  "confidence": {
    "score": 0.0,
    "evidence": ["..."]
  }
}
```

## 工具使用（必须）
当画像完成后，调用工具 **mbti_profile_create** 进行结构化存储：

- `profile`：上面的结构化画像对象
- `questionnaire_data`：问卷数据或评分
- `profile_prompt`：可直接用于 system prompt 的画像提示词（简洁、可复用）
- `notes`：生成备注（可选）

工具返回：`profile_id` + 画像数据。向用户展示画像摘要，并给出 `profile_id`。

## profile_prompt 写作规范
- 简明、系统化、适合直接作为系统提示词
- 包含：MBTI 类型、交易风格、风控偏好、决策驱动因子、执行约束
- 不要包含隐私与敏感信息
