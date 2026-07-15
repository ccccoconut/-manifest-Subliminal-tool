"use client";

import { useEffect, useState } from "react";

/** 仅本机开发可见：localhost / 127.0.0.1，且非生产构建 */
export function isDevSkipEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NODE_ENV === "production") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

export type DevJumpTarget =
  | "input"
  | "affirmation"
  | "record"
  | "background"
  | "mixconsole";

const JUMPS: { target: DevJumpTarget; label: string }[] = [
  { target: "input", label: "输入" },
  { target: "affirmation", label: "肯定语" },
  { target: "record", label: "录音" },
  { target: "background", label: "背景音" },
  { target: "mixconsole", label: "调参" },
];

export default function DevSkipPanel({
  currentStep,
  onJump,
  onSkipCurrent,
}: {
  currentStep: string;
  onJump: (target: DevJumpTarget) => void | Promise<void>;
  onSkipCurrent: () => void | Promise<void>;
}) {
  // 挂载后再判断，避免 SSR / 客户端首屏 HTML 不一致
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("capture") === "1") {
      setEnabled(false);
      return;
    }
    setEnabled(isDevSkipEnabled());
  }, []);

  if (!enabled) return null;

  const run = async (fn: () => void | Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pointer-events-none fixed bottom-[max(5.5rem,env(safe-area-inset-bottom))] left-2 z-[90] max-w-[calc(100vw-1rem)]">
      <div className="pointer-events-auto rounded-2xl border border-amber-400/50 bg-[#1a241c]/92 text-left shadow-xl backdrop-blur-md">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
        >
          <span className="text-[11px] font-semibold tracking-wide text-amber-200">
            测试跳步 · {currentStep}
          </span>
          <span className="text-[10px] text-amber-200/70">{open ? "收起" : "展开"}</span>
        </button>

        {open && (
          <div className="border-t border-white/10 px-2.5 pb-2.5 pt-2">
            <button
              type="button"
              disabled={busy || currentStep === "home" || currentStep === "result"}
              onClick={() => run(onSkipCurrent)}
              className="mb-2 w-full rounded-xl bg-amber-400/90 px-3 py-2 text-xs font-semibold text-[#1a241c] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? "处理中…" : "跳过本步 →"}
            </button>
            <div className="flex flex-wrap gap-1.5">
              {JUMPS.map((j) => (
                <button
                  key={j.target}
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => onJump(j.target))}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors disabled:opacity-40 ${
                    currentStep === j.target
                      ? "bg-amber-300 text-[#1a241c]"
                      : "bg-white/10 text-amber-50 hover:bg-white/16"
                  }`}
                >
                  {j.label}
                </button>
              ))}
            </div>
            <p className="mt-2 px-0.5 text-[9px] leading-snug text-amber-100/55">
              仅 localhost 显示，线上不会出现
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
