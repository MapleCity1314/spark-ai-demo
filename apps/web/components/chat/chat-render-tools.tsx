"use client";

import type { DynamicToolUIPart, ToolUIPart, UIMessage } from "ai";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
  type ToolPart,
} from "../ai-elements/tool";

interface MessageToolsProps {
  message: UIMessage;
}

type MessagePart = UIMessage["parts"][number];

type ToolMessagePart = ToolUIPart | DynamicToolUIPart;

const isToolPart = (part: MessagePart): part is ToolMessagePart =>
  part.type === "dynamic-tool" || part.type.startsWith("tool-");

const shouldAutoOpen = (state: ToolPart["state"]) =>
  state === "output-available" ||
  state === "output-error" ||
  state === "output-denied";

export function MessageTools({ message }: MessageToolsProps) {
  const toolParts = message.parts.filter(isToolPart);

  if (toolParts.length === 0) {
    return null;
  }

  return (
    <>
      {toolParts.map((part, index) => {
        const hasInput = typeof part.input !== "undefined";
        const hasOutput = typeof part.output !== "undefined" || !!part.errorText;
        const toolName = "toolName" in part ? part.toolName : undefined;
        const key = `tool-${message.id}-${part.toolCallId ?? index}`;

        return (
          <Tool key={key} defaultOpen={shouldAutoOpen(part.state)}>
            <ToolHeader
              type={part.type}
              state={part.state}
              toolName={toolName}
            />
            {(hasInput || hasOutput) && (
              <ToolContent>
                {hasInput && <ToolInput input={part.input} />}
                {hasOutput && (
                  <ToolOutput output={part.output} errorText={part.errorText} />
                )}
              </ToolContent>
            )}
          </Tool>
        );
      })}
    </>
  );
}
