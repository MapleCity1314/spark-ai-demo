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
    toolkits,
    mcp_enabled,
    sub_agents,
  } = body as {
    messages: UIMessage[];
    model?: string;
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
    system?: string;
    providerOptions?: Record<string, unknown>;
    toolkits?: string[];
    mcp_enabled?: boolean;
    sub_agents?: Array<Record<string, unknown>>;
  };

  if (!messages?.length) {
    return new Response("messages required", { status: 400 });
  }

  const spoonosOptions =
    (providerOptions as Record<string, unknown>)?.spoonos ?? providerOptions ?? {};
  const mergedProviderOptions =
    toolkits || mcp_enabled !== undefined || sub_agents
      ? {
          spoonos: {
            ...(spoonosOptions as Record<string, unknown>),
            toolkits,
            mcp_enabled,
            sub_agents,
          },
        }
      : providerOptions
        ? { spoonos: spoonosOptions }
        : undefined;

  const result = streamText({
    model: provider(model ?? "spoonos"),
    messages: await convertToModelMessages(messages),
    system,
    temperature,
    topP: top_p,
    maxTokens: max_tokens,
    providerOptions: mergedProviderOptions,
  });

  return result.toUIMessageStreamResponse();
}
