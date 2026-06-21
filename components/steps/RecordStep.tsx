"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { VoiceRecorder } from "@/lib/audio/recorder";
import { DISCLAIMER_RECORD } from "@/lib/constants";
import type { VoiceTake } from "@/lib/types";

type Status = "idle" | "recording" | "recorded" | "error";
const BAR_COUNT = 28;
const MIN_TAKE_SEC = 3;

export default function RecordStep({
  anchorLine,
  lines,
  initialTake,
  onDone,
  onQuickGenerate,
  onBack,
}: {
  anchorLine: string;
  lines: string[];
  initialTake: VoiceTake | null;
  onDone: (take: VoiceTake) => void;
  onQuickGenerate?: (take: VoiceTake) => void;
  onBack: () => void;
}) {
  const [status, setStatus] = useState<Status>(initialTake ? "recorded" : "idle");
  const [take, setTake] = useState<VoiceTake | null>(initialTake);
  const [level, setLevel] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(Boolean(initialTake));
  const [showAll, setShowAll] = useState(false);
  const recRef = useRef<VoiceRecorder | null>(null);
  const rafRef = useRef<number>(0);

  const offsets = useMemo(
    () => Array.from({ length: BAR_COUNT }, () => 0.35 + Math.random() * 0.65),
    []
  );

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      recRef.current?.cancel();
    };
  }, []);

  const tick = () => {
    const r = recRef.current;
    if (!r) return;
    setLevel(r.getLevel());
    setElapsed(r.elapsedSec());
    rafRef.current = requestAnimationFrame(tick);
  };

  const start = async () => {
    setError("");
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError("当前浏览器不支持录音，请使用最新版 Chrome / Safari，并通过 https 或 localhost 访问。");
      setStatus("error");
      return;
    }
    try {
      const r = new VoiceRecorder();
      await r.start();
      recRef.current = r;
      setStatus("recording");
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setError("无法访问麦克风。请在浏览器允许麦克风权限后重试。");
      setStatus("error");
    }
  };

  const stop = async () => {
    cancelAnimationFrame(rafRef.current);
    const r = recRef.current;
    if (!r) return;
    const t = await r.stop();
    recRef.current = null;
    setTake(t);
    setStatus("recorded");
    setLevel(0);
  };

  const reRecord = () => {
    // 不在此处 revoke：take 可能已交给 Studio（共享同一对象），revoke 会让其 audio src 失效。
    // 该录音的 blobURL 由 Studio 的 restart() 统一释放。
    setTake(null);
    setStatus("idle");
    setElapsed(0);
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">用自己的声音，读出这句心声</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--color-mist-soft)]">
          它会成为这段声景里的核心。慢慢读，停顿也没关系；想读更多，可以展开完整肯定语。
        </p>
      </div>

      {/* anchor line 大字 */}
      <div className="glass mt-6 rounded-2xl p-6 text-center">
        <p className="mb-2 text-[11px] tracking-wide text-[var(--color-aura)]">核心心声</p>
        <p className="text-xl font-semibold leading-relaxed text-[var(--color-mist)] sm:text-2xl">
          “{anchorLine}”
        </p>
        <button
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 text-xs text-[var(--color-haze)] underline-offset-2 hover:text-[var(--color-mist)] hover:underline"
        >
          {showAll ? "收起" : "展开完整肯定语（可多读几句）"}
        </button>
        {showAll && (
          <ul className="mt-3 space-y-1.5 text-left">
            {lines.map((l, i) => (
              <li key={i} className="text-sm leading-relaxed text-[var(--color-mist-soft)]">
                <span className="mr-2 text-[var(--color-aura)]/60">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {l}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* visualizer */}
      <div className="mt-6 flex h-20 items-center justify-center gap-[3px]">
        {offsets.map((o, i) => {
          const h =
            status === "recording"
              ? 8 + level * 60 * o * (0.7 + 0.3 * Math.sin((i / BAR_COUNT) * Math.PI))
              : status === "recorded"
                ? 10 + 22 * o
                : 6;
          return (
            <span
              key={i}
              className="w-1.5 rounded-full transition-[height] duration-75"
              style={{
                height: `${Math.max(4, h)}px`,
                background:
                  status === "recording"
                    ? "linear-gradient(180deg,#f0abfc,#a78bfa)"
                    : "rgba(139,92,246,0.25)",
              }}
            />
          );
        })}
      </div>

      <div className="text-center text-sm tabular-nums text-[var(--color-haze)]">
        {status === "recording" && (
          <span className="text-[var(--color-glow)]">● 录音中 {elapsed.toFixed(1)}s</span>
        )}
        {status === "recorded" && take && (
          <span>
            已录制 {take.durationSec.toFixed(1)}s · 建议 10–30 秒
            {take.durationSec < MIN_TAKE_SEC && (
              <span className="text-amber-600">（太短了，再读一遍会更好听）</span>
            )}
          </span>
        )}
        {status === "idle" && <span>点击下方按钮开始录音</span>}
      </div>

      {error && <p className="mt-3 text-center text-sm text-rose-600">{error}</p>}

      {status === "recorded" && take && (
        <div className="mt-4">
          <audio src={take.url} controls className="mx-auto w-full max-w-md" />
        </div>
      )}

      {/* consent */}
      <label className="mt-5 flex items-start justify-center gap-2 text-xs text-[var(--color-mist-soft)]">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[var(--color-aura)]"
        />
        <span className="max-w-md text-left">
          我确认本段录音为本人声音，仅用于生成本次音频。{DISCLAIMER_RECORD}
        </span>
      </label>

      {/* controls */}
      <div className="mt-6 flex flex-col items-center gap-4">
        {status === "idle" || status === "error" ? (
          <button onClick={start} className="btn-primary rounded-full px-8 py-3.5 text-base">
            {status === "error" ? "允许麦克风后 · 重新尝试" : "开始录音"}
          </button>
        ) : status === "recording" ? (
          <button
            onClick={stop}
            className="flex items-center gap-2 rounded-full bg-rose-500/90 px-8 py-3.5 text-base font-semibold text-white transition-transform hover:scale-105"
          >
            <span className="h-3 w-3 rounded-sm bg-white" /> 停止录音
          </button>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <button onClick={reRecord} className="btn-ghost rounded-full px-6 py-3 text-sm">
                重录
              </button>
              <button
                onClick={() =>
                  take && consent && take.durationSec >= MIN_TAKE_SEC && onDone(take)
                }
                disabled={!consent || !take || take.durationSec < MIN_TAKE_SEC}
                className="btn-primary rounded-full px-7 py-3 text-base disabled:opacity-50"
              >
                下一步：选背景音 →
              </button>
            </div>
            {onQuickGenerate && (
              <button
                onClick={() =>
                  take &&
                  consent &&
                  take.durationSec >= MIN_TAKE_SEC &&
                  onQuickGenerate(take)
                }
                disabled={!consent || !take || take.durationSec < MIN_TAKE_SEC}
                className="text-sm text-[var(--color-haze)] transition-colors hover:text-[var(--color-mist)] disabled:opacity-40"
              >
                ⚡ 用推荐配乐直接生成（跳过调参）
              </button>
            )}
          </div>
        )}
        <button
          onClick={onBack}
          className="text-sm text-[var(--color-haze)] hover:text-[var(--color-mist)]"
        >
          ← 返回修改肯定语
        </button>
      </div>
    </div>
  );
}
