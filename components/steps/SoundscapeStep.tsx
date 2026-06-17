"use client";

import { useEffect, useState } from "react";
import {
  DISTANCE_LABELS,
  getSoundscape,
  MOOD_LABELS,
  RHYTHM_LABELS,
  SOUNDSCAPES,
  VOICE_LEVEL_LABELS,
} from "@/lib/constants";
import { startPreview, stopPreview } from "@/lib/audio/soundscapes";
import type {
  DistanceKey,
  MixParams,
  MoodKey,
  RhythmKey,
  SoundscapeId,
  VoiceLevelKey,
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
                : "bg-white/5 text-[var(--color-mist-soft)] hover:bg-white/10"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SoundscapeStep({
  params,
  onParamsChange,
  onGenerate,
  onBack,
  generating,
}: {
  params: MixParams;
  onParamsChange: (p: MixParams) => void;
  onGenerate: () => void;
  onBack: () => void;
  generating: boolean;
}) {
  const [previewOn, setPreviewOn] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const recipe = getSoundscape(params.soundscape);

  useEffect(() => {
    if (previewOn) {
      setPreviewError("");
      startPreview(params.soundscape, params.mood, params.rhythm).catch(() => {
        setPreviewError("试听启动失败，请检查浏览器的声音/自动播放权限后重试。");
        setPreviewOn(false);
      });
    } else {
      stopPreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewOn, params.soundscape, params.mood, params.rhythm]);

  useEffect(() => () => stopPreview(), []);

  const set = (patch: Partial<MixParams>) => onParamsChange({ ...params, ...patch });

  const handleGenerate = () => {
    stopPreview();
    setPreviewOn(false);
    onGenerate();
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">选一个声景配方</h2>
          <p className="mt-2 text-sm text-[var(--color-mist-soft)]">
            Sound Recipe · 由程序实时合成、零版权风险，结合节奏、音量、声像与环境音设计。
          </p>
        </div>
        <button
          onClick={() => setPreviewOn((v) => !v)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm transition-all ${
            previewOn
              ? "bg-[var(--color-aura)]/25 text-[var(--color-mist)] ring-1 ring-[var(--color-aura)]/50"
              : "btn-ghost"
          }`}
        >
          {previewOn ? "■ 停止试听" : "▶ 试听"}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {SOUNDSCAPES.map((s) => {
          const active = params.soundscape === s.id;
          return (
            <button
              key={s.id}
              onClick={() => set({ soundscape: s.id as SoundscapeId })}
              className={`relative overflow-hidden rounded-2xl p-4 text-left transition-all ${
                active ? "ring-2 ring-[var(--color-aura)]" : "ring-1 ring-white/8"
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

      {/* 当前配方的音乐设计：让技术可见 */}
      <div className="mt-3 rounded-xl bg-white/4 px-4 py-2.5 text-xs text-[var(--color-mist-soft)]">
        <span className="text-[var(--color-aura)]">{recipe.name} · {recipe.en}</span>
        <span className="mx-2 text-[var(--color-haze)]">音乐设计：</span>
        {recipe.design}
      </div>

      {previewError && (
        <p className="mt-2 text-xs text-amber-300">{previewError}</p>
      )}

      <div className="glass mt-4 grid grid-cols-1 gap-5 rounded-2xl p-5 sm:grid-cols-2">
        <Segmented
          label="氛围"
          value={params.mood}
          options={MOOD_LABELS}
          onChange={(v: MoodKey) => set({ mood: v })}
        />
        <Segmented
          label="人声强度"
          value={params.voiceLevel}
          options={VOICE_LEVEL_LABELS}
          onChange={(v: VoiceLevelKey) => set({ voiceLevel: v })}
        />
        <Segmented
          label="声音距离"
          value={params.distance}
          options={DISTANCE_LABELS}
          onChange={(v: DistanceKey) => set({ distance: v })}
        />
        <Segmented
          label="节奏感"
          value={params.rhythm}
          options={RHYTHM_LABELS}
          onChange={(v: RhythmKey) => set({ rhythm: v })}
        />
      </div>

      <div className="mt-7 flex items-center justify-between">
        <button
          onClick={onBack}
          disabled={generating}
          className="text-sm text-[var(--color-haze)] hover:text-[var(--color-mist)] disabled:opacity-40"
        >
          ← 返回重录
        </button>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-primary rounded-full px-8 py-3.5 text-base"
        >
          {generating ? "生成中…" : "生成我的心声调频 ✨"}
        </button>
      </div>
    </div>
  );
}
