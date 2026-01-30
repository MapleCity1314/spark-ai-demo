import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const baseURL =
  process.env.SPOONOS_OPENAI_BASE_URL ??
  process.env.SPOONOS_API_BASE_URL ??
  "http://localhost:8000/v1";

const apiKey =
  process.env.SPOONOS_OPENAI_API_KEY ??
  process.env.OPENAI_API_KEY ??
  undefined;

const provider = createOpenAICompatible({
  name: "spoonos",
  baseURL,
  apiKey,
});

export async function POST(req: Request) {
  const body = await req.json();
  const {
    messages,
    model,
    temperature,
    top_p,
    max_tokens,
    system,
    providerOptions,
  } = body as {
    messages: UIMessage[];
    model?: string;
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
    system?: string;
    providerOptions?: Record<string, unknown>;
  };

  if (!messages?.length) {
    return new Response("messages required", { status: 400 });
  }

  const result = streamText({
    model: provider(model ?? "spoonos"),
    messages: await convertToModelMessages(messages),
    system,
    temperature,
    topP: top_p,
    maxTokens: max_tokens,
    providerOptions: providerOptions
      ? {
          spoonos:
            (providerOptions as Record<string, unknown>)?.spoonos ??
            providerOptions,
        }
      : undefined,
  });

  return result.toUIMessageStreamResponse();
}
