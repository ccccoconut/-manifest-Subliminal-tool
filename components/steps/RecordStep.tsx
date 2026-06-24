"use client";

import { useEffect, useRef, useState } from "react";
import { VoiceRecorder } from "@/lib/audio/recorder";
import { getAudioDuration } from "@/lib/audio/mixer";
import AudioOrb from "@/components/ui/AudioOrb";
import { AI_VOICES, DISCLAIMER_AI_VOICE, DISCLAIMER_RECORD } from "@/lib/constants";
import type { VoiceTake } from "@/lib/types";

type Status = "idle" | "recording" | "recorded" | "error";
type Mode = "self" | "ai";
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
  const [mode, setMode] = useState<Mode>(
    initialTake?.source === "ai" ? "ai" : "self"
  );
  const [status, setStatus] = useState<Status>(initialTake ? "recorded" : "idle");
  const [take, setTake] = useState<VoiceTake | null>(initialTake);
  const [level, setLevel] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(Boolean(initialTake));
  const [showAll, setShowAll] = useState(false);
  const [aiVoice, setAiVoice] = useState(initialTake?.voiceLabel
    ? AI_VOICES.find((v) => v.label === initialTake.voiceLabel)?.id ?? AI_VOICES[0].id
    : AI_VOICES[0].id);
  const [aiBusy, setAiBusy] = useState(false);
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
    setTake({ ...t, source: "self" });
    setStatus("recorded");
    setLevel(0);
  };

  const generateAi = async () => {
    setError("");
    setAiBusy(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: anchorLine, voice: aiVoice }),
      });
      if (!res.ok) throw new Error("tts failed");
      const blob = await res.blob();
      if (!blob.size) throw new Error("empty audio");
      const durationSec = await getAudioDuration(blob);
      const t: VoiceTake = {
        blob,
        url: URL.createObjectURL(blob),
        durationSec,
        mimeType: blob.type || "audio/mpeg",
        source: "ai",
        voiceLabel: AI_VOICES.find((v) => v.id === aiVoice)?.label,
      };
      setTake(t);
      setStatus("recorded");
    } catch {
      setError("AI 配音生成失败，请重试，或切换为「我的声音」录制。");
      setStatus("error");
    } finally {
      setAiBusy(false);
    }
  };

  const reset = () => {
    // 不在此处 revoke：take 可能已交给 Studio（共享同一对象），由 Studio.restart() 统一释放。
    setTake(null);
    setStatus("idle");
    setElapsed(0);
    setError("");
  };

  const switchMode = (m: Mode) => {
    if (m === mode || aiBusy || status === "recording") return;
    setMode(m);
    reset();
    setConsent(false);
  };

  // AI 配音是干净的合成音，不受最短时长限制；本人录音建议 ≥3 秒。
  const tooShort = mode === "self" && !!take && take.durationSec < MIN_TAKE_SEC;
  const ready = !!take && consent && !tooShort;

  const tabCls = (active: boolean) =>
    `rounded-full px-5 py-2 text-sm font-medium transition-all ${
      active
        ? "bg-[var(--color-aura)] text-white shadow-[0_0_18px_rgba(167,139,250,0.5)]"
        : "text-[var(--color-mist-soft)] hover:text-[var(--color-mist)]"
    }`;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">
          {mode === "ai" ? "为这句心声选一个 AI 声音" : "用自己的声音，读出这句心声"}
        </h2>
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
          {showAll ? "收起" : "展开完整肯定语"}
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

      {/* mode toggle：我的声音 / AI 配音 */}
      <div className="mt-5 flex justify-center">
        <div className="inline-flex rounded-full bg-white/[0.05] p-1 ring-1 ring-white/10">
          <button onClick={() => switchMode("self")} className={tabCls(mode === "self")}>
            🎙 我的声音
          </button>
          <button onClick={() => switchMode("ai")} className={tabCls(mode === "ai")}>
            ✨ AI 配音
          </button>
        </div>
      </div>

      {mode === "self" ? (
        <>
          {/* visualizer：随声波跳动的球状体 */}
          <div className="mt-4 flex justify-center">
            <div className="relative h-52 w-52 sm:h-56 sm:w-56">
              <AudioOrb
                level={level}
                state={
                  status === "recording"
                    ? "recording"
                    : status === "recorded"
                      ? "recorded"
                      : "idle"
                }
              />
            </div>
          </div>

          <div className="text-center text-sm tabular-nums text-[var(--color-haze)]">
            {status === "recording" && (
              <span className="text-[var(--color-glow)]">● 录音中 {elapsed.toFixed(1)}s</span>
            )}
            {status === "recorded" && take && (
              <span>
                已录制 {take.durationSec.toFixed(1)}s · 建议 10–30 秒
                {tooShort && (
                  <span className="text-amber-400">（太短了，再读一遍会更好听）</span>
                )}
              </span>
            )}
          </div>
        </>
      ) : (
        <>
          {/* AI 音色选择 */}
          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {AI_VOICES.map((v) => {
              const active = aiVoice === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setAiVoice(v.id)}
                  disabled={aiBusy}
                  className={`rounded-2xl p-3 text-left transition-all disabled:opacity-60 ${
                    active
                      ? "bg-[var(--color-aura)]/20 ring-2 ring-[var(--color-aura)]"
                      : "bg-white/[0.05] ring-1 ring-white/10 hover:bg-white/[0.08]"
                  }`}
                >
                  <p className="text-sm font-semibold text-[var(--color-mist)]">{v.label}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-[var(--color-haze)]">
                    {v.trait}
                  </p>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-center text-[11px] text-[var(--color-haze)]">
            AI 会用所选音色朗读你的核心心声，生成后可换音色重新生成。
          </p>
        </>
      )}

      {error && <p className="mt-3 text-center text-sm text-rose-400">{error}</p>}

      {status === "recorded" && take && (
        <div className="mt-4">
          {mode === "ai" && take.voiceLabel && (
            <p className="mb-1.5 text-center text-xs text-[var(--color-aura)]">
              AI 配音 · {take.voiceLabel}
            </p>
          )}
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
          {mode === "ai"
            ? `我了解这是 AI 合成的声音。${DISCLAIMER_AI_VOICE}`
            : `我确认本段录音为本人声音，仅用于生成本次音频。${DISCLAIMER_RECORD}`}
        </span>
      </label>

      {/* controls */}
      <div className="mt-6 flex flex-col items-center gap-4">
        {mode === "self" ? (
          status === "idle" || status === "error" ? (
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
            <Actions
              primaryLabel="重录"
              onPrimary={reset}
              ready={ready}
              onNext={() => ready && take && onDone(take)}
              onQuick={
                onQuickGenerate && take
                  ? () => ready && onQuickGenerate(take)
                  : undefined
              }
            />
          )
        ) : status === "recorded" && take ? (
          <Actions
            primaryLabel={aiBusy ? "生成中…" : "重新生成"}
            onPrimary={generateAi}
            primaryDisabled={aiBusy}
            ready={ready}
            onNext={() => ready && take && onDone(take)}
            onQuick={
              onQuickGenerate && take
                ? () => ready && onQuickGenerate(take)
                : undefined
            }
          />
        ) : (
          <button
            onClick={generateAi}
            disabled={aiBusy}
            className="btn-primary rounded-full px-8 py-3.5 text-base disabled:opacity-60"
          >
            {aiBusy ? "AI 配音生成中…" : "✨ 用这个声音生成"}
          </button>
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

function Actions({
  primaryLabel,
  onPrimary,
  primaryDisabled,
  ready,
  onNext,
  onQuick,
}: {
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  ready: boolean;
  onNext: () => void;
  onQuick?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-3">
        <button
          onClick={onPrimary}
          disabled={primaryDisabled}
          className="btn-ghost rounded-full px-6 py-3 text-sm disabled:opacity-50"
        >
          {primaryLabel}
        </button>
        <button
          onClick={onNext}
          disabled={!ready}
          className="btn-primary rounded-full px-7 py-3 text-base disabled:opacity-50"
        >
          下一步：选背景音 →
        </button>
      </div>
      {onQuick && (
        <button
          onClick={onQuick}
          disabled={!ready}
          className="text-sm text-[var(--color-haze)] transition-colors hover:text-[var(--color-mist)] disabled:opacity-40"
        >
          ⚡ 用推荐配乐直接生成（跳过调参）
        </button>
      )}
    </div>
  );
}
