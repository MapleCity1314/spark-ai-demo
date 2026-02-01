import type { UIMessageChunk, UIMessage } from "ai";

import { runAgent, streamAgent } from "./agentService";
import type {
  AssessmentAnswer,
  AssessmentQuestion,
  AssessmentQuestionnaire,
} from "../types";
import {
  EXTRA_QUESTIONS_SYSTEM_PROMPT,
  PROFILE_SYSTEM_PROMPT,
  QUESTIONNAIRE_SYSTEM_PROMPT,
} from "../lib/assessment-prompts";

type QuestionnaireResult = {
  questionnaire: AssessmentQuestionnaire;
  raw: string;
};

type ProfileResult = {
  profileId: string;
  mbtiType: string;
  profilePrompt: string;
  rawProfile: string;
};

type ToolOutputEvent = {
  toolName: string;
  output: Record<string, unknown>;
};

const collectToolOutputs = async (
  stream: ReadableStream<UIMessageChunk>,
): Promise<ToolOutputEvent[]> => {
  const reader = stream.getReader();
  const toolNameMap = new Map<string, string>();
  const outputs: ToolOutputEvent[] = [];

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value || typeof value !== "object") continue;
    if (value.type === "tool-input-available") {
      toolNameMap.set(value.toolCallId, value.toolName);
    }
    if (value.type === "tool-output-available") {
      outputs.push({
        toolName: toolNameMap.get(value.toolCallId) ?? "",
        output: (value.output ?? {}) as Record<string, unknown>,
      });
    }
  }

  return outputs;
};

const getMessageText = (message: UIMessage) =>
  message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part as { text?: string }).text ?? "")
    .join("");

const parseAttributes = (source: string) => {
  const attributes: Record<string, string> = {};
  const attrRegex = /([a-zA-Z0-9_-]+)="([^"]*)"/g;
  let match: RegExpExecArray | null = null;
  while ((match = attrRegex.exec(source))) {
    attributes[match[1]] = match[2];
  }
  return attributes;
};

const parseQuestionBlocks = (text: string) => {
  const questionMatches = text.matchAll(
    /<question\b([^>]*)>([\s\S]*?)<\/question>/g,
  );
  const questions: AssessmentQuestion[] = [];
  for (const match of questionMatches) {
    const questionAttrs = parseAttributes(match[1] ?? "");
    const body = match[2] ?? "";
    const promptMatch = body.match(/<prompt>([\s\S]*?)<\/prompt>/);
    const prompt = (promptMatch?.[1] ?? "").trim();
    const options: AssessmentQuestion["options"] = [];
    const optionMatches = body.matchAll(
      /<option\b([^>]*)>([\s\S]*?)<\/option>/g,
    );
    for (const optionMatch of optionMatches) {
      const optionAttrs = parseAttributes(optionMatch[1] ?? "");
      options.push({
        id: optionAttrs.id || "",
        text: (optionMatch[2] ?? "").trim(),
      });
    }
    if (!prompt || options.length === 0) {
      continue;
    }
    questions.push({
      id: questionAttrs.id || `q${questions.length + 1}`,
      dimension: questionAttrs.dimension || undefined,
      prompt,
      options,
    });
  }
  return questions;
};

const parseExtraQuestions = (text: string): AssessmentQuestion[] => {
  const wrapperMatch = text.match(
    /<extra-questions\b[^>]*>[\s\S]*?<\/extra-questions>/,
  );
  if (!wrapperMatch) {
    return [];
  }
  return parseQuestionBlocks(wrapperMatch[0]);
};

const buildProfileRequestMessage = (
  questionnaire: AssessmentQuestionnaire,
  answers: AssessmentAnswer[],
) => {
  const questionLines = questionnaire.questions
    .map((question) => {
      const optionLines = question.options
        .map((option) => `- ${option.id}: ${option.text}`)
        .join("\n");
      return `问题 ${question.id} (${question.dimension ?? ""}): ${question.prompt}\n${optionLines}`;
    })
    .join("\n\n");

  const answerLines = answers
    .map(
      (answer) =>
        `${answer.questionId}: ${answer.choiceId} (${answer.choiceText})`,
    )
    .join("\n");

  return `问卷题目:\n${questionLines}\n\n用户答案:\n${answerLines}`.trim();
};

export const generateQuestionnaire = async (
  sessionId: string,
): Promise<QuestionnaireResult> => {
  const stream = await streamAgent({
    message: "生成问卷",
    sessionId,
    systemPrompt: QUESTIONNAIRE_SYSTEM_PROMPT,
    toolkits: ["profile"],
    timeout: 30,
  });

  const outputs = await collectToolOutputs(stream);
  const questionsById = new Map<
    string,
    { index: number; question: AssessmentQuestion }
  >();
  let title = "MBTI 量化交易者画像问卷";
  let version = "v1";

  for (const outputEvent of outputs) {
    if (
      outputEvent.toolName !== "mbti_trader_questionnaire" &&
      outputEvent.toolName !== "mbti_trader_questionnaire_next"
    ) {
      continue;
    }

    const questionPayload = outputEvent.output.question as
      | {
          question_id?: string;
          title?: string;
          index?: number;
          total?: number;
          question?: string;
          options?: { id?: string; text?: string }[];
        }
      | undefined;

    if (!questionPayload?.question_id || !questionPayload.question) {
      continue;
    }

    if (questionPayload.title) {
      title = questionPayload.title;
    }

    if (!questionsById.has(questionPayload.question_id)) {
      const options =
        questionPayload.options?.map((option) => ({
          id: option.id ?? "",
          text: option.text ?? "",
        })) ?? [];

      questionsById.set(questionPayload.question_id, {
        index: questionPayload.index ?? questionsById.size + 1,
        question: {
          id: questionPayload.question_id,
          prompt: questionPayload.question,
          options,
        },
      });
    }
  }

  let questions = Array.from(questionsById.values())
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.question);

  if (questions.length < 5) {
    const message = `已有题目 ${questions.length} 道，需要补充到 5-8 道。\n` +
      `已有题目:\n${questions
        .map((q) => `- ${q.id}: ${q.prompt}`)
        .join("\n")}`;

    const extraMessages = await runAgent({
      message,
      sessionId,
      systemPrompt: EXTRA_QUESTIONS_SYSTEM_PROMPT,
      toolkits: [],
      timeout: 30,
    });
    const extraText = extraMessages.map(getMessageText).join("\n");
    const extraQuestions = parseExtraQuestions(extraText);
    const fallbackQuestions: AssessmentQuestion[] = [
      {
        id: "q5",
        dimension: "RISK",
        prompt: "当行情剧烈波动时，你更倾向于？",
        options: [
          { id: "A", text: "严格按照风控阈值执行" },
          { id: "B", text: "根据盘面变化灵活调整" },
        ],
      },
      {
        id: "q6",
        dimension: "DISCIPLINE",
        prompt: "你在执行交易计划时的风格更接近？",
        options: [
          { id: "A", text: "严格遵守预设计划" },
          { id: "B", text: "允许根据新信息即时修正" },
        ],
      },
      {
        id: "q7",
        dimension: "SIGNAL",
        prompt: "你更相信哪类入场信号？",
        options: [
          { id: "A", text: "数据指标一致性" },
          { id: "B", text: "叙事拐点与情绪变化" },
        ],
      },
      {
        id: "q8",
        dimension: "EXIT",
        prompt: "你的退出策略通常是？",
        options: [
          { id: "A", text: "达到预设目标或止损即退出" },
          { id: "B", text: "根据行情强弱动态调整" },
        ],
      },
    ];
    const mergedExtra =
      extraQuestions.length > 0 ? extraQuestions : fallbackQuestions;
    questions = [...questions, ...mergedExtra].slice(0, 8);
  }

  if (questions.length < 5) {
    throw new Error("Questionnaire needs at least 5 questions");
  }

  return {
    questionnaire: { title, version, questions },
    raw: JSON.stringify(outputs),
  };
};

export const generateProfile = async (
  sessionId: string,
  questionnaire: AssessmentQuestionnaire,
  answers: AssessmentAnswer[],
): Promise<ProfileResult> => {
  const message = buildProfileRequestMessage(questionnaire, answers);
  const stream = await streamAgent({
    message,
    sessionId,
    systemPrompt: PROFILE_SYSTEM_PROMPT,
    toolkits: ["profile"],
    timeout: 30,
  });

  const outputs = await collectToolOutputs(stream);
  const profileOutput = outputs.find(
    (outputEvent) => outputEvent.toolName === "mbti_profile_create",
  );

  if (!profileOutput) {
    throw new Error("Profile tool output not found");
  }

  const payload = profileOutput.output as Record<string, unknown>;
  const profile = (payload.profile ?? {}) as Record<string, unknown>;

  return {
    profileId: String(payload.profile_id ?? ""),
    mbtiType: String(profile.mbti_type ?? ""),
    profilePrompt: String(payload.profile_prompt ?? ""),
    rawProfile: JSON.stringify(profile),
  };
};
