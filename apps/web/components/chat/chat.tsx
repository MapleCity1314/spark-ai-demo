"use client";

import { UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { cn, fetchWithErrorHandlers } from "@/lib/utils";
import { nanoid } from "nanoid";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChatInput } from "./chat-input";
import { ChatRender } from "./chat-render";
import { ThemeToggle } from "../ui/theme-toggle";
import { SpoonSseChatTransport } from "@/lib/spoon-sse-chat-transport";

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

  const getOrCreateSessionId = () => {
    const existing = getCookie("spoon_session_id");
    if (existing) {
      return existing;
    }
    const next = nanoid();
    setCookie("spoon_session_id", next);
    return next;
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

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
    transport: new SpoonSseChatTransport({
      baseUrl:
        process.env.NEXT_PUBLIC_SPOONOS_API_BASE_URL ??
        "http://localhost:8000",
      getBody: () => ({
        profile_prompt: getCookie("spoon_profile_prompt") ?? undefined,
        toolkits: webSearchEnabled ? ["profile", "web"] : ["profile"],
        session_id: getOrCreateSessionId(),
      }),
      fetchImpl: fetchWithErrorHandlers,
    }),
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  const query = searchParams.get("query") ?? searchParams.get("q") ?? undefined;
  const chatId = params?.id;
  const hasMessages = messages.length > 0;
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [pendingQuestionId, setPendingQuestionId] = useState<string | null>(null);
  const lastAnswerKeyRef = useRef<string | null>(null);

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
          (part.type === "tool-mbti_trader_questionnaire" ||
            part.type === "tool-mbti_trader_questionnaire_next") &&
          (part as { output?: unknown }).output,
      )
      .map((part) => part as { output?: unknown });

    const latest = toolParts[toolParts.length - 1];
    if (!latest || typeof latest.output !== "object" || latest.output === null) {
      return;
    }
    const payload = latest.output as {
      status?: string;
      question?: { question_id?: string };
    };
    if (payload.status === "question" && payload.question?.question_id) {
      setActiveQuestionId(payload.question.question_id);
      setPendingQuestionId(null);
      lastAnswerKeyRef.current = null;
    } else {
      setActiveQuestionId(null);
    }
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, status, scrollToBottom]);


  void setMessages;
  void resumeStream;
  void addToolOutput;
  void welcomeTitle;

  const inputContainerClass = cn(
    "relative w-full max-w-2xl",
    "bg-muted/30 backdrop-blur-md",
    "border border-black/5 dark:border-white/5",
    "shadow-sm transition-all duration-300 ease-out",
    "hover:bg-muted/50 hover:shadow-md",
  );

  return (
    <div className={cn("relative flex min-h-[100dvh] flex-col", className)}>
      <ThemeToggle />
      {hasMessages ? (
        <>
          <div className="mx-auto w-full max-w-2xl px-4">
            <ChatRender
              className="pb-40"
              messages={messages}
              activeQuestionId={activeQuestionId}
              onQuestionSelect={({ questionId, optionId, optionText }) => {
                if (status !== "ready") {
                  return;
                }
                const answerKey = `${questionId}:${optionId}`;
                if (
                  !questionId ||
                  pendingQuestionId === questionId ||
                  lastAnswerKeyRef.current === answerKey
                ) {
                  return;
                }
                lastAnswerKeyRef.current = answerKey;
                setPendingQuestionId(questionId);
                setActiveQuestionId(null);
                const sessionId = getOrCreateSessionId();
                  const prompt = [
                    "问卷作答：",
                    `session_id=${sessionId}`,
                    `question_id=${questionId}`,
                    `choice_id=${optionId}`,
                    `choice_text=${optionText}`,
                    "必须调用工具 mbti_trader_questionnaire_next 继续下一题；若工具返回 status=completed，停止调用并给出完成提示。不要复述参数或输出。",
                  ].join(", ");
                sendMessage({ text: prompt, files: [] });
              }}
            />
            <div ref={messagesEndRef} />
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
