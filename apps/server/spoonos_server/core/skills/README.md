SPOONOS Skills Directory
========================

This folder stores reusable “skills” as self-contained folders with a
`SKILL.md` entry point.

How to extend Skills
--------------------
1) Create a new skill folder
   - Add a new subdirectory under this folder.
   - Include a `SKILL.md` file (this is required).
   - Optionally add `assets/`, `references/`, or `scripts/` as needed.

2) Keep skill content focused
   - The `SKILL.md` should explain how to use the skill and any required
     inputs/outputs.

How to register with the main agent
-----------------------------------
- Skills are discovered by `load_skill_index()` in
  `spoonos_server/core/skills/registry.py`, which scans for `SKILL.md`.
- To expose skills to the main agent:
  - Ensure your skill folder contains `SKILL.md`.
  - Wire the registry output into the prompt or tool listing wherever the
    agent is assembled (for example in `core/prompt.py` or upstream request
    handling).

Notes
-----
- Skill discovery is filesystem-based; no code changes are required if the
  skill layout follows the pattern above.

Agent Skills 原理（中文说明）
---------------------------
Agent skill 是一套可复用的“能力模块”，以文件夹形式存在，并以 `SKILL.md`
作为入口文档。系统通过 `registry.py` 中的索引逻辑扫描并加载技能描述，再将
技能内容注入到 Agent 的系统提示词或工具列表中。这样可以让 Agent 在不改动
核心代码的情况下获得新的领域能力、工具调用规范与交互流程。

本目录技能列表（中文介绍）
---------------------------
- investment_profiler：投资者画像分析技能。读取用户交易记录（CSV/Excel）与
  心理问卷结果，结合量化指标（如 Sharpe、胜率）与 MBTI 维度生成综合画像。
  主要工具：`generate_investment_quiz`、`analyze_user_profile`。
- mbti-trader-profile：MBTI 量化交易者画像生成技能。基于结构化问卷评分输出
  完整画像 JSON（含交易风格、风险偏好、策略框架等），并通过
  `mbti_profile_create` 存储画像与生成可复用的 `profile_prompt`。
- mbti-trader-questionnaire：MBTI 量化交易者问卷生成技能。每次只输出一个
  结构化题目给前端渲染，用户答题后继续下一题，完成后触发画像生成流程。
  主要工具：`mbti_trader_questionnaire`、`mbti_trader_questionnaire_next`。
- test_skill：测试技能。用于验证技能索引与 `SKILL.md` 读取是否正常。
