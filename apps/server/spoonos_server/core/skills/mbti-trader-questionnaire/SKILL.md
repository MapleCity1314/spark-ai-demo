---
name: mbti-trader-questionnaire
description: "生成 MBTI 量化交易者画像问卷，并输出结构化题目供前端渲染。"
---

# MBTI 量化交易者问卷技能

## 适用场景
- 用户尚未完成画像问卷，需要先采集问卷数据
- 需要将问卷以结构化数据输出给前端渲染

## 要求
- 使用简体中文
- 每次只呈现 **一个题目** 作为主问题
- 题目与选项必须来自工具返回的结构化数据

## 工具使用（必须）
当需要问卷题目时，调用工具 **mbti_trader_questionnaire** 获取结构化问卷数据（必须带 session_id）：

```json
{
  "session_id": "<session_id>",
  "version": "v1"
}
```

工具返回结构（示例）：
```json
{
  "status": "question",
  "session_id": "xxx",
  "question": {
    "question_id": "q1",
    "title": "MBTI 量化交易者画像问卷（测试版）",
    "index": 1,
    "total": 4,
    "question": "你做交易决策时更偏向哪种信息来源？",
    "options": [
      {"id": "A", "text": "社群/市场情绪与公开讨论"},
      {"id": "B", "text": "独立研究与数据验证"}
    ]
  }
}
```

## 响应策略
- 题目展示交由前端渲染；在文本中**不要重复题干或选项**
- 只用一句话提示“请选择 A/B”即可
- 不要自行编造题目或选项
- 当用户仅回复选项文本或 A/B 时，必须将其视为答题并调用下一题工具
- 禁止把用户的选项文本当作“功能咨询”或“工具说明”来解释

## 继续问答（必须）
用户答题后，调用 **mbti_trader_questionnaire_next**：

```json
{
  "session_id": "<session_id>",
  "answer": {
    "question_id": "q1",
    "choice": {"id": "A", "text": "社群/市场情绪与公开讨论"}
  }
}
```

若返回 `status=completed`，必须调用 `mbti_profile_create` 生成画像。
