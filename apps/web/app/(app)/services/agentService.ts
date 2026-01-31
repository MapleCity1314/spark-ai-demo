import {
  UIMessage,
  UIMessageChunk,
  createUIMessageStream,
} from "ai";

type AgentRequestOptions = {
  messages?: UIMessage[];
  message?: string;
  sessionId?: string;
  provider?: string;
  model?: string;
  systemPrompt?: string;
  profilePrompt?: string;
  toolkits?: string[];
  mcpEnabled?: boolean;
  subAgents?: Array<Record<string, unknown>>;
  timeout?: number;
  extraBody?: Record<string, unknown>;
  fetchImpl?: typeof fetch;
};

const baseUrl =
  process.env.NEXT_PUBLIC_SPOONOS_API_BASE_URL ?? "http://localhost:8000";

const buildTextContent = (message: UIMessage) =>
  message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part as { text?: string }).text ?? "")
    .join("");

const buildRequestBody = (options: AgentRequestOptions) => {
  const chatMessages = options.messages
    ?.map((message) => ({
      role: message.role,
      content: buildTextContent(message),
    }))
    .filter((message) => message.content.trim().length > 0);

  return {
    ...(chatMessages?.length ? { messages: chatMessages } : {}),
    ...(options.message ? { message: options.message } : {}),
    ...(options.sessionId ? { session_id: options.sessionId } : {}),
    ...(options.provider ? { provider: options.provider } : {}),
    ...(options.model ? { model: options.model } : {}),
    ...(options.systemPrompt ? { system_prompt: options.systemPrompt } : {}),
    ...(options.profilePrompt ? { profile_prompt: options.profilePrompt } : {}),
    ...(options.toolkits ? { toolkits: options.toolkits } : {}),
    ...(options.mcpEnabled !== undefined
      ? { mcp_enabled: options.mcpEnabled }
      : {}),
    ...(options.subAgents ? { sub_agents: options.subAgents } : {}),
    ...(options.timeout ? { timeout: options.timeout } : {}),
    ...(options.extraBody ?? {}),
  };
};

const parseSseToUiMessageStream = (
  stream: ReadableStream<Uint8Array>,
): ReadableStream<UIMessageChunk> =>
  createUIMessageStream({
    execute: async ({ writer }) => {
      const decoder = new TextDecoder();
      const reader = stream.getReader();
      const textState = new Map<string, string>();
      const toolInputSeen = new Set<string>();
      let buffer = "";

      writer.write({ type: "start" });

      const emitText = (messageId: string, nextText: string, isDone: boolean) => {
        const prev = textState.get(messageId) ?? "";
        if (!prev) {
          writer.write({ type: "text-start", id: messageId });
        }
        const delta = nextText.startsWith(prev)
          ? nextText.slice(prev.length)
          : nextText;
        if (delta) {
          writer.write({ type: "text-delta", id: messageId, delta });
        }
        textState.set(messageId, nextText);
        if (isDone) {
          writer.write({ type: "text-end", id: messageId });
        }
      };

      const handleToolPart = (part: Record<string, unknown>) => {
        const toolType = String(part.type ?? "");
        const toolName = toolType.startsWith("tool-")
          ? toolType.slice(5)
          : toolType;
        const toolCallId = String(part.toolCallId ?? "");
        const state = String(part.state ?? "");
        const input = part.input ?? {};

        if (!toolCallId) {
          return;
        }

        if (
          (state === "input-available" || state === "input-streaming") &&
          !toolInputSeen.has(toolCallId)
        ) {
          toolInputSeen.add(toolCallId);
          writer.write({
            type: "tool-input-available",
            toolCallId,
            toolName,
            input,
          });
        }

        if (state === "approval-requested") {
          writer.write({
            type: "tool-approval-request",
            approvalId: toolCallId,
            toolCallId,
          });
        }

        if (state === "output-available") {
          writer.write({
            type: "tool-output-available",
            toolCallId,
            output: part.output,
          });
        }

        if (state === "output-error") {
          writer.write({
            type: "tool-output-error",
            toolCallId,
            errorText: String(part.errorText ?? "Tool error"),
          });
        }

        if (state === "output-denied") {
          writer.write({
            type: "tool-output-denied",
            toolCallId,
          });
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        while (true) {
          const idxNn = buffer.indexOf("\n\n");
          const idxRn = buffer.indexOf("\r\n\r\n");
          if (idxNn === -1 && idxRn === -1) {
            break;
          }
          const useRn = idxRn !== -1 && (idxNn === -1 || idxRn < idxNn);
          const delimiterLength = useRn ? 4 : 2;
          const idx = useRn ? idxRn : idxNn;
          const chunk = buffer.slice(0, idx);
          buffer = buffer.slice(idx + delimiterLength);

          const lines = chunk.split(/\r?\n/);
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) {
              continue;
            }
            const data = trimmed.replace(/^data:\s*/, "");
            if (!data || data === "[DONE]") {
              continue;
            }
            let event: Record<string, unknown> | null = null;
            try {
              event = JSON.parse(data);
            } catch {
              continue;
            }
            if (!event) {
              continue;
            }
            const parts = event.parts;
            if (Array.isArray(parts)) {
              for (const part of parts) {
                if (!part || typeof part !== "object") {
                  continue;
                }
                const partRecord = part as Record<string, unknown>;
                if (partRecord.type === "text") {
                  const text = String(partRecord.text ?? "");
                  const state = String(partRecord.state ?? "");
                  emitText(
                    String(event.id ?? "assistant"),
                    text,
                    state === "done",
                  );
                } else if (
                  typeof partRecord.type === "string" &&
                  partRecord.type.startsWith("tool-")
                ) {
                  handleToolPart(partRecord);
                }
              }
            }
          }
        }
      }

      writer.write({ type: "finish", finishReason: "stop" });
    },
  });

const isDoneUiMessage = (message: UIMessage) =>
  message.parts.some(
    (part) => part.type === "text" && (part as { state?: string }).state === "done",
  );

export const streamAgent = async (
  options: AgentRequestOptions,
): Promise<ReadableStream<UIMessageChunk>> => {
  const fetchImpl = options.fetchImpl ?? fetch;
  const requestBody = {
    ...buildRequestBody(options),
    stream_mode: "sse",
  };

  const response = await fetchImpl(`${baseUrl}/v1/agent/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok || !response.body) {
    const errorText = await response.text();
    throw new Error(errorText || "Upstream error");
  }

  return parseSseToUiMessageStream(response.body);
};

export const runAgent = async (
  options: AgentRequestOptions,
): Promise<UIMessage[]> => {
  const fetchImpl = options.fetchImpl ?? fetch;
  const requestBody = buildRequestBody(options);

  const response = await fetchImpl(`${baseUrl}/v1/agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Upstream error");
  }

  const data = (await response.json()) as { events?: UIMessage[] };
  const events = data.events ?? [];
  return events.filter(isDoneUiMessage);
};
