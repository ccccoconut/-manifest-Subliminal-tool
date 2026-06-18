"use client";

import { useEffect, useState } from "react";
import { DISTANCE_HINT } from "@/lib/constants";
import { startPreview, stopPreview } from "@/lib/audio/soundscapes";
import type { BgAudio, DistanceKey, MixParams } from "@/lib/types";

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: (v: number) => string;
  disabled?: boolean;
}) {
  return (
    <div className={disabled ? "opacity-40" : ""}>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-[var(--color-mist-soft)]">{label}</span>
        <span className="tabular-nums text-[var(--color-aura)]">{display(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[var(--color-aura)]"
      />
    </div>
  );
}

function Toggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-sm transition-all ${
        on
          ? "bg-[var(--color-aura)]/25 text-[var(--color-mist)] ring-1 ring-[var(--color-aura)]/60"
          : "bg-white/5 text-[var(--color-mist-soft)] hover:bg-white/10"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${on ? "bg-[var(--color-aura)]" : "bg-white/25"}`}
      />
      {label}
    </button>
  );
}

const pct = (v: number) => `${Math.round(v * 100)}%`;
const semi = (v: number) => `${v > 0 ? "+" : ""}${v} 半音`;

export default function MixConsoleStep({
  params,
  onParamsChange,
  bgAudio,
  onGenerate,
  onBack,
  generating,
}: {
  params: MixParams;
  onParamsChange: (p: MixParams) => void;
  bgAudio: BgAudio | null;
  onGenerate: () => void;
  onBack: () => void;
  generating: boolean;
}) {
  const [previewOn, setPreviewOn] = useState(false);
  const set = (patch: Partial<MixParams>) => onParamsChange({ ...params, ...patch });

  const hasBgTrack =
    params.bgSource === "recipe" || (params.bgSource === "upload" && !!bgAudio);
  const canPreviewBg = params.bgSource === "recipe";

  useEffect(() => {
    if (previewOn && canPreviewBg) {
      startPreview(params.soundscape, params.mood, params.rhythm, params.bgPitch).catch(
        () => setPreviewOn(false)
      );
    } else {
      stopPreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewOn, canPreviewBg, params.soundscape, params.mood, params.rhythm, params.bgPitch]);

  useEffect(() => () => stopPreview(), []);

  const handleGenerate = () => {
    stopPreview();
    setPreviewOn(false);
    onGenerate();
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold sm:text-3xl">调参 · 混音台</h2>
        <p className="mt-2 text-sm text-[var(--color-mist-soft)]">
          像调音师一样微调两条音轨。所有参数仅为声音设计，不宣称任何疗效。
        </p>
      </div>

      {/* 音轨 1 · 背景音 */}
      <div className="glass mt-5 rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--color-mist)]">
            音轨 1 · 背景音
          </p>
          {canPreviewBg && (
            <button
              onClick={() => setPreviewOn((v) => !v)}
              className={`rounded-full px-3 py-1 text-xs transition-all ${
                previewOn
                  ? "bg-[var(--color-aura)]/25 text-[var(--color-mist)] ring-1 ring-[var(--color-aura)]/50"
                  : "btn-ghost"
              }`}
            >
              {previewOn ? "■ 停止" : "▶ 试听"}
            </button>
          )}
        </div>
        {hasBgTrack ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Slider
              label="音量"
              value={params.bgVolume}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => set({ bgVolume: v })}
              display={pct}
            />
            <Slider
              label="音调"
              value={params.bgPitch}
              min={-12}
              max={12}
              step={1}
              onChange={(v) => set({ bgPitch: v })}
              display={semi}
            />
          </div>
        ) : (
          <p className="text-xs text-[var(--color-haze)]">
            当前未添加背景音（
            {params.bgSource === "qqmusic" ? "QQ 音乐为演示占位" : "已选择不添加"}
            ），本条为纯人声音轨。
          </p>
        )}
      </div>

      {/* 音轨 2 · 人声 */}
      <div className="glass mt-4 rounded-2xl p-5">
        <p className="mb-3 text-sm font-semibold text-[var(--color-mist)]">
          音轨 2 · 你的声音
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Slider
            label="音量"
            value={params.voiceVolume}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => set({ voiceVolume: v })}
            display={pct}
          />
          <Slider
            label="变速（变速也会改变音高）"
            value={params.voiceSpeed}
            min={1}
            max={10}
            step={0.5}
            onChange={(v) => set({ voiceSpeed: v })}
            display={(v) => `${v.toFixed(1)}x`}
          />
        </div>
        <div className="mt-4">
          <p className="mb-2 text-xs text-[var(--color-haze)]">人声循环次数</p>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => set({ voiceLoops: n })}
                className={`flex-1 rounded-xl py-2 text-sm transition-all ${
                  params.voiceLoops === n
                    ? "bg-[var(--color-aura)]/25 text-[var(--color-mist)] ring-1 ring-[var(--color-aura)]/60"
                    : "bg-white/5 text-[var(--color-mist-soft)] hover:bg-white/10"
                }`}
              >
                {n} 次
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <p className="mb-2 text-xs text-[var(--color-haze)]">空间感（混响）</p>
          <div className="flex gap-1.5">
            {(["near", "mid", "far"] as DistanceKey[]).map((d) => (
              <button
                key={d}
                onClick={() => set({ distance: d })}
                className={`flex-1 rounded-xl py-2 text-xs transition-all ${
                  params.distance === d
                    ? "bg-[var(--color-aura)]/25 text-[var(--color-mist)] ring-1 ring-[var(--color-aura)]/60"
                    : "bg-white/5 text-[var(--color-mist-soft)] hover:bg-white/10"
                }`}
              >
                {DISTANCE_HINT[d]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 其他效果 */}
      <div className="glass mt-4 rounded-2xl p-5">
        <p className="mb-3 text-sm font-semibold text-[var(--color-mist)]">其他效果</p>
        <div className="flex flex-wrap items-center gap-2">
          <Toggle
            label="双耳节拍"
            on={params.binaural}
            onChange={(v) => set({ binaural: v })}
          />
          <Toggle
            label="8D 环绕"
            on={params.effect8d}
            onChange={(v) => set({ effect8d: v })}
          />
        </div>
        {params.binaural && (
          <div className="mt-4 max-w-xs">
            <Slider
              label="双耳节拍频率"
              value={params.binauralHz}
              min={2}
              max={14}
              step={1}
              onChange={(v) => set({ binauralHz: v })}
              display={(v) => `${v} Hz`}
            />
          </div>
        )}
      </div>

      <div className="mt-7 flex items-center justify-between">
        <button
          onClick={onBack}
          disabled={generating}
          className="text-sm text-[var(--color-haze)] hover:text-[var(--color-mist)] disabled:opacity-40"
        >
          ← 返回背景音
        </button>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-primary rounded-full px-8 py-3.5 text-base"
        >
          {generating ? "生成中…" : "合成我的心声调频 ✨"}
        </button>
      </div>
    </div>
  );
}
