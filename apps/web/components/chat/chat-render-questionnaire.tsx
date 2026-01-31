"use client";

import type { UIMessage } from "ai";
import { cn } from "@/lib/utils";

interface MessageQuestionnaireProps {
  message: UIMessage;
  activeQuestionId?: string | null;
  onQuestionSelect?: (payload: {
    questionId: string;
    optionId: string;
    optionText: string;
  }) => void;
}

type QuestionnaireData = {
  question_id: string;
  title?: string;
  index: number;
  total: number;
  question: string;
  options: Array<{ id: string; text: string }>;
};

type MessagePart = UIMessage["parts"][number];

type QuestionnaireToolPart = {
  type: `tool-${string}`;
  output?: unknown;
  toolCallId: string;
  state: "output-available";
  input: unknown;
};

const isQuestionnaireToolPart = (
  part: MessagePart
): part is QuestionnaireToolPart =>
  part.type === "tool-mbti_trader_questionnaire" ||
  part.type === "tool-mbti_trader_questionnaire_next";

export function MessageQuestionnaire({
  message,
  activeQuestionId,
  onQuestionSelect,
}: MessageQuestionnaireProps) {
  const questionnaireParts = message.parts.filter(isQuestionnaireToolPart);

  if (questionnaireParts.length === 0) {
    return null;
  }

  return (
    <>
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
                      : "bg-gray-100 opacity-80"
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
    </>
  );
}
