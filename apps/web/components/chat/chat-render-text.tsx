"use client";

import type { UIMessage } from "ai";
import { MessageResponse } from "../ai-elements/message";

interface MessageTextProps {
  message: UIMessage;
}

type MessagePart = UIMessage["parts"][number];

const isTextPart = (part: MessagePart): part is { type: "text"; text: string } =>
  part.type === "text" && typeof (part as { text?: unknown }).text === "string";

export function MessageText({ message }: MessageTextProps) {
  const textParts = message.parts.filter(isTextPart);

  if (textParts.length === 0) {
    if (message.role !== "assistant") {
      return null;
    }

    return (
      <div className="flex items-center justify-center p-4">
        <div className="flex space-x-2">
          <div className="h-3 w-3 animate-pulse bg-primary"></div>
          <div
            className="h-3 w-3 animate-pulse bg-primary"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="h-3 w-3 animate-pulse bg-primary"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {textParts.map((part, index) => {
        const text = part.text;
        if (text.includes("问卷作答：")) {
          const choiceMatch = text.match(/choice_text=([^,]+)/);
          const choiceIdMatch = text.match(/choice_id=([^,]+)/);
          const choiceId = choiceIdMatch ? choiceIdMatch[1] : "选择了一个选项";
          const choiceText = choiceMatch ? choiceMatch[1] : "选择了一个选项";
          return (
            <MessageResponse key={`message-${message.id}-${index}`}>
              {`${choiceId}. ${choiceText}`}
            </MessageResponse>
          );
        }

        return (
          <MessageResponse key={`message-${message.id}-${index}`}>
            {text}
          </MessageResponse>
        );
      })}
    </>
  );
}
