"use client";

import { type FileUIPart, type ChatStatus } from "ai";
import { cn } from "@/lib/utils";
import { Globe, Upload } from "lucide-react";
import {
  PromptInputProvider,
  PromptInput,
  PromptInputHeader,
  PromptInputAttachments,
  PromptInputAttachment,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionMenuItem,
  PromptInputButton,
  PromptInputSubmit,
} from "../ai-elements/prompt-input";

interface ChatInputProps {
  onSubmit: (message: { text: string; files: FileUIPart[] }) => void;
  status: ChatStatus;
  messagesLength: number;
  showWelcome: boolean;
  webSearchEnabled: boolean;
  onWebSearchToggle: () => void;
  onStop: () => void;
}

export function ChatInput({
  onSubmit,
  status,
  messagesLength,
  showWelcome,
  webSearchEnabled,
  onWebSearchToggle,
  onStop,
}: ChatInputProps) {
  return (
    <PromptInputProvider>
      <PromptInput
        onSubmit={onSubmit}
        className="shadow-2xl shadow-zinc-200/50 dark:shadow-black/80"
        accept="image/*"
        multiple
      >
        <PromptInputHeader>
          <PromptInputAttachments>
            {(attachment) => <PromptInputAttachment data={attachment} />}
          </PromptInputAttachments>
        </PromptInputHeader>
        <PromptInputBody>
          <PromptInputTextarea 
            placeholder={showWelcome ? "给 Agent 发送消息" : "Ask Agent to build..."} 
          />
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionMenuItem
                    onSelect={() =>
                      document.getElementById("file-upload")?.click()
                    }
                  >
                    <Upload className="mr-2 size-4" /> Upload a File
                  </PromptInputActionMenuItem>
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>

              <PromptInputButton
                onClick={onWebSearchToggle}
                className={cn(
                  "transition-colors",
                  webSearchEnabled
                    ? "text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 dark:text-blue-400"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                )}
                title={webSearchEnabled ? "Web Search On" : "Web Search Off"}
              >
                <Globe className="size-4" />
              </PromptInputButton>
            </PromptInputTools>

            <PromptInputSubmit
              status={status}
              disabled={status === "submitted" || (!messagesLength && status === "streaming")}
              onClick={() => {
                if (status === "streaming") {
                  onStop();
                }
              }}
            />
          </PromptInputFooter>
        </PromptInputBody>
      </PromptInput>
    </PromptInputProvider>
  );
}
