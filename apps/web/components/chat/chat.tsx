"use client";

import type { UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
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
  welcomeSubtitle = "告诉我你想做什么",
  className,
}: ChatProps) {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  const seedMessages =
    initialMessages ?? (initialMessage ? [initialMessage] : []);

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    resumeStream,
    addToolOutput,
  } = useChat({
    api: "/api/chat",
    initialMessages: seedMessages,
  });

  const query =
    searchParams.get("query") ?? searchParams.get("q") ?? undefined;
  const chatId = params?.id;
  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      sendMessage({ text: query, files: [] });
      setHasAppendedQuery(true);
      if (chatId) {
        router.replace(`/c/${chatId}`);
      }
    }
  }, [query, sendMessage, hasAppendedQuery, chatId, router]);

  void setMessages;
  void resumeStream;
  void addToolOutput;

  return (
    <div className={cn("relative flex min-h-[100dvh] flex-col", className)}>
      {hasMessages ? (
        <>
          <ChatRender className="pb-32" messages={messages} />

          <div className="pointer-events-none absolute inset-x-0 bottom-0">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/70 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/95 to-transparent" />

            <div className="pointer-events-none relative flex w-full justify-center px-4 pb-6">
              <div className="pointer-events-auto w-full max-w-3xl">
                <div className="rounded-2xl border bg-background/80 p-2 shadow-2xl backdrop-blur">
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
          </div>
        </>
      ) : (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{welcomeTitle}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              {welcomeSubtitle}
            </h1>
          </div>
          <div className="w-full max-w-2xl">
            <div className="rounded-2xl border bg-background/80 p-2 shadow-2xl backdrop-blur">
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
          </div>
        </div>
      )}
    </div>
  );
}
