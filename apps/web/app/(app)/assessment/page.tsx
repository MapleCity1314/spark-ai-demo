"use client";

import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import PixelCharacter from "../components/pixel-character";
import { QUESTIONS } from "../constants";
import { useAppStore } from "../store/use-app-store";

export default function AssessmentPage() {
  const router = useRouter();
  const answers = useAppStore((state) => state.answers);
  const addAnswer = useAppStore((state) => state.addAnswer);
  const removeLastAnswer = useAppStore((state) => state.removeLastAnswer);
  const applyAssessmentResults = useAppStore((state) => state.applyAssessmentResults);

  const question = QUESTIONS[answers.length];
  const progress = (answers.length / QUESTIONS.length) * 100;

  useEffect(() => {
    if (!question) router.replace("/setup");
  }, [question, router]);

  if (!question) return null;

  return (
    <div className="w-full h-full p-12 flex flex-col bg-[#050510] relative overflow-hidden">
      <div className="grid-floor"></div>
      <div className="relative z-10 flex items-center gap-4 mb-16">
        <span className="font-arcade text-cyan-400 text-lg">SYNC RATE</span>
        <div className="flex-1 h-6 bg-black border-2 border-cyan-400 p-1 flex">
          <div
            className="h-full bg-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.5)] transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      <button
        onClick={() => (answers.length === 0 ? router.push("/") : removeLastAnswer())}
        className="absolute top-24 left-12 flex items-center gap-2 text-slate-500 hover:text-white transition-colors z-20"
      >
        <ArrowLeft size={20} />
        <span className="font-arcade text-[10px] uppercase">BACK</span>
      </button>
      <div className="flex-1 flex items-center justify-center gap-20 relative z-10">
        <div className="flex flex-col items-center gap-8">
          <PixelCharacter className="scale-[2.5]" />
          <div className="font-arcade text-[10px] text-cyan-500 uppercase h-4">
            {answers.length > 0 ? "PROFILING..." : "WAITING FOR INPUT"}
          </div>
        </div>
        <div className="w-full max-w-2xl">
          <div className="pixel-card p-10 mb-10 bg-[#0a0a20]/90">
            <p className="text-3xl text-white font-sans leading-relaxed">{question.text}</p>
          </div>
          <div className="flex flex-col gap-4">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  const nextAnswers = [...answers, option.value];
                  if (nextAnswers.length === QUESTIONS.length) {
                    applyAssessmentResults(nextAnswers);
                    router.push("/setup");
                    return;
                  }
                  addAnswer(option.value);
                }}
                className="pixel-btn p-6 text-center text-lg hover:scale-[1.02] transition-transform"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
