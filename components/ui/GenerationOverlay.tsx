"use client";

import { motion } from "framer-motion";

const STAGES = [
  {
    title: "正在理解你的状态",
    detail: "把你的原始输入，读成情绪与需要。",
  },
  {
    title: "正在生成肯定语",
    detail: "把它改写为更温和、可复听的第一人称表达。",
  },
  {
    title: "正在混合你的声音和音乐",
    detail: "人声、背景音乐与环境音正在被混成一段声景。",
  },
  {
    title: "正在生成专属封面",
    detail: "为这段心声调频画一张可收藏的封面。",
  },
];

export default function GenerationOverlay({ progress }: { progress: number }) {
  const activeIdx = Math.min(3, Math.floor(progress * 4));

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[var(--color-ink)]/80 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass relative w-full max-w-md rounded-[var(--radius-2xl)] p-7"
      >
        <p className="text-center text-sm text-[var(--color-aura)]">
          正在生成你的心声调频…
        </p>
        <div className="mt-6 space-y-4">
          {STAGES.map((s, i) => {
            const done = i < activeIdx;
            const active = i === activeIdx;
            return (
              <div key={s.title} className="flex gap-3">
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-all ${
                    done
                      ? "bg-[var(--color-aura-deep)]/60 text-[var(--color-mist)]"
                      : active
                        ? "bg-[var(--color-aura)] text-white shadow-[0_0_16px_rgba(167,139,250,0.6)]"
                        : "bg-black/[0.05] text-[var(--color-haze)]"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium transition-colors ${
                      active || done
                        ? "text-[var(--color-mist)]"
                        : "text-[var(--color-haze)]"
                    }`}
                  >
                    {s.title}
                    {active && <span className="ml-1 animate-pulse">…</span>}
                  </p>
                  {active && (
                    <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-mist-soft)]">
                      {s.detail}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-black/[0.07]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--color-aura-deep)] to-[var(--color-glow)] transition-all duration-300"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </motion.div>
    </div>
  );
}
