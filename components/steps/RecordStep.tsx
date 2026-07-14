"use client";

import { useEffect, useRef, useState } from "react";
import { VoiceRecorder } from "@/lib/audio/recorder";
import { DISCLAIMER_RECORD } from "@/lib/constants";
import type { VoiceTake } from "@/lib/types";
import VoiceOrb from "@/components/ui/VoiceOrb";

type Status = "idle" | "recording" | "recorded" | "error";
const MIN_TAKE_SEC = 3;

export default function RecordStep({
  anchorLine,
  lines,
  initialTake,
  onDone,
}: {
  anchorLine: string;
  lines: string[];
  initialTake: VoiceTake | null;
  onDone: (take: VoiceTake) => void;
}) {
  const [status, setStatus] = useState<Status>(initialTake ? "recorded" : "idle");
  const [take, setTake] = useState<VoiceTake | null>(initialTake);
  const [level, setLevel] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(Boolean(initialTake));
  const recRef = useRef<VoiceRecorder | null>(null);
  const rafRef = useRef<number>(0);

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

  const recording = status === "recording";
  const affirmations = lines.length ? lines : [anchorLine];

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-2xl flex-col">
      <h2 className="shrink-0 text-center text-base font-bold leading-snug text-[var(--color-mist)] sm:text-lg">
        用自己的声音，坚定地读出肯定语
      </h2>

      {/* Affirmations: fixed short card, scroll inside */}
      <div className="glass mt-3 flex min-h-[7rem] flex-1 flex-col overflow-hidden rounded-2xl">
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-3 text-left">
          {affirmations.map((line, i) => (
            <li
              key={`${line}-${i}`}
              className="rounded-xl bg-black/[0.04] px-3 py-2.5 text-sm font-medium leading-relaxed text-[var(--color-mist)] sm:text-[0.95rem]"
            >
              {line}
            </li>
          ))}
        </ul>
      </div>

      {/* Controls stay on the same screen — no page scroll needed */}
      <div className="mt-3 flex shrink-0 flex-col items-center gap-2 pb-1">
        <VoiceOrb level={level} active={recording} compact />

        <div className="min-h-[1.1rem] text-center text-xs tabular-nums text-[var(--color-haze)]">
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
        </div>

        {error && <p className="text-center text-xs text-rose-600">{error}</p>}

        {status === "recorded" && take && (
          <audio src={take.url} controls className="mx-auto h-9 w-full max-w-md" />
        )}

        <label className="flex max-w-md items-start gap-2 text-[11px] leading-snug text-[var(--color-mist-soft)]">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[var(--color-aura)]"
          />
          <span className="text-left">{DISCLAIMER_RECORD}</span>
        </label>

        <div className="flex w-full flex-col items-center pt-1">
          {status === "idle" || status === "error" ? (
            <button onClick={start} className="btn-primary rounded-full px-8 py-3 text-sm">
              {status === "error" ? "允许麦克风后 · 重新尝试" : "开始录音"}
            </button>
          ) : status === "recording" ? (
            <button
              onClick={stop}
              className="flex items-center gap-2 rounded-full bg-rose-500/90 px-8 py-3 text-sm font-semibold text-white transition-transform hover:scale-105"
            >
              <span className="h-3 w-3 rounded-sm bg-white" /> 停止录音
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={reRecord} className="btn-ghost rounded-full px-5 py-2.5 text-sm">
                重录
              </button>
              <button
                onClick={() =>
                  take && consent && take.durationSec >= MIN_TAKE_SEC && onDone(take)
                }
                disabled={!consent || !take || take.durationSec < MIN_TAKE_SEC}
                className="btn-primary rounded-full px-6 py-2.5 text-sm disabled:opacity-50"
              >
                下一步：选背景音 →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
