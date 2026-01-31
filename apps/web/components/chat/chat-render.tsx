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
  activeQuestionId?: string | null;
  onQuestionSelect?: (payload: {
    questionId: string;
    optionId: string;
    optionText: string;
  }) => void;
}

type AttachmentPart = FileUIPart | SourceDocumentUIPart;

type MessagePart = UIMessage["parts"][number];

const isAttachmentPart = (part: MessagePart): part is AttachmentPart =>
  part.type === "file" || part.type === "source-document";

const isTextPart = (part: MessagePart): part is { type: "text"; text: string } =>
  part.type === "text" && typeof (part as { text?: unknown }).text === "string";

type QuestionnaireData = {
  question_id: string;
  title?: string;
  index: number;
  total: number;
  question: string;
  options: Array<{ id: string; text: string }>;
};

const isQuestionnaireToolPart = (
  part: MessagePart,
): part is { type: `tool-${string}`;output?: unknown;toolCallId: string; state: "output-available"; input: unknown;} =>
  part.type === "tool-mbti_trader_questionnaire" ||
  part.type === "tool-mbti_trader_questionnaire_next";

export function ChatRender({
  messages,
  className,
  emptyTitle,
  emptyDescription,
  activeQuestionId,
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
          messages.map((message, messageIndex) => {
            const attachments = message.parts.filter(isAttachmentPart);
            const textParts = message.parts.filter(isTextPart);
            const questionnaireParts = message.parts.filter(isQuestionnaireToolPart);

            return (
              <Message from={message.role} key={`${message.id}-${messageIndex}`}>
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

                  {textParts.length > 0 ? (
                    textParts.map((part, index) => {
                      const text = part.text;
                      if (text.includes("问卷作答：")) {
                        const choiceMatch = text.match(/choice_text=([^,]+)/);
                        const choiceIDMatch = text.match(/choice_id=([^,]+)/);
                        const choiceID = choiceIDMatch ? choiceIDMatch[1] : "选择了一个选项";
                        const choiceText = choiceMatch ? choiceMatch[1] : "选择了一个选项";
                        return(
                          <MessageResponse key={`message-${message.id}-${index}`}>
                            {choiceID+". "+choiceText}
                          </MessageResponse>
                        );
                      }else{
                        return (
                          <MessageResponse key={`message-${message.id}-${index}`}>
                            {text}
                          </MessageResponse>
                        );
                      }
                    })
                  ) : message.role === "assistant" ? (
                    <div className="flex items-center justify-center p-4">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-primary animate-pulse"></div>
                        <div className="w-3 h-3 bg-primary animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-3 h-3 bg-primary animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  ) : null}

                  {questionnaireParts.map((part, index) => {
                    const payload = part.output as {
                      status?: string;
                      question?: QuestionnaireData;
                    };
                    if (!payload || payload.status !== "question") {
                      return null;
                    }
                    const question = payload.question;
                    if (!question) {
                      return null;
                    }
                    const isActive = question.question_id === activeQuestionId;
                    return (
                      <div
                      key={`questionnaire-${message.id}-${index}`}
                      className="mt-3 border-2 border-border bg-background/90 px-4 py-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)]"
                    >
                        {question.title && (
                          <div className="text-xs text-muted-foreground">
                            {question.title} · 第 {question.index}/{question.total} 题
                          </div>
                        )}
                        <div className="mt-1 text-sm font-medium text-foreground">
                          {question.question}
                        </div>
                        <div className="mt-3 flex flex-col gap-2">
                          {question.options.map((option) => (
                            <button
                              type="button"
                              key={option.id}
                              className={cn(
                                "rounded-none border-2 border-border px-3 py-2 text-left text-sm text-foreground transition",
                                isActive
                                  ? "bg-yellow-100 hover:bg-yellow-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)]"
                                  : "bg-gray-100 opacity-80",
                              )}
                              disabled={!isActive}
                              onClick={() =>
                                isActive &&
                                onQuestionSelect?.({
                                  questionId: question.question_id,
                                  optionId: option.id,
                                  optionText: option.text,
                                })
                              }
                            >
                              {option.id}. {option.text}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </MessageContent>
              </Message>
            );
          })
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
