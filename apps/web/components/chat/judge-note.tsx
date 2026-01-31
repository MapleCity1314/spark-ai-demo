"use client";

import { cn } from "@/lib/utils";

const JUDGE_NOTE_PREFIX = "【法官旁注】";

export const hasJudgeNote = (text: string) => text.includes(JUDGE_NOTE_PREFIX);

export const stripJudgeNote = (text: string) =>
  text.replace(JUDGE_NOTE_PREFIX, "").trim();

interface JudgeNoteProps {
  text: string;
  className?: string;
}

export function JudgeNote({ text, className }: JudgeNoteProps) {
  if (!hasJudgeNote(text)) return null;
  const content = stripJudgeNote(text);

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.6)]",
        className,
      )}
    >
      <div className="absolute inset-0 opacity-60">
        <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-slate-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-20 h-44 w-44 rounded-full bg-slate-300/40 blur-3xl" />
      </div>
      <div className="relative flex items-start gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-slate-50">
          <span className="text-base">🔎</span>
        </div>
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
            Judge Note
          </p>
          <p className="text-sm text-slate-900">{content}</p>
        </div>
      </div>
    </section>
  );
}
