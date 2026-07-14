"use client";

import { useEffect, useRef, useState } from "react";
import type { Affirmation, ToneKey } from "@/lib/types";

export default function AffirmationStep({
  affirmation,
  onLinesChange,
  onRegenerate,
  onNext,
  regenerating,
}: {
  affirmation: Affirmation;
  onLinesChange: (lines: string[]) => void;
  onRegenerate: (tone: ToneKey) => void;
  onNext: () => void;
  regenerating: boolean;
}) {
  const initialText =
    affirmation.lines.length > 0 ? affirmation.lines.join("\n") : affirmation.anchorLine;

  // 本地草稿：输入过程中保留空行；不因父组件回写而打断编辑
  const [draft, setDraft] = useState(initialText);
  const wasRegenerating = useRef(regenerating);

  // 仅在「重新生成」结束时，用新结果覆盖草稿
  useEffect(() => {
    if (wasRegenerating.current && !regenerating) {
      setDraft(
        affirmation.lines.length > 0
          ? affirmation.lines.join("\n")
          : affirmation.anchorLine
      );
    }
    wasRegenerating.current = regenerating;
  }, [regenerating, affirmation.lines, affirmation.anchorLine]);

  const onEdit = (value: string) => {
    setDraft(value);
    const lines = value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 10);
    onLinesChange(lines);
  };

  const canProceed = draft
    .split("\n")
    .map((l) => l.trim())
    .some(Boolean);

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div className="text-center">
        <h1 className="text-xl font-bold leading-snug text-[var(--color-mist)] sm:text-2xl">
          这是为你生成的肯定语
        </h1>
        <p className="mt-2 text-sm text-[var(--color-haze)]">
          可直接编辑、删除或补充内容，每行一句
        </p>
      </div>

      <div className="glass mt-5 rounded-[var(--radius-2xl)] p-4 sm:p-5">
        <textarea
          value={draft}
          onChange={(e) => onEdit(e.target.value)}
          rows={Math.max(6, Math.min(12, draft.split("\n").length + 1))}
          placeholder="在这里编辑肯定语，每行一句…"
          className="relative z-10 w-full resize-y rounded-3xl bg-black/[0.05] p-4 text-base font-medium leading-relaxed text-[var(--color-mist)] outline-none focus:bg-black/[0.07] sm:p-5 sm:text-lg"
        />
      </div>

      <div className="mt-5 flex items-center justify-center">
        <button
          onClick={() => onRegenerate("default")}
          disabled={regenerating}
          className="btn-ghost rounded-full px-5 py-2.5 text-sm disabled:opacity-50"
        >
          {regenerating ? "生成中…" : "重新生成"}
        </button>
      </div>

      <div className="mt-8 flex items-center justify-end">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="btn-primary rounded-full px-7 py-3 text-base disabled:opacity-50"
        >
          用我的声音录下它 →
        </button>
      </div>
    </div>
  );
}
