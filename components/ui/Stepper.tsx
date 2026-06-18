"use client";

import type { WizardStep } from "@/lib/types";

const STEPS: { key: WizardStep; label: string }[] = [
  { key: "input", label: "写下烦恼" },
  { key: "affirmation", label: "肯定语" },
  { key: "record", label: "录声音" },
  { key: "background", label: "背景音" },
  { key: "mixconsole", label: "调参" },
  { key: "result", label: "音轨" },
];

export default function Stepper({ current }: { current: WizardStep }) {
  const idx = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-3">
      {STEPS.map((s, i) => {
        const active = i === idx;
        const done = i < idx;
        return (
          <div key={s.key} className="flex items-center gap-1.5 sm:gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold transition-all ${
                  active
                    ? "bg-[var(--color-aura)] text-[#0a0a14] shadow-[0_0_18px_rgba(167,139,250,0.6)]"
                    : done
                      ? "bg-[var(--color-aura-deep)]/40 text-[var(--color-mist)]"
                      : "bg-white/5 text-[var(--color-haze)]"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={`hidden text-xs sm:inline ${
                  active ? "text-[var(--color-mist)]" : "text-[var(--color-haze)]"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={`h-px w-4 sm:w-8 ${
                  done ? "bg-[var(--color-aura-deep)]/60" : "bg-white/10"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
