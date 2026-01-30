"use client";

import { UIMessage, DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { cn, fetchWithErrorHandlers } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChatInput } from "./chat-input";
import { ChatRender } from "./chat-render";

interface ChatProps {
  initialMessage?: UIMessage;
  initialMessages?: UIMessage[];
  webSearchEnabled: boolean;
  onWebSearchToggle: () => void;
  welcomeTitle?: string;
  welcomeSubtitle?: string;
  className?: string;
}

export function Chat({
  initialMessage,
  initialMessages,
  webSearchEnabled,
  onWebSearchToggle,
  welcomeTitle = "欢迎回来",
  welcomeSubtitle = "今天想探索什么？",
  className,
}: ChatProps) {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const hasAppendedQueryRef = useRef(false);
  const handledProfileIdsRef = useRef<Set<string>>(new Set());

  const seedMessages =
    initialMessages ?? (initialMessage ? [initialMessage] : []);

  const getCookie = (name: string) => {
    if (typeof document === "undefined") {
      return null;
    }
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${name}=([^;]*)`),
    );
    return match ? decodeURIComponent(match[1]) : null;
  };

  const setCookie = (name: string, value: string, maxAgeDays = 30) => {
    if (typeof document === "undefined") {
      return;
    }
    const maxAge = maxAgeDays * 24 * 60 * 60;
    document.cookie = `${name}=${encodeURIComponent(
      value,
    )}; path=/; max-age=${maxAge}`;
  };

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    resumeStream,
    addToolOutput,
  } = useChat({
    messages: seedMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({
        profile_prompt: getCookie("spoon_profile_prompt") ?? undefined,
        toolkits: webSearchEnabled ? ["profile", "web"] : ["profile"],
      }),
      fetch: fetchWithErrorHandlers,
    }),
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  const query = searchParams.get("query") ?? searchParams.get("q") ?? undefined;
  const chatId = params?.id;
  const hasMessages = messages.length > 0;
  const [questionnaireState, setQuestionnaireState] = useState<{
    toolCallId: string;
    title?: string;
    currentIndex: number;
    questions: Array<{
      id: string;
      question: string;
      options: Array<{ id: string; text: string }>;
    }>;
  } | null>(null);

  const activeQuestionnaire = useMemo(() => {
    if (!questionnaireState) {
      return null;
    }
    const question = questionnaireState.questions[questionnaireState.currentIndex];
    if (!question) {
      return null;
    }
    return {
      title: questionnaireState.title,
      question: question.question,
      options: question.options,
    };
  }, [questionnaireState]);

  useEffect(() => {
    if (query && !hasAppendedQueryRef.current) {
      sendMessage({ text: query, files: [] });
      hasAppendedQueryRef.current = true;
      if (chatId) {
        router.replace(`/c/${chatId}`);
      }
    }
  }, [query, sendMessage, chatId, router]);

  useEffect(() => {
    const toolParts = messages
      .flatMap((message) => message.parts)
      .filter(
        (part) =>
          part.type === "tool-mbti_trader_questionnaire" &&
          (part as { output?: unknown }).output,
      )
      .map((part) => part as { toolCallId?: string; output?: unknown });

    const latest = toolParts[toolParts.length - 1];
    if (!latest || typeof latest.output !== "object" || latest.output === null) {
      return;
    }

    const payload = latest.output as {
      title?: string;
      current_index?: number;
      questions?: Array<{
        id: string;
        question: string;
        options?: Array<{ id: string; text: string }>;
      }>;
    };

    if (!payload.questions || payload.questions.length === 0) {
      return;
    }

    const toolCallId = latest.toolCallId ?? "questionnaire";
    setQuestionnaireState((prev) => {
      if (prev?.toolCallId === toolCallId) {
        return prev;
      }
      return {
        toolCallId,
        title: payload.title,
        currentIndex: payload.current_index ?? 0,
        questions: payload.questions.map((question) => ({
          id: question.id,
          question: question.question,
          options: question.options ?? [],
        })),
      };
    });
  }, [messages]);

  useEffect(() => {
    const profileOutputs = messages.flatMap((message) =>
      message.parts
        .filter((part) => part.type === "tool-mbti_profile_create")
        .map((part) => part as { output?: unknown; state?: string }),
    );

    const handleProfile = async (output: unknown) => {
      if (!output || typeof output !== "object") {
        return;
      }
      const record = output as {
        profile_id?: string;
        profileId?: string;
        profile?: unknown;
        profile_prompt?: string;
      };
      const profileId = record.profile_id ?? record.profileId;
      if (!profileId || handledProfileIdsRef.current.has(profileId)) {
        return;
      }

      try {
        const response = await fetch(`/api/profile/${profileId}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as {
          profile_id?: string;
          profile?: unknown;
          profile_prompt?: string;
        };
        if (!data.profile_id) {
          return;
        }
        handledProfileIdsRef.current.add(data.profile_id);
        if (data.profile_prompt) {
          setCookie("spoon_profile_prompt", data.profile_prompt);
        }
        if (data.profile) {
          setCookie("spoon_profile", JSON.stringify(data.profile));
        }
        setCookie("spoon_profile_id", data.profile_id);
      } catch (error) {
        console.error("Profile fetch error:", error);
      }
    };

    void Promise.all(
      profileOutputs
        .filter((part) => part.state === "output-available")
        .map((part) => handleProfile(part.output)),
    );
  }, [messages]);

  void setMessages;
  void resumeStream;
  void addToolOutput;
  void welcomeTitle;

  const inputContainerClass = cn(
    "relative w-full max-w-2xl",
    "rounded-[32px] bg-muted/30 p-1.5 backdrop-blur-md",
    "border border-black/5 dark:border-white/5",
    "shadow-sm transition-all duration-300 ease-out",
    "hover:bg-muted/50 hover:shadow-md",
  );

  return (
    <div className={cn("relative flex min-h-[100dvh] flex-col", className)}>
      {hasMessages ? (
        <>
          <div className="mx-auto w-full max-w-2xl px-4">
            <ChatRender
              className="pb-40"
              messages={messages}
              questionnaire={activeQuestionnaire}
              onQuestionSelect={(optionText) => {
                if (!questionnaireState) {
                  return;
                }
                sendMessage({ text: optionText, files: [] });
                setQuestionnaireState((prev) => {
                  if (!prev) {
                    return prev;
                  }
                  const nextIndex = prev.currentIndex + 1;
                  if (nextIndex >= prev.questions.length) {
                    return null;
                  }
                  return { ...prev, currentIndex: nextIndex };
                });
              }}
            />
          </div>

          <div className="fixed inset-x-0 bottom-0 z-10">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/90 to-transparent" />

            <div className="relative flex w-full justify-center px-4 pb-6">
              <div
                className={cn(
                  inputContainerClass,
                  "bg-background/80 shadow-lg",
                )}
              >
                <ChatInput
                  messagesLength={messages.length}
                  onSubmit={sendMessage}
                  onStop={stop}
                  onWebSearchToggle={onWebSearchToggle}
                  showWelcome={false}
                  status={status}
                  webSearchEnabled={webSearchEnabled}
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 pb-20 pt-10">
          <div className="mb-10 flex flex-col items-center text-center">
            <h1 className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl animate-in fade-in slide-in-from-bottom-3 duration-700">
              {welcomeSubtitle}
            </h1>
          </div>

          <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
            <div className={inputContainerClass}>
              <ChatInput
                messagesLength={0}
                onSubmit={sendMessage}
                onStop={stop}
                onWebSearchToggle={onWebSearchToggle}
                showWelcome
                status={status}
                webSearchEnabled={webSearchEnabled}
              />
            </div>

            <div className="mt-4 flex justify-center gap-4 text-xs text-muted-foreground/40 opacity-0 animate-in fade-in duration-1000 delay-500">
              <span>Enter 发送</span>
              <span>Shift + Enter 换行</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
