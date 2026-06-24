"use client";

import type { Affirmation, ToneKey } from "@/lib/types";

export default function AffirmationStep({
  affirmation,
  onLinesChange,
  onAnchorChange,
  onRegenerate,
  onNext,
  onBack,
  regenerating,
}: {
  affirmation: Affirmation;
  onLinesChange: (lines: string[]) => void;
  onAnchorChange: (anchor: string) => void;
  onRegenerate: (tone: ToneKey) => void;
  onNext: () => void;
  onBack: () => void;
  regenerating: boolean;
}) {
  const editableText =
    affirmation.lines.length > 0 ? affirmation.lines.join("\n") : affirmation.anchorLine;

  const updateAffirmations = (value: string) => {
    const lines = value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 8);
    onLinesChange(lines);
    onAnchorChange(lines.join(" / ") || value.trim());
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="text-center">
        <h1 className="text-3xl font-bold leading-tight text-[var(--color-mist)] sm:text-5xl">
          这是为你生成的肯定语
        </h1>
      </div>

      <div className="glass mt-7 rounded-[var(--radius-2xl)] p-4 sm:p-5">
        <textarea
          value={editableText}
          onChange={(e) => updateAffirmations(e.target.value)}
          rows={Math.max(5, Math.min(8, affirmation.lines.length || 5))}
          className="w-full resize-none rounded-3xl bg-black/[0.05] p-5 text-xl font-medium leading-relaxed text-[var(--color-mist)] outline-none focus:bg-black/[0.07] sm:text-2xl"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => onRegenerate("default")}
          disabled={regenerating}
          className="btn-ghost rounded-full px-5 py-2.5 text-sm disabled:opacity-50"
        >
          {regenerating ? "优化中…" : "重新优化生成"}
        </button>
        <button
          onClick={() => onRegenerate("gentle")}
          disabled={regenerating}
          className="btn-ghost rounded-full px-5 py-2.5 text-sm disabled:opacity-50"
        >
          更柔和
        </button>
        <button
          onClick={() => onRegenerate("firm")}
          disabled={regenerating}
          className="btn-ghost rounded-full px-5 py-2.5 text-sm disabled:opacity-50"
        >
          更有力量
        </button>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-sm text-[var(--color-haze)] hover:text-[var(--color-mist)]"
        >
          ← 返回修改输入
        </button>
        <button onClick={onNext} className="btn-primary rounded-full px-7 py-3 text-base">
          用我的声音录下它 →
        </button>
      </div>
    </div>
  );
}
