<p align="center">
  <img src="logo.png" alt="DOPPLE logo" width="160" />
</p>

<h1 align="center">DOPPLE (逆转人格)</h1>

<p align="center">
  <strong>让“静态用户画像”活过来：转化为可对话、可执行、实时响应的 Agent 能力</strong>
</p>

<p align="center">
  <a href="#-技术栈">
    <img src="https://img.shields.io/badge/Next.js-15/16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  </a>
  <a href="#-技术栈">
    <img src="https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  </a>
  <a href="#-技术栈">
    <img src="https://img.shields.io/badge/SpoonOS-Agent_Core-orange?style=for-the-badge" alt="SpoonOS" />
  </a>
</p>

---

## 💡演示demo

<a href="https://aistudio.google.com/app/prompts?state=%7B%22ids%22:%5B%221uqEZMUFPZ8AY-lTNoM5Ll6DZ5FEIQoOw%22%5D,%22action%22:%22open%22,%22userId%22:%22107083301847056452220%22,%22resourceKeys%22:%7B%7D%7D&usp=sharing" target="_blank">
<img src="https://img.shields.io/badge/Google_AI_Studio-Open-009688?style=for-the-badge&logo=google" alt="Google AI Studio" />演示站点
</a>

## 💡 为什么需要 DOPPLE？

在传统的业务流程中，**用户画像（Persona）** 往往是躺在 PPT 或数据库里的静态标签（如“高消费、MBTI-INTJ”）。这些画像与实际的用户交互、产品功能之间存在巨大的**断层**。

**DOPPLE 填补了这个断层：**
它将 MBTI 量化指标作为“人格引擎”，结合动态技能插件（Skills），将画像直接转化为具备特定性格色彩、能调用业务工具、能流式对话的 **实时 Agent**。

> **从“看画像”进化为“跟画像对话”，并让画像自动执行任务。**

---

## ✨ 核心特性

### 🧠 1. 人格驱动引擎 (MBTI-Based)
不仅仅是预设 Prompt，而是将 MBTI 量化为结构化 Profile。系统根据画像特征自动调整对话语气、策略优先级和反馈风格。

### ⚡ 2. 自研 UI Message Chunk Transport
针对 AI 流式输出优化的传输协议。支持将 SSE（Server-Sent Events）数据流无缝转换为 UI 层的“块状渲染”，提供极致流畅的打字机交互体验。

### 🧩 3. 插件化技能系统 (Agent Skills)
基于 **SpoonOS** 架构，每一个 `Skill` 都是独立的模块。
- **易扩展**：只需在 `skills` 目录下添加 `SKILL.md`，即可注入新能力。
- **解耦**：业务逻辑（工具调用）与对话逻辑（人格）完全分离。

### 🚀 4. 业务落地友好
输出标准化的结构化数据，直接对接现有运营系统的分层、触达、内容推送等环节。

---

## 🏗️ 系统架构

DOPPLE 采用典型的 **Monorepo** 架构，确保前后端协作的高效性：

```text
DOPPLE
├── apps/web           # Next.js 16 + React 19 (感知层：极致的流式 UI)
├── apps/server        # FastAPI (大脑：SpoonOS 驱动的 Agent 逻辑)
└── packages/shared    # 共享配置与类型定义