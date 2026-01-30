import {
  ChatTransport,
  UIMessage,
  UIMessageChunk,
  createUIMessageStream,
} from "ai";

type SpoonSseChatTransportOptions = {
  baseUrl: string;
  getBody?: () => Record<string, unknown>;
  fetchImpl?: typeof fetch;
};

const buildTextContent = (message: UIMessage) =>
  message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part as { text?: string }).text ?? "")
    .join("");

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
        while (buffer.includes("\n\n")) {
          const idx = buffer.indexOf("\n\n");
          const chunk = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);

          const lines = chunk.split("\n");
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

export class SpoonSseChatTransport<UI_MESSAGE extends UIMessage>
  implements ChatTransport<UI_MESSAGE>
{
  private readonly baseUrl: string;
  private readonly getBody?: () => Record<string, unknown>;
  private readonly fetchImpl: typeof fetch;

  constructor({ baseUrl, getBody, fetchImpl }: SpoonSseChatTransportOptions) {
    this.baseUrl = baseUrl;
    this.getBody = getBody;
    this.fetchImpl = fetchImpl ?? fetch;
  }

  async sendMessages({
    messages,
    abortSignal,
    headers,
    body,
  }: Parameters<ChatTransport<UI_MESSAGE>["sendMessages"]>[0]): Promise<
    ReadableStream<UIMessageChunk>
  > {
    const chatMessages = messages
      .map((message) => ({
        role: message.role,
        content: buildTextContent(message),
      }))
      .filter((message) => message.content.trim().length > 0);

    const requestBody = {
      messages: chatMessages,
      stream_mode: "sse",
      ...(this.getBody?.() ?? {}),
      ...(body ?? {}),
    };

    const response = await this.fetchImpl(`${this.baseUrl}/v1/agent/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(headers instanceof Headers ? Object.fromEntries(headers) : headers),
      },
      body: JSON.stringify(requestBody),
      signal: abortSignal,
    });

    if (!response.ok || !response.body) {
      const errorText = await response.text();
      throw new Error(errorText || "Upstream error");
    }

    return parseSseToUiMessageStream(response.body);
  }

  async reconnectToStream(): Promise<ReadableStream<UIMessageChunk> | null> {
    return null;
  }
}
