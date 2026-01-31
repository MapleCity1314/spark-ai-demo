# agentService 使用说明

本目录提供与服务端 Agent 通信的前端封装，包含流式与非流式两种调用方式，返回结构与 `useChat` 兼容。

## 位置
- 文件：`apps/web/app/(app)/services/agentService.ts`

## 方法一：流式（SSE）

`streamAgent(options)` 用于流式对话，返回 `ReadableStream<UIMessageChunk>`，可直接交给 `useChat` 或自定义 UIMessage 流处理。

```ts
import { streamAgent } from "./agentService";

const stream = await streamAgent({
  messages,
  systemPrompt: "你的请求提示词",
  profilePrompt: "用户画像",
  toolkits: ["profile", "crypto", "web"],
});
```

### useChat 接入示例

```ts
import { useChat } from "@ai-sdk/react";
import { SpoonSseChatTransport } from "@/lib/spoon-sse-chat-transport";

const { messages, sendMessage, status } = useChat({
  transport: new SpoonSseChatTransport({
    baseUrl: process.env.NEXT_PUBLIC_SPOONOS_API_BASE_URL ?? "http://localhost:8000",
    getBody: () => ({
      system_prompt: "你的请求提示词",
      profile_prompt: "用户画像",
      toolkits: ["profile", "crypto", "web"],
      session_id: "your-session-id",
    }),
  }),
});
```

## 方法二：非流式

`runAgent(options)` 用于一次性请求，返回 `UIMessage[]`，只包含 `state === "done"` 的消息。

```ts
import { runAgent } from "./agentService";

const messages = await runAgent({
  message: "生成一份报告",
  systemPrompt: "你的请求提示词",
  profilePrompt: "用户画像",
  toolkits: ["profile", "crypto", "web"],
});
```

## 入参说明（AgentRequestOptions）

- `messages` / `message`：聊天消息（UIMessage[]）或单条文本。
- `sessionId`：会话 ID，用于服务端会话/记忆。
- `provider` / `model`：指定 LLM 提供方或模型（可选）。
- `systemPrompt`：请求提示词（会拼接在服务端基础 system prompt 后）。
- `profilePrompt`：用户画像提示词。
- `toolkits`：启用的工具包列表。
- `mcpEnabled`：是否启用 MCP（可选）。
- `subAgents`：子代理配置（可选）。
- `timeout`：请求超时（秒）。
- `extraBody`：透传自定义字段。
- `fetchImpl`：自定义 fetch（可选）。

## 备注

- 服务端流式接口：`POST /v1/agent/stream`
- 服务端非流接口：`POST /v1/agent`
