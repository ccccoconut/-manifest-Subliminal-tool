"use client";

import { RATING_DIMS } from "@/lib/constants";
import type { EmotionScore } from "@/lib/types";

export default function EmotionRating({
  value,
  onChange,
}: {
  value: EmotionScore;
  onChange: (v: EmotionScore) => void;
}) {
  return (
    <div className="space-y-4">
      {RATING_DIMS.map((dim) => {
        const v = value[dim.key];
        return (
          <div key={dim.key}>
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-[var(--color-mist-soft)]">{dim.label}</span>
              <span className="text-[var(--color-haze)]">
                {dim.lowLabel} — {dim.highLabel}
              </span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => onChange({ ...value, [dim.key]: n })}
                  className={`h-10 flex-1 rounded-xl text-sm font-medium transition-all ${
                    v === n
                      ? "bg-[var(--color-aura)] text-white shadow-[0_0_16px_rgba(167,139,250,0.5)]"
                      : "bg-black/[0.05] text-[var(--color-mist-soft)] hover:bg-black/[0.08]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
