"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
  const [editing, setEditing] = useState(false);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="glass rounded-[var(--radius-2xl)] p-6 sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-mist)] sm:text-3xl">
              {affirmation.title}
            </h2>
            <p className="mt-1.5 text-sm text-[var(--color-aura)]">
              适合场景 · {affirmation.scene}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-[var(--color-haze)]">
            {affirmation.source === "deepseek" ? "AI 生成" : "本地生成"}
          </span>
        </div>

        {/* AI 理解 + 策略卡片：展示产品深度 */}
        <div className="mt-5 rounded-2xl border border-[var(--color-aura)]/20 bg-[var(--color-aura)]/8 p-4">
          <p className="text-xs font-medium text-[var(--color-aura)]">
            AI 理解到你现在的状态
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-mist)]">
            {affirmation.understanding}
          </p>
          <p className="mt-3 text-xs text-[var(--color-mist-soft)]">
            这段音频会从这几个方向生成：
            <span className="ml-1 inline-flex flex-wrap gap-1.5 align-middle">
              {affirmation.strategy.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-white/8 px-2 py-0.5 text-[11px] text-[var(--color-mist)]"
                >
                  {s}
                </span>
              ))}
            </span>
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {affirmation.emotionTags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-white/6 px-3 py-1 text-xs text-[var(--color-mist-soft)]"
            >
              {t}
            </span>
          ))}
        </div>

        {/* 核心心声 */}
        <div className="mt-5 rounded-2xl bg-gradient-to-br from-[var(--color-aura-deep)]/25 to-[var(--color-glow)]/15 p-4">
          <p className="text-[11px] tracking-wide text-[var(--color-aura)]">核心心声 · 待会儿由你读出</p>
          {editing ? (
            <input
              value={affirmation.anchorLine}
              onChange={(e) => onAnchorChange(e.target.value)}
              className="mt-1.5 w-full rounded-lg bg-white/10 px-3 py-2 text-lg font-medium text-[var(--color-mist)] outline-none"
            />
          ) : (
            <p className="mt-1.5 text-lg font-semibold leading-relaxed text-[var(--color-mist)]">
              “{affirmation.anchorLine}”
            </p>
          )}
        </div>

        <div className="mt-5 space-y-2.5">
          <p className="text-xs text-[var(--color-haze)]">完整肯定语</p>
          {affirmation.lines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-start gap-3"
            >
              <span className="mt-1 text-sm font-semibold text-[var(--color-aura)]/70">
                {String(i + 1).padStart(2, "0")}
              </span>
              {editing ? (
                <input
                  value={line}
                  onChange={(e) => {
                    const next = [...affirmation.lines];
                    next[i] = e.target.value;
                    onLinesChange(next);
                  }}
                  className="flex-1 rounded-lg bg-white/5 px-3 py-1.5 text-base text-[var(--color-mist)] outline-none focus:bg-white/10"
                />
              ) : (
                <p className="flex-1 text-base leading-relaxed text-[var(--color-mist)]">
                  {line}
                </p>
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/8 pt-5">
          <button
            onClick={() => onRegenerate("default")}
            disabled={regenerating}
            className="btn-ghost rounded-full px-4 py-2 text-sm disabled:opacity-50"
          >
            {regenerating ? "生成中…" : "重新生成"}
          </button>
          <button
            onClick={() => onRegenerate("gentle")}
            disabled={regenerating}
            className="btn-ghost rounded-full px-4 py-2 text-sm disabled:opacity-50"
          >
            改温柔一点
          </button>
          <button
            onClick={() => onRegenerate("firm")}
            disabled={regenerating}
            className="btn-ghost rounded-full px-4 py-2 text-sm disabled:opacity-50"
          >
            改坚定一点
          </button>
          <button
            onClick={() => setEditing((e) => !e)}
            className="btn-ghost rounded-full px-4 py-2 text-sm"
          >
            {editing ? "完成编辑" : "编辑文字"}
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-sm text-[var(--color-haze)] hover:text-[var(--color-mist)]"
        >
          ← 返回
        </button>
        <button onClick={onNext} className="btn-primary rounded-full px-7 py-3 text-base">
          用我的声音录下它 →
        </button>
      </div>
    </div>
  );
}
