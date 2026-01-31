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

    <div className="w-full min-h-[100dvh] p-4 md:p-12 flex flex-col bg-[#050510] relative overflow-y-auto overflow-x-hidden">
      <div className="grid-floor fixed inset-0 z-0"></div>
      

      <div className="relative z-10 flex flex-col md:block w-full max-w-5xl mx-auto">
        
        <button
          onClick={() => (answers.length === 0 ? router.push("/") : removeLastAnswer())}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors z-20 mb-4 md:mb-0 md:absolute md:top-20 md:-left-16 lg:-left-24"
        >
          <ArrowLeft size={20} />
          <span className="font-arcade text-[10px] uppercase">BACK</span>
        </button>

        <div className="flex items-center gap-4 mb-8 md:mb-16">
          <span className="font-arcade text-cyan-400 text-sm md:text-lg whitespace-nowrap">SYNC RATE</span>
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
            {answers.length > 0 ? "PROFILING..." : "WAITING FOR INPUT"}
          </div>
        </div>

        <div className="w-full max-w-2xl">

          <div className="pixel-card p-6 md:p-10 mb-6 md:mb-10 bg-[#0a0a20]/90">

            <p className="text-xl md:text-3xl text-white font-sans leading-relaxed">
              {question.text}
            </p>
          </div>

          <div className="flex flex-col gap-3 md:gap-4">
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

                className="pixel-btn p-4 md:p-6 text-center text-base md:text-lg hover:scale-[1.01] active:scale-[0.98] transition-transform"
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