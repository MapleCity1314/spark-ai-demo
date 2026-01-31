"use client";

import type { UIMessage } from "ai";
import { cn } from "@/lib/utils";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "../ai-elements/conversation";
import { Message, MessageContent } from "../ai-elements/message";
import { MessageAttachments } from "./chat-render-attachments";
import { MessageQuestionnaire } from "./chat-render-questionnaire";
import { MessageText } from "./chat-render-text";
import { MessageTools } from "./chat-render-tools";
import { JudgeReport } from "./judge-report";
import { JudgeNote } from "./judge-note";

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
          messages.map((message, messageIndex) => (
            <Message from={message.role} key={`${message.id}-${messageIndex}`}>
              <MessageContent>
                <MessageAttachments message={message} />
                {message.parts
                  .filter(
                    (part) =>
                      part.type === "text" &&
                      typeof part.text === "string" &&
                      part.text.includes("【法官裁决】"),
                  )
                  .map((part, index) => (
                    <JudgeReport
                      key={`${message.id}-judge-${index}`}
                      text={part.text}
                      className="mb-4"
                    />
                  ))}
                {message.parts
                  .filter(
                    (part) =>
                      part.type === "text" &&
                      typeof part.text === "string" &&
                      part.text.includes("【法官旁注】"),
                  )
                  .map((part, index) => (
                    <JudgeNote
                      key={`${message.id}-judge-note-${index}`}
                      text={part.text}
                      className="mb-3"
                    />
                  ))}
                <MessageText message={message} />
                <MessageTools message={message} />
                <MessageQuestionnaire
                  message={message}
                  activeQuestionId={activeQuestionId}
                  onQuestionSelect={onQuestionSelect}
                />
              </MessageContent>
            </Message>
          ))
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
