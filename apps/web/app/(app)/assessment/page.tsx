"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";

import PixelCharacter from "../components/pixel-character";
import { useAppStore } from "../store/use-app-store";
import { useProfileStore } from "../store/profile-store";
import type {
  AssessmentAnswer,
  AssessmentQuestion,
  AssessmentQuestionnaire,
  MBTI,
} from "../types";
import { generateProfile, generateQuestionnaire } from "../services/assessmentService";

type LoadingStage = "questionnaire" | "profile" | null;

const normalizeMbti = (value: string, fallback: MBTI): MBTI => {
  const candidate = value.toUpperCase() as MBTI;
  const valid: MBTI[] = [
    "INTJ",
    "ENTJ",
    "INTP",
    "ENTP",
    "INFJ",
    "ENFJ",
    "INFP",
    "ENFP",
    "ISTJ",
    "ESTJ",
    "ISFJ",
    "ESFJ",
    "ISTP",
    "ESTP",
    "ISFP",
    "ESFP",
  ];
  return valid.includes(candidate) ? candidate : fallback;
};

export default function AssessmentPage() {
  const router = useRouter();
  const sessionIdRef = useRef(nanoid());
  const [questionnaire, setQuestionnaire] =
    useState<AssessmentQuestionnaire | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>("questionnaire");
  const [error, setError] = useState<string | null>(null);

  const userMBTI = useAppStore((state) => state.userMBTI);
  const setAnswersStore = useAppStore((state) => state.setAnswers);
  const applyAssessmentProfile = useAppStore(
    (state) => state.applyAssessmentProfile,
  );
  const setProfile = useProfileStore((state) => state.setProfile);

  const questions = questionnaire?.questions ?? [];
  const question: AssessmentQuestion | undefined = questions[currentIndex];

  const progress = useMemo(() => {
    if (!questions.length) return 0;
    return (currentIndex / questions.length) * 100;
  }, [currentIndex, questions.length]);

  const loadQuestionnaire = async () => {
    setLoadingStage("questionnaire");
    setError(null);
    try {
      const { questionnaire: result } = await generateQuestionnaire(
        sessionIdRef.current,
      );
      setQuestionnaire(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "问卷生成失败，请重试。";
      setError(message);
      console.error("Questionnaire load failed:", err);
    } finally {
      setLoadingStage(null);
    }
  };

  useEffect(() => {
    let isActive = true;
    void (async () => {
      if (!isActive) return;
      await loadQuestionnaire();
    })();
    return () => {
      isActive = false;
    };
  }, []);

  const handleBack = () => {
    if (currentIndex === 0) {
      router.push("/");
      return;
    }
    setAnswers((prev) => prev.slice(0, -1));
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleAnswer = async (choiceId: string, choiceText: string) => {
    if (!question || loadingStage) return;
    const nextAnswers = [
      ...answers,
      { questionId: question.id, choiceId, choiceText },
    ];

    if (currentIndex + 1 < questions.length) {
      setAnswers(nextAnswers);
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    if (!questionnaire) {
      return;
    }

    setLoadingStage("profile");
    setError(null);
    try {
      const profile = await generateProfile(
        sessionIdRef.current,
        questionnaire,
        nextAnswers,
      );
      const mbtiType = normalizeMbti(profile.mbtiType, userMBTI);
      setProfile({
        id: profile.profileId || nanoid(),
        mbtiType,
        profilePrompt: profile.profilePrompt,
        rawProfile: profile.rawProfile,
        createdAt: new Date().toISOString(),
        questionnaire,
        answers: nextAnswers,
      });
      applyAssessmentProfile(mbtiType);
      setAnswersStore(nextAnswers.map((answer) => answer.choiceId));
      router.push("/setup");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "画像生成失败，请重试。";
      setError(message);
      console.error("Profile generation failed:", err);
    } finally {
      setLoadingStage(null);
    }
  };

  return (
    <div className="w-full min-h-[100dvh] p-4 md:p-12 flex flex-col bg-[#050510] relative overflow-y-auto overflow-x-hidden">
      <div className="grid-floor fixed inset-0 z-0"></div>

      <div className="relative z-10 flex flex-col md:block w-full max-w-5xl mx-auto">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors z-20 mb-4 md:mb-0 md:absolute md:top-20 md:-left-16 lg:-left-24"
        >
          <ArrowLeft size={20} />
          <span className="font-arcade text-[10px] uppercase">BACK</span>
        </button>

        <div className="flex items-center gap-4 mb-8 md:mb-16">
          <span className="font-arcade text-cyan-400 text-sm md:text-lg whitespace-nowrap">
            SYNC RATE
          </span>
          <div className="flex-1 h-4 md:h-6 bg-black border-2 border-cyan-400 p-1 flex">
            <div
              className="h-full bg-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.5)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 lg:gap-20 relative z-10 w-full max-w-6xl mx-auto">
        <div className="flex flex-col items-center gap-4 md:gap-8 shrink-0">
          <div className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center">
            <PixelCharacter className="scale-100 md:scale-[1.5] lg:scale-[1.8]" />
          </div>

          <div className="font-arcade text-[10px] text-cyan-500 uppercase h-4 text-center">
            {loadingStage === "profile"
              ? "PROFILE SYNTHESIS..."
              : currentIndex > 0
                ? "PROFILING..."
                : "WAITING FOR INPUT"}
          </div>
        </div>

        <div className="w-full max-w-2xl">
          <div className="pixel-card p-6 md:p-10 mb-6 md:mb-10 bg-[#0a0a20]/90">
            <p className="text-xl md:text-3xl text-white font-sans leading-relaxed">
              {loadingStage === "questionnaire"
                ? "正在生成问卷..."
                : question?.prompt ?? "问卷加载中..."}
            </p>
            {error && (
              <div className="mt-4 text-sm text-red-400 font-sans space-y-3">
                <p>{error}</p>
                <button
                  onClick={loadQuestionnaire}
                  className="pixel-btn px-4 py-2 text-xs uppercase"
                >
                  重试加载
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 md:gap-4">
            {(question?.options ?? []).map((option) => (
              <button
                key={option.id}
                onClick={() => handleAnswer(option.id, option.text)}
                disabled={Boolean(loadingStage)}
                className="pixel-btn p-4 md:p-6 text-center text-base md:text-lg hover:scale-[1.01] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {option.text}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loadingStage && (
        <div className="absolute inset-0 z-20 bg-black/70 flex items-center justify-center">
          <div className="pixel-card bg-[#0b0b1d] border-cyan-400 border-2 p-6 text-center">
            <p className="font-arcade text-xs text-cyan-400 uppercase mb-2">
              {loadingStage === "questionnaire"
                ? "LOADING QUESTIONNAIRE"
                : "GENERATING PROFILE"}
            </p>
            <p className="text-sm text-slate-200 font-sans">
              {loadingStage === "questionnaire"
                ? "正在请求 AI 生成问卷..."
                : "正在把答案回传给 AI..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
