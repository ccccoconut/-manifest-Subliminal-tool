"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AudioPlayer from "@/components/ui/AudioPlayer";
import EmotionRating from "@/components/ui/EmotionRating";
import { DISCLAIMER_SHARE, getSoundscape, RATING_DIMS } from "@/lib/constants";
import type { EmotionScore, Ratings, Track } from "@/lib/types";

type Phase = "before" | "listen" | "after";
const EMPTY: EmotionScore = { tension: 0, confidence: 0 };
const complete = (s: EmotionScore) => s.tension > 0 && s.confidence > 0;

export default function ResultStep({
  track,
  saved,
  onSave,
  onDownloadAudio,
  onDownloadCover,
  onShare,
  onRestart,
  onRatingsChange,
}: {
  track: Track;
  saved: boolean;
  onSave: () => void;
  onDownloadAudio: () => void;
  onDownloadCover: () => void;
  onShare: () => void;
  onRestart: () => void;
  onRatingsChange: (r: Ratings) => void;
}) {
  const accent = getSoundscape(track.params.soundscape).accent;
  const [phase, setPhase] = useState<Phase>("before");
  const [before, setBefore] = useState<EmotionScore>(EMPTY);
  const [after, setAfter] = useState<EmotionScore>(EMPTY);

  const afterDone = complete(after);
  // 一旦记录了「聆听前」就持久化，避免用户跳过「聆听后」时丢失前测数据
  useEffect(() => {
    if (complete(before)) onRatingsChange({ before, after });
  }, [before, after, onRatingsChange]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <p className="text-center text-sm text-[var(--color-aura)]">
        ✨ 你的专属心声调频已生成
      </p>
      <p className="mt-1 text-center text-xs text-[var(--color-haze)]">
        你此刻的情绪，刚刚变成了一首只属于你的音乐
      </p>

      <div className="glass mt-4 grid grid-cols-1 gap-6 rounded-[var(--radius-2xl)] p-6 sm:grid-cols-[300px_1fr] sm:p-7">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto w-full max-w-[300px]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={track.coverDataUrl}
            alt={track.title}
            className="aspect-square w-full rounded-2xl shadow-2xl"
          />
        </motion.div>

        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-[var(--color-mist)]">{track.title}</h2>
          <p className="mt-1 text-sm text-[var(--color-aura)]">
            {getSoundscape(track.params.soundscape).name} · {track.scene} ·{" "}
            {Math.round(track.durationSec)}s
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {track.emotionTags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-black/[0.06] px-2.5 py-1 text-xs text-[var(--color-mist-soft)]"
              >
                {t}
              </span>
            ))}
          </div>

          {/* phase: before listening */}
          {phase === "before" && (
            <div className="mt-5 rounded-2xl border border-black/[0.07] bg-black/[0.04] p-4">
              <p className="text-sm font-medium text-[var(--color-mist)]">
                聆听前，先记录此刻的你
              </p>
              <p className="mb-3 mt-0.5 text-xs text-[var(--color-haze)]">
                听完后我们会再问一次，看看有没有变化。
              </p>
              <EmotionRating value={before} onChange={setBefore} />
              <button
                onClick={() => setPhase("listen")}
                disabled={!complete(before)}
                className="btn-primary mt-4 w-full rounded-full py-2.5 text-sm disabled:opacity-50"
              >
                进入聆听 →
              </button>
            </div>
          )}

          {/* phase: listening */}
          {phase !== "before" && (
            <div className="mt-5">
              <AudioPlayer src={track.audioBlobUrl} accent={accent} />
              {phase === "listen" && (
                <button
                  onClick={() => setPhase("after")}
                  className="btn-ghost mt-4 w-full rounded-full py-2.5 text-sm"
                >
                  我听完了，记录此刻 →
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* phase: after rating */}
      {phase === "after" && !afterDone && (
        <div className="glass mt-5 rounded-2xl p-6">
          <p className="text-sm font-medium text-[var(--color-mist)]">
            听完后，此刻的你——
          </p>
          <div className="mt-3 max-w-md">
            <EmotionRating value={after} onChange={setAfter} />
          </div>
        </div>
      )}

      {/* delta summary */}
      {phase === "after" && afterDone && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass mt-5 rounded-2xl p-6"
        >
          <p className="mb-4 text-sm font-medium text-[var(--color-mist)]">
            这一次聆听，你的变化
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {RATING_DIMS.map((dim) => {
              const b = before[dim.key];
              const a = after[dim.key];
              const diff = a - b;
              const good =
                dim.desired === "down" ? diff < 0 : diff > 0;
              const arrow = diff === 0 ? "→" : diff > 0 ? "↑" : "↓";
              return (
                <div
                  key={dim.key}
                  className="flex items-center justify-between rounded-xl bg-black/[0.05] px-4 py-3"
                >
                  <span className="text-sm text-[var(--color-mist-soft)]">
                    {dim.label}
                  </span>
                  <span className="flex items-center gap-2 text-sm tabular-nums">
                    <span className="text-[var(--color-haze)]">{b}</span>
                    <span
                      className={
                        diff === 0
                          ? "text-[var(--color-haze)]"
                          : good
                            ? "text-emerald-600"
                            : "text-amber-600"
                      }
                    >
                      {arrow}
                    </span>
                    <span className="font-semibold text-[var(--color-mist)]">{a}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* affirmations */}
      <div className="glass mt-5 rounded-2xl p-6">
        <p className="mb-3 text-xs text-[var(--color-haze)]">音轨中的肯定语</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {track.lines.map((l, i) => (
            <p key={i} className="text-sm leading-relaxed text-[var(--color-mist-soft)]">
              <span className="mr-2 text-[var(--color-aura)]/60">
                {String(i + 1).padStart(2, "0")}
              </span>
              {l}
            </p>
          ))}
        </div>
      </div>

      {/* actions */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <button onClick={onDownloadAudio} className="btn-ghost rounded-full px-4 py-2 text-sm">
          下载音频
        </button>
        <button onClick={onDownloadCover} className="btn-ghost rounded-full px-4 py-2 text-sm">
          下载封面
        </button>
        <button onClick={onShare} className="btn-ghost rounded-full px-4 py-2 text-sm">
          分享声景卡片
        </button>
        <button
          onClick={onSave}
          disabled={saved}
          className="btn-ghost rounded-full px-4 py-2 text-sm disabled:opacity-50"
        >
          {saved ? "✓ 已保存" : "保存到我的音轨"}
        </button>
        <button onClick={onRestart} className="btn-primary rounded-full px-5 py-2 text-sm">
          再做一条 →
        </button>
      </div>
      <p className="mx-auto mt-6 max-w-md text-center text-sm leading-relaxed text-[var(--color-mist-soft)]">
        我们不是让 AI 替你写一首歌，
        <br />
        而是帮你把一句「我不行」，变成用你自己声音说出的「<span className="text-gradient font-semibold">我可以</span>」。
      </p>
      <p className="mt-3 text-center text-[11px] text-[var(--color-haze)]">
        {DISCLAIMER_SHARE}
      </p>
    </div>
  );
}
