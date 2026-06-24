"use client";

import { useEffect, useRef, useState } from "react";
import {
  BASE_HZ_OPTIONS,
  BG_SOURCES,
  getSoundscape,
  MOOD_LABELS,
  QQ_DEMO_TRACKS,
  RHYTHM_LABELS,
  SOUNDSCAPES,
} from "@/lib/constants";
import { startPreview, stopPreview } from "@/lib/audio/soundscapes";
import { getAudioDuration } from "@/lib/audio/mixer";
import { BgIcon } from "@/components/ui/icons";
import type {
  BgAudio,
  BgSource,
  MixParams,
  MoodKey,
  RhythmKey,
  SoundscapeId,
} from "@/lib/types";

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Record<string, string>;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs text-[var(--color-haze)]">{label}</p>
      <div className="flex gap-1.5">
        {Object.entries(options).map(([k, v]) => (
          <button
            key={k}
            onClick={() => onChange(k as T)}
            className={`flex-1 rounded-xl px-2 py-2 text-sm transition-all ${
              value === k
                ? "bg-[var(--color-aura)]/25 text-[var(--color-mist)] ring-1 ring-[var(--color-aura)]/60"
                : "bg-white/[0.05] text-[var(--color-mist-soft)] hover:bg-white/[0.07]"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function BackgroundStep({
  params,
  onParamsChange,
  bgAudio,
  onBgAudioChange,
  onNext,
  onBack,
}: {
  params: MixParams;
  onParamsChange: (p: MixParams) => void;
  bgAudio: BgAudio | null;
  onBgAudioChange: (a: BgAudio | null) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [previewOn, setPreviewOn] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [qqPick, setQqPick] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recipe = getSoundscape(params.soundscape);

  useEffect(() => {
    if (previewOn && params.bgSource === "recipe") {
      setPreviewError("");
      startPreview(params.soundscape, params.mood, params.rhythm).catch(() => {
        setPreviewError("试听启动失败，请检查浏览器的声音/自动播放权限后重试。");
        setPreviewOn(false);
      });
    } else {
      stopPreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewOn, params.bgSource, params.soundscape, params.mood, params.rhythm]);

  useEffect(() => () => stopPreview(), []);

  const set = (patch: Partial<MixParams>) => onParamsChange({ ...params, ...patch });

  const chooseSource = (s: BgSource) => {
    stopPreview();
    setPreviewOn(false);
    set({ bgSource: s });
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (bgAudio?.url) URL.revokeObjectURL(bgAudio.url);
    const durationSec = await getAudioDuration(f);
    onBgAudioChange({
      blob: f,
      name: f.name,
      url: URL.createObjectURL(f),
      source: "upload",
      durationSec,
    });
  };

  const nextDisabled = params.bgSource === "upload" && !bgAudio;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold sm:text-3xl">为你的声音选一段背景音</h2>
      </div>

      {/* 背景音来源 */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {BG_SOURCES.map((s) => {
          const active = params.bgSource === s.key;
          return (
            <button
              key={s.key}
              onClick={() => chooseSource(s.key)}
              className={`rounded-2xl p-3.5 text-left transition-all ${
                active
                  ? "bg-[var(--color-aura)]/20 ring-2 ring-[var(--color-aura)]"
                  : "bg-white/[0.05] ring-1 ring-white/[0.06] hover:bg-white/[0.07]"
              }`}
            >
              <BgIcon source={s.key} className="h-5 w-5 text-[var(--color-mist)]" />
              <p className="mt-1.5 text-sm font-semibold text-[var(--color-mist)]">
                {s.label}
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-[var(--color-haze)]">
                {s.hint}
              </p>
            </button>
          );
        })}
      </div>

      {/* ---- recipe ---- */}
      {params.bgSource === "recipe" && (
        <div className="mt-5">
          <div className="mb-3 flex items-center justify-end">
            <button
              onClick={() => setPreviewOn((v) => !v)}
              className={`rounded-full px-4 py-1.5 text-sm transition-all ${
                previewOn
                  ? "bg-[var(--color-aura)]/25 text-[var(--color-mist)] ring-1 ring-[var(--color-aura)]/50"
                  : "btn-ghost"
              }`}
            >
              {previewOn ? "■ 停止试听" : "▶ 试听"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SOUNDSCAPES.map((s) => {
              const active = params.soundscape === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => set({ soundscape: s.id as SoundscapeId })}
                  className={`relative overflow-hidden rounded-2xl p-4 text-left transition-all ${
                    active ? "ring-2 ring-[var(--color-aura)]" : "ring-1 ring-white/[0.06]"
                  }`}
                  style={{
                    background: `linear-gradient(150deg, ${s.palette[0]}, ${s.palette[1]} 60%, ${s.palette[2]})`,
                  }}
                >
                  <div
                    className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-40 blur-xl"
                    style={{ background: s.accent }}
                  />
                  <p className="relative text-base font-semibold text-white">
                    {s.name}
                    <span className="ml-1.5 text-[10px] font-normal uppercase tracking-wider text-white/70">
                      {s.en}
                    </span>
                  </p>
                  <p className="relative mt-1 text-[11px] text-white/75">{s.scene}</p>
                </button>
              );
            })}
          </div>
          <div className="mt-3 rounded-xl bg-white/[0.04] px-4 py-2.5 text-xs text-[var(--color-mist-soft)]">
            <span className="text-[var(--color-aura)]">{recipe.name} · {recipe.en}</span>
            <span className="mx-2 text-[var(--color-haze)]">音乐设计：</span>
            {recipe.design}
          </div>
          {previewError && <p className="mt-2 text-xs text-amber-400">{previewError}</p>}
          <div className="glass mt-3 grid grid-cols-1 gap-5 rounded-2xl p-5 sm:grid-cols-2">
            <Segmented
              label="氛围"
              value={params.mood}
              options={MOOD_LABELS}
              onChange={(v: MoodKey) => set({ mood: v })}
            />
            <Segmented
              label="节奏感"
              value={params.rhythm}
              options={RHYTHM_LABELS}
              onChange={(v: RhythmKey) => set({ rhythm: v })}
            />
          </div>

          {/* 赫兹基准频率 */}
          <div className="mt-3">
            <p className="mb-2 text-xs text-[var(--color-haze)]">赫兹基准频率（纯音乐调音）</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {BASE_HZ_OPTIONS.map((o) => {
                const active = params.baseHz === o.hz;
                return (
                  <button
                    key={o.hz}
                    onClick={() => set({ baseHz: o.hz })}
                    className={`rounded-xl p-2.5 text-left transition-all ${
                      active
                        ? "bg-[var(--color-aura)]/20 ring-1 ring-[var(--color-aura)]/60"
                        : "bg-white/[0.05] hover:bg-white/[0.07]"
                    }`}
                  >
                    <span className="text-sm font-semibold text-[var(--color-mist)]">
                      {o.label}
                    </span>
                    <span className="mt-0.5 block text-[10px] leading-snug text-[var(--color-haze)]">
                      {o.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ---- upload ---- */}
      {params.bgSource === "upload" && (
        <div className="glass mt-5 rounded-2xl p-6 text-center">
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            onChange={onFile}
            className="hidden"
          />
          {bgAudio ? (
            <div>
              <p className="text-sm text-[var(--color-mist)]">已选择：{bgAudio.name}</p>
              <audio src={bgAudio.url} controls className="mx-auto mt-3 w-full max-w-md" />
              <button
                onClick={() => fileRef.current?.click()}
                className="btn-ghost mt-3 rounded-full px-4 py-2 text-sm"
              >
                换一个文件
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="btn-primary rounded-full px-6 py-3 text-sm"
            >
              选择本地音频文件
            </button>
          )}
          <p className="mt-3 text-[11px] text-[var(--color-haze)]">
            请确认你拥有该音频的使用权；仅在本设备本地用于生成本次音轨。
          </p>
        </div>
      )}

      {/* ---- qqmusic shell ---- */}
      {params.bgSource === "qqmusic" && (
        <div className="glass mt-5 rounded-2xl p-5">
          <input
            disabled
            placeholder="搜索 QQ 音乐曲库（演示占位）"
            className="w-full rounded-xl bg-white/[0.05] px-4 py-2.5 text-sm text-[var(--color-mist-soft)] outline-none placeholder:text-[var(--color-haze)]"
          />
          <div className="mt-3 space-y-1.5">
            {QQ_DEMO_TRACKS.map((t, i) => (
              <button
                key={t.title}
                onClick={() => setQqPick(i)}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left transition-all ${
                  qqPick === i ? "bg-[var(--color-aura)]/20 ring-1 ring-[var(--color-aura)]/50" : "bg-white/[0.04] hover:bg-white/[0.06]"
                }`}
              >
                <span className="text-sm text-[var(--color-mist)]">
                  {t.title} <span className="text-[var(--color-haze)]">· {t.artist}</span>
                </span>
                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-[var(--color-mist-soft)]">
                  {t.tag}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-amber-400/80">
            QQ 音乐授权曲库为演示占位，正式版将打通版权混音；本次 demo 将以纯人声合成。
          </p>
        </div>
      )}

      {/* ---- none ---- */}
      {params.bgSource === "none" && (
        <div className="glass mt-5 rounded-2xl p-6 text-center text-sm text-[var(--color-mist-soft)]">
          只保留你的声音，不添加任何背景音。
        </div>
      )}

      <div className="mt-7 flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-sm text-[var(--color-haze)] hover:text-[var(--color-mist)]"
        >
          ← 返回重录
        </button>
        <button
          onClick={() => {
            stopPreview();
            onNext();
          }}
          disabled={nextDisabled}
          className="btn-primary rounded-full px-8 py-3.5 text-base disabled:opacity-50"
        >
          下一步：调参 →
        </button>
      </div>
    </div>
  );
}
