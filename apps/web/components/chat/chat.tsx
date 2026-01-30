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
  welcomeSubtitle = "今天想探索什么？",
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

  // 极简风格的 Input 容器
  const inputContainerClass = cn(
    "relative w-full max-w-2xl",
    "rounded-[32px] bg-muted/30 p-1.5 backdrop-blur-md", 
    "border border-black/5 dark:border-white/5",
    "shadow-sm transition-all duration-300 ease-out",
    "hover:bg-muted/50 hover:shadow-md"
  );

  return (
    <div className={cn("relative flex min-h-[100dvh] flex-col", className)}>
      {hasMessages ? (
        <>
          <ChatRender className="pb-40" messages={messages} />

          <div className="fixed inset-x-0 bottom-0 z-10">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/90 to-transparent" />
            
            <div className="relative flex w-full justify-center px-4 pb-6">
              <div className={cn(inputContainerClass, "bg-background/80 shadow-lg")}>
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