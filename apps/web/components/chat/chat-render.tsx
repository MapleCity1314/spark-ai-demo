"use client";

import type { FileUIPart, SourceDocumentUIPart, UIMessage } from "ai";
import { cn } from "@/lib/utils";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "../ai-elements/conversation";
import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  Attachments,
} from "../ai-elements/attachments";
import { Message, MessageContent, MessageResponse } from "../ai-elements/message";

interface ChatRenderProps {
  messages: UIMessage[];
  className?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  questionnaire?: {
    title?: string;
    index?: number;
    total?: number;
    question: string;
    options: Array<{ id: string; text: string }>;
  } | null;
  questionnaireHistory?: Array<{
    title?: string;
    index: number;
    total: number;
    question: string;
    selectedOption: { id: string; text: string };
  }>;
  onQuestionSelect?: (optionText: string) => void;
}

type AttachmentPart = FileUIPart | SourceDocumentUIPart;

type MessagePart = UIMessage["parts"][number];

const isAttachmentPart = (part: MessagePart): part is AttachmentPart =>
  part.type === "file" || part.type === "source-document";

const isTextPart = (part: MessagePart): part is { type: "text"; text: string } =>
  part.type === "text" && typeof (part as { text?: unknown }).text === "string";

export function ChatRender({
  messages,
  className,
  emptyTitle,
  emptyDescription,
  questionnaire,
  questionnaireHistory,
  onQuestionSelect,
}: ChatRenderProps) {
  return (
    <Conversation className={cn("relative flex-1", className)}>
      <ConversationContent>
        {messages.length === 0 ? (
          <ConversationEmptyState
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          messages.map((message) => {
            const attachments = message.parts.filter(isAttachmentPart);
            const textParts = message.parts.filter(isTextPart);

            return (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {attachments.length > 0 && (
                    <Attachments className="mb-2" variant="grid">
                      {attachments.map((part, index) => (
                        <Attachment
                          data={{
                            ...part,
                            id:
                              "id" in part && typeof part.id === "string"
                                ? part.id
                                : `${message.id}-attachment-${index}`,
                          }}
                          key={`attachment-${message.id}-${index}`}
                        >
                          <AttachmentPreview />
                          <AttachmentInfo />
                        </Attachment>
                      ))}
                    </Attachments>
                  )}

                  {textParts.map((part, index) => (
                    <MessageResponse
                      key={`message-${message.id}-${index}`}
                    >
                      {part.text}
                    </MessageResponse>
                  ))}

                </MessageContent>
              </Message>
            );
          })
        )}
        {questionnaireHistory &&
          questionnaireHistory.map((item, index) => (
            <div
              key={`questionnaire-history-${index}`}
              className="mt-3 rounded-2xl border border-border bg-muted/30 px-4 py-3"
            >
              {item.title && (
                <div className="text-xs text-muted-foreground">
                  {item.title} · 第 {item.index}/{item.total} 题
                </div>
              )}
              <div className="mt-1 text-sm font-medium text-foreground">
                {item.question}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                已选：{item.selectedOption.id}. {item.selectedOption.text}
              </div>
            </div>
          ))}
        {questionnaire && (
          <div className="mt-3 rounded-2xl border border-border bg-background/90 px-4 py-3 shadow-sm">
            {questionnaire.title && (
              <div className="text-xs text-muted-foreground">
                {questionnaire.title}
                {typeof questionnaire.index === "number" &&
                  typeof questionnaire.total === "number" &&
                  ` · 第 ${questionnaire.index}/${questionnaire.total} 题`}
              </div>
            )}
            <div className="mt-1 text-sm font-medium text-foreground">
              {questionnaire.question}
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {questionnaire.options.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  className="rounded-xl border border-border bg-muted/60 px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted"
                  onClick={() => onQuestionSelect?.(option.text)}
                >
                  {option.id}. {option.text}
                </button>
              ))}
            </div>
          </div>
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
