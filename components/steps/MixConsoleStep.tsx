"use client";

import { useEffect, useRef, useState } from "react";
import { renderMix } from "@/lib/audio/mixer";
import type { BgAudio, MixParams } from "@/lib/types";

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
          : "bg-white/[0.05] text-[var(--color-mist-soft)] hover:bg-white/[0.07]"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${on ? "bg-[var(--color-aura)]" : "bg-white/20"}`}
      />
      {label}
    </button>
  );
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

type Preview = "idle" | "rendering" | "playing";

export default function MixConsoleStep({
  params,
  onParamsChange,
  voiceBlob,
  bgAudio,
  onGenerate,
  onBack,
  generating,
}: {
  params: MixParams;
  onParamsChange: (p: MixParams) => void;
  voiceBlob: Blob;
  bgAudio: BgAudio | null;
  onGenerate: () => void;
  onBack: () => void;
  generating: boolean;
}) {
  const [preview, setPreview] = useState<Preview>("idle");
  const ctxRef = useRef<AudioContext | null>(null);
  const srcRef = useRef<AudioBufferSourceNode | null>(null);
  const genRef = useRef(0); // 自增令牌：作废在途的离线渲染
  const mountedRef = useRef(true);
  const set = (patch: Partial<MixParams>) => onParamsChange({ ...params, ...patch });

  const stopPreview = () => {
    genRef.current++;
    try {
      srcRef.current?.stop();
    } catch {
      /* already stopped */
    }
    srcRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    if (mountedRef.current) setPreview("idle");
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopPreview();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fullPreview = async () => {
    if (preview === "playing" || preview === "rendering") {
      stopPreview();
      return;
    }
    const myGen = ++genRef.current;
    setPreview("rendering");
    let buffer: AudioBuffer;
    try {
      ({ buffer } = await renderMix({
        voiceBlob,
        params,
        bgBlob: bgAudio?.blob ?? null,
        previewSeconds: 8,
      }));
    } catch {
      if (mountedRef.current && genRef.current === myGen) setPreview("idle");
      return;
    }
    // 渲染期间被取消（再次点击/卸载/点了生成）→ 丢弃结果，不创建 AudioContext
    if (!mountedRef.current || genRef.current !== myGen) return;
    const ctx = new AudioContext();
    if (ctx.state === "suspended") await ctx.resume();
    if (!mountedRef.current || genRef.current !== myGen) {
      ctx.close().catch(() => {});
      return;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.onended = () => {
      if (srcRef.current === src) stopPreview();
    };
    ctxRef.current = ctx;
    srcRef.current = src;
    src.start();
    setPreview("playing");
  };

  const handleGenerate = () => {
    stopPreview();
    onGenerate();
  };

  const hasBg =
    params.bgSource === "recipe" || (params.bgSource === "upload" && !!bgAudio);
  const bgDur = bgAudio?.durationSec ?? 0;
  const durationHint =
    params.bgSource === "upload" && bgDur > 0
      ? params.totalDuration < Math.floor(bgDur)
        ? "合成音频时长小于原音频时长，将自动截断。"
        : params.totalDuration > Math.ceil(bgDur)
          ? "合成音频时长超过原音频时长，将自动循环铺满。"
          : ""
      : "";

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">调参 · 混音台</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-mist-soft)]">
            <span className="font-medium text-[var(--color-aura)]">潜听模式</span>
            ：你的声音以极低音量循环铺在背景音之下，几乎听不清内容——像一层只属于你的轻声陪伴。
          </p>
        </div>
        <button
          onClick={fullPreview}
          disabled={generating}
          className={`shrink-0 rounded-full px-4 py-2 text-sm transition-all disabled:opacity-50 ${
            preview === "playing"
              ? "bg-[var(--color-aura)]/25 text-[var(--color-mist)] ring-1 ring-[var(--color-aura)]/50"
              : "btn-ghost"
          }`}
        >
          {preview === "rendering"
            ? "合成预览中…"
            : preview === "playing"
              ? "■ 停止试听"
              : "▶ 全曲试听"}
        </button>
      </div>

      {/* 背景音素材设置 */}
      <div className="glass mt-4 rounded-2xl p-5">
        <p className="mb-3 text-sm font-semibold text-[var(--color-mist)]">
          背景音素材设置
        </p>
        {hasBg ? (
          <Slider
            label="音量"
            value={params.bgVolume}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => set({ bgVolume: v })}
            display={pct}
          />
        ) : (
          <p className="text-xs text-[var(--color-haze)]">
            当前未添加背景音（
            {params.bgSource === "qqmusic" ? "QQ 音乐为演示占位" : "已选择不添加"}
            ），本条为纯人声音轨。
          </p>
        )}
      </div>

      {/* 人声素材设置 */}
      <div className="glass mt-4 rounded-2xl p-5">
        <p className="text-sm font-semibold text-[var(--color-mist)]">人声素材设置</p>
        <p className="mb-3 mt-1 text-[11px] text-[var(--color-haze)]">
          肯定语音频会自动循环匹配背景音频长度。
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Slider
            label="速度"
            value={params.voiceSpeed}
            min={1}
            max={2}
            step={0.1}
            onChange={(v) => set({ voiceSpeed: v })}
            display={(v) => `${v.toFixed(1)}x`}
          />
          <div>
            <Slider
              label="音量"
              value={params.voiceVolume}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => set({ voiceVolume: v })}
              display={pct}
            />
            <p className="mt-1 text-[10px] leading-snug text-[var(--color-haze)]">
              需要被背景音覆盖，只能听到极细微的沙沙声，不可听清内容。
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Slider
            label="叠加音轨"
            value={params.overlayTracks}
            min={0}
            max={3}
            step={1}
            onChange={(v) => set({ overlayTracks: Math.round(v) })}
            display={(v) => `${Math.round(v)} 条`}
          />
          <Slider
            label="音轨交错"
            value={params.stagger}
            min={0}
            max={2}
            step={0.1}
            onChange={(v) => set({ stagger: v })}
            display={(v) => `${v.toFixed(1)}s`}
            disabled={params.overlayTracks < 1}
          />
        </div>
      </div>

      {/* 合成效果 */}
      <div className="glass mt-4 rounded-2xl p-5">
        <p className="mb-3 text-sm font-semibold text-[var(--color-mist)]">合成效果</p>
        <Slider
          label="总时长"
          value={params.totalDuration / 60}
          min={0.5}
          max={30}
          step={0.5}
          onChange={(v) => set({ totalDuration: Math.round(v * 60) })}
          display={(v) => `${v} 分钟`}
        />
        {durationHint && (
          <p className="mt-1 text-[10px] leading-snug text-amber-400">{durationHint}</p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2">
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
