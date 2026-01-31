"use client";

import { cn } from "@/lib/utils";

const JUDGE_PREFIX = "【法官裁决】";

export interface JudgeReportData {
  raw: string;
  issue?: string;
  winner?: string;
  coreReason?: string;
  score?: string;
  risk?: string;
  bias?: { pro?: number; con?: number };
  changeReason?: string;
}

const parsePercent = (value?: string) => {
  if (!value) return undefined;
  const match = value.match(/(\d{1,3})\s*%/);
  if (!match) return undefined;
  const num = Number(match[1]);
  if (Number.isNaN(num)) return undefined;
  return Math.max(0, Math.min(100, num));
};

export const parseJudgeReport = (text: string): JudgeReportData | null => {
  if (!text.includes(JUDGE_PREFIX)) return null;
  const content = text.replace(JUDGE_PREFIX, "").trim();
  const lines = content
    .split(/\n|；/)
    .map((item) => item.trim())
    .filter(Boolean);

  const getValue = (label: string) => {
    const line = lines.find((item) => item.startsWith(label));
    return line ? line.replace(label, "").trim() : undefined;
  };

  const biasLine = getValue("当前倾向：");
  const proValue = parsePercent(biasLine?.match(/正方[^\d]*(\d{1,3}%)/)?.[1]);
  const conValue = parsePercent(biasLine?.match(/反方[^\d]*(\d{1,3}%)/)?.[1]);

  return {
    raw: content,
    issue: getValue("议题："),
    winner: getValue("胜方："),
    coreReason: getValue("核心理由："),
    score: getValue("详细评分："),
    risk: getValue("风险提示或建议："),
    bias: { pro: proValue, con: conValue },
    changeReason: getValue("本轮变化原因："),
  };
};

interface JudgeReportProps {
  text: string;
  className?: string;
}

export function JudgeReport({ text, className }: JudgeReportProps) {
  const report = parseJudgeReport(text);
  if (!report) return null;

  const pro = report.bias?.pro ?? 50;
  const con = report.bias?.con ?? 50;
  const barTotal = Math.max(1, pro + con);
  const proPercent = Math.round((pro / barTotal) * 100);
  const conPercent = 100 - proPercent;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-5 shadow-[0_12px_30px_-20px_rgba(120,53,15,0.6)]",
        className,
      )}
    >
      <div className="absolute inset-0 opacity-40">
        <div className="pointer-events-none absolute -right-24 -top-20 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-[-4rem] h-40 w-40 rounded-full bg-rose-200/40 blur-3xl" />
      </div>
      <div className="relative flex flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-900 text-amber-50">
              <span className="text-lg">⚖️</span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                Judge Report
              </p>
              <p className="text-lg font-semibold text-amber-950">法官裁决</p>
            </div>
          </div>
          {report.winner ? (
            <span className="rounded-full bg-amber-900 px-3 py-1 text-xs font-semibold text-amber-50">
              胜方：{report.winner}
            </span>
          ) : null}
        </header>

        {report.issue ? (
          <div className="rounded-xl border border-amber-200/60 bg-white/70 p-4">
            <p className="text-xs font-semibold text-amber-700">议题</p>
            <p className="text-sm text-amber-950">{report.issue}</p>
          </div>
        ) : null}

        <div className="rounded-xl border border-amber-200/60 bg-white/70 p-4">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-amber-700">
            <span>天平血条</span>
            <span>
              正方 {proPercent}% · 反方 {conPercent}%
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-amber-100">
            <div className="flex h-full">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                style={{ width: `${proPercent}%` }}
              />
              <div
                className="h-full bg-gradient-to-r from-rose-400 to-rose-500"
                style={{ width: `${conPercent}%` }}
              />
            </div>
          </div>
          {report.changeReason ? (
            <p className="mt-2 text-xs text-amber-800">{report.changeReason}</p>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-amber-200/60 bg-white/70 p-4">
            <p className="text-xs font-semibold text-amber-700">核心理由</p>
            <p className="text-sm text-amber-950">
              {report.coreReason ?? "未提供"}
            </p>
          </div>
          <div className="rounded-xl border border-amber-200/60 bg-white/70 p-4">
            <p className="text-xs font-semibold text-amber-700">详细评分</p>
            <p className="text-sm text-amber-950">
              {report.score ?? "未提供"}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-amber-200/60 bg-white/70 p-4">
          <p className="text-xs font-semibold text-amber-700">风险提示或建议</p>
          <p className="text-sm text-amber-950">
            {report.risk ?? "未提供"}
          </p>
        </div>
      </div>
    </section>
  );
}

export const stripJudgeReport = (text: string) =>
  text.replace(JUDGE_PREFIX, "").trim();

export const hasJudgeReport = (text: string) => text.includes(JUDGE_PREFIX);
