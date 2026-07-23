"use client";

import { useEffect, useRef, useState } from "react";
import {
  BASE_HZ_OPTIONS,
  BG_SOURCES,
  QQ_DEMO_TRACKS,
  RECIPE_VOICE,
  SOUNDSCAPE_PICKER,
} from "@/lib/constants";
import { MUSIC_LIBRARY, type LibraryTrack } from "@/lib/musicLibrary";
import { startPreview, stopPreview } from "@/lib/audio/soundscapes";
import { getAudioDuration } from "@/lib/audio/mixer";
import { BgIcon } from "@/components/ui/icons";
import type {
  BgAudio,
  BgSource,
  MixParams,
  SoundscapeId,
} from "@/lib/types";

export default function BackgroundStep({
  params,
  onParamsChange,
  bgAudio,
  onBgAudioChange,
  onNext,
}: {
  params: MixParams;
  onParamsChange: (p: MixParams) => void;
  bgAudio: BgAudio | null;
  onBgAudioChange: (a: BgAudio | null) => void;
  onNext: () => void;
}) {
  const [previewOn, setPreviewOn] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [libraryError, setLibraryError] = useState("");
  const [libraryLoading, setLibraryLoading] = useState<string | null>(null);
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);
  const [qqPick, setQqPick] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const libAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (previewOn && params.bgSource === "recipe") {
      setPreviewError("");
      startPreview(
        params.soundscape,
        params.mood,
        params.rhythm,
        0,
        params.baseHz
      ).catch(() => {
        setPreviewError("试听启动失败，请检查浏览器的声音/自动播放权限后重试。");
        setPreviewOn(false);
      });
    } else {
      stopPreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    previewOn,
    params.bgSource,
    params.soundscape,
    params.mood,
    params.rhythm,
    params.baseHz,
  ]);

  useEffect(() => {
    return () => {
      stopPreview();
      libAudioRef.current?.pause();
      libAudioRef.current = null;
    };
  }, []);

  const set = (patch: Partial<MixParams>) => onParamsChange({ ...params, ...patch });

  const stopLibraryPreview = () => {
    libAudioRef.current?.pause();
    libAudioRef.current = null;
    setPreviewTrackId(null);
  };

  const chooseSource = (s: BgSource) => {
    stopPreview();
    setPreviewOn(false);
    stopLibraryPreview();
    set({ bgSource: s });
  };

  const chooseRecipe = (id: SoundscapeId) => {
    const voice = RECIPE_VOICE[id] ?? RECIPE_VOICE.calm;
    set({ soundscape: id, mood: voice.mood, rhythm: voice.rhythm });
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadError("");
    if (bgAudio?.url?.startsWith("blob:")) URL.revokeObjectURL(bgAudio.url);
    const durationSec = await getAudioDuration(f);
    if (durationSec <= 0) {
      setUploadError("无法解析该音频文件，请换 mp3 / wav / m4a 等常见格式后重试。");
      onBgAudioChange(null);
      return;
    }
    onBgAudioChange({
      blob: f,
      name: f.name,
      url: URL.createObjectURL(f),
      source: "upload",
      durationSec,
    });
  };

  const selectLibraryTrack = async (track: LibraryTrack) => {
    setLibraryError("");
    setLibraryLoading(track.id);
    stopLibraryPreview();
    try {
      const res = await fetch(track.file);
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      const durationSec = await getAudioDuration(blob);
      if (durationSec <= 0) throw new Error("bad duration");
      if (bgAudio?.url?.startsWith("blob:")) URL.revokeObjectURL(bgAudio.url);
      onBgAudioChange({
        blob,
        name: `${track.artist} - ${track.title}`,
        url: URL.createObjectURL(blob),
        source: "library",
        durationSec,
        libraryId: track.id,
      });
    } catch {
      setLibraryError("曲目加载失败，请稍后重试。");
      onBgAudioChange(null);
    } finally {
      setLibraryLoading(null);
    }
  };

  const toggleLibraryPreview = (track: LibraryTrack) => {
    if (previewTrackId === track.id) {
      stopLibraryPreview();
      return;
    }
    stopLibraryPreview();
    const audio = new Audio(track.file);
    libAudioRef.current = audio;
    setPreviewTrackId(track.id);
    audio.play().catch(() => {
      setLibraryError("试听失败，请检查浏览器声音权限。");
      stopLibraryPreview();
    });
    audio.onended = () => {
      if (libAudioRef.current === audio) setPreviewTrackId(null);
    };
  };

  const needsBgFile =
    params.bgSource === "upload" || params.bgSource === "library";
  const nextDisabled = needsBgFile && !bgAudio;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div>
        <h2 className="text-xl font-bold leading-snug text-[var(--color-mist)] sm:text-2xl">
          选择背景音
        </h2>
      </div>

      {/* 背景音来源 */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        {BG_SOURCES.map((s) => {
          const active = params.bgSource === s.key;
          return (
            <button
              key={s.key}
              onClick={() => chooseSource(s.key)}
              className={`rounded-2xl p-3.5 text-left transition-all ${
                active
                  ? "bg-[var(--color-aura)]/20 ring-2 ring-[var(--color-aura)]"
                  : "bg-black/[0.05] ring-1 ring-black/[0.06] hover:bg-black/[0.07]"
              }`}
            >
              <BgIcon source={s.key} className="h-5 w-5 text-[var(--color-mist)]" />
              <p className="mt-1.5 text-sm font-semibold text-[var(--color-mist)]">
                {s.label}
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
          <div className="grid grid-cols-2 gap-3">
            {SOUNDSCAPE_PICKER.map((s) => {
              const active =
                (params.soundscape === "sleep" ? "calm" : params.soundscape) ===
                s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => chooseRecipe(s.id as SoundscapeId)}
                  className={`relative overflow-hidden rounded-2xl p-4 text-left transition-all ${
                    active
                      ? "ring-2 ring-[var(--color-aura)] shadow-[0_10px_28px_-18px_rgba(79,157,46,0.55)]"
                      : "ring-1 ring-white/70 hover:ring-[var(--color-aura)]/40"
                  }`}
                  style={{
                    background: `linear-gradient(150deg, ${s.palette[0]}, ${s.palette[1]} 55%, ${s.palette[2]})`,
                  }}
                >
                  <div
                    className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-35 blur-xl"
                    style={{ background: s.accent }}
                  />
                  <p className="relative text-base font-semibold text-[var(--color-mist)]">
                    {s.name}
                    <span className="ml-1.5 text-[10px] font-normal uppercase tracking-wider text-[var(--color-mist-soft)]">
                      {s.en}
                    </span>
                  </p>
                  <p className="relative mt-1 text-[10px] leading-snug text-[var(--color-mist-soft)]">
                    {s.scene}
                  </p>
                  <p className="relative mt-0.5 text-[10px] leading-snug text-[var(--color-haze)]">
                    {s.design}
                  </p>
                </button>
              );
            })}
          </div>
          {previewError && <p className="mt-2 text-xs text-amber-600">{previewError}</p>}

          {/* 赫兹基准频率 */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-[var(--color-haze)]">赫兹基准频率</p>
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
                        : "bg-black/[0.05] hover:bg-black/[0.07]"
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
          {uploadError && (
            <p className="mb-3 text-xs text-amber-600">{uploadError}</p>
          )}
          {bgAudio && bgAudio.source === "upload" ? (
            <div>
              <p className="text-sm text-[var(--color-mist)]">已选择：{bgAudio.name}</p>
              <p className="mt-1 text-[11px] text-[var(--color-haze)]">
                时长约 {Math.round(bgAudio.durationSec)} 秒 · 下一步可调音量、时长并与人声合成
              </p>
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
        </div>
      )}

      {/* ---- library playlist ---- */}
      {params.bgSource === "library" && (
        <div className="glass mt-5 overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-black/[0.05] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-mist)]">精选曲库</p>
              <p className="text-[11px] text-[var(--color-haze)]">
                {MUSIC_LIBRARY.length} 首 · 点击歌名选用，点播放试听
              </p>
            </div>
            {bgAudio?.source === "library" && (
              <span className="rounded-full bg-[var(--color-aura)]/15 px-2.5 py-1 text-[10px] font-medium text-[var(--color-mist-soft)]">
                已选
              </span>
            )}
          </div>

          {libraryError && (
            <p className="px-4 pt-3 text-xs text-amber-600">{libraryError}</p>
          )}

          <ul className="max-h-[min(52dvh,22rem)] divide-y divide-black/[0.04] overflow-y-auto overscroll-contain">
            {MUSIC_LIBRARY.map((track, index) => {
              const selected = bgAudio?.libraryId === track.id;
              const loading = libraryLoading === track.id;
              const previewing = previewTrackId === track.id;
              return (
                <li key={track.id}>
                  <div
                    className={`flex items-center gap-2 px-3 py-2.5 transition-colors ${
                      selected ? "bg-[var(--color-aura)]/12" : "hover:bg-black/[0.03]"
                    }`}
                  >
                    <span className="w-5 shrink-0 text-center text-[11px] tabular-nums text-[var(--color-haze)]">
                      {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleLibraryPreview(track)}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                        previewing
                          ? "bg-[var(--color-aura)] text-white"
                          : "bg-black/[0.06] text-[var(--color-mist)] hover:bg-black/[0.1]"
                      }`}
                      aria-label={previewing ? "停止试听" : "试听"}
                    >
                      {previewing ? (
                        <span className="h-2.5 w-2.5 rounded-[2px] bg-current" />
                      ) : (
                        <svg viewBox="0 0 24 24" className="ml-0.5 h-3.5 w-3.5 fill-current" aria-hidden>
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => selectLibraryTrack(track)}
                      disabled={loading}
                      className="min-w-0 flex-1 text-left disabled:opacity-60"
                    >
                      <p className="truncate text-sm font-medium text-[var(--color-mist)]">
                        {track.title}
                      </p>
                      <p className="truncate text-[11px] text-[var(--color-haze)]">
                        {track.artist}
                      </p>
                    </button>
                    {loading ? (
                      <span className="shrink-0 text-[10px] text-[var(--color-haze)]">加载中</span>
                    ) : selected ? (
                      <span className="shrink-0 text-[10px] font-semibold text-[var(--color-aura)]">
                        ✓
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>

          {bgAudio?.source === "library" && (
            <div className="border-t border-black/[0.05] px-4 py-3">
              <p className="text-xs text-[var(--color-mist-soft)]">
                已选择：{bgAudio.name}
                <span className="text-[var(--color-haze)]">
                  {" "}
                  · 约 {Math.round(bgAudio.durationSec)} 秒
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---- official music platform shell (not connected) ---- */}
      {params.bgSource === "qqmusic" && (
        <div className="glass mt-5 rounded-2xl p-5">
          <input
            disabled
            placeholder="官方音乐平台暂未连接"
            className="w-full rounded-xl bg-black/[0.05] px-4 py-2.5 text-sm text-[var(--color-mist-soft)] outline-none placeholder:text-[var(--color-haze)]"
          />
          <p className="mt-3 text-center text-xs text-[var(--color-haze)]">
            官方音乐平台接入后可在此搜索曲库，当前为占位展示
          </p>
          <div className="mt-3 space-y-1.5">
            {QQ_DEMO_TRACKS.map((t, i) => (
              <button
                key={t.title}
                onClick={() => setQqPick(i)}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left transition-all ${
                  qqPick === i ? "bg-[var(--color-aura)]/20 ring-1 ring-[var(--color-aura)]/50" : "bg-black/[0.04] hover:bg-black/[0.06]"
                }`}
              >
                <span className="text-sm text-[var(--color-mist)]">
                  {t.title} <span className="text-[var(--color-haze)]">· {t.artist}</span>
                </span>
                <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[10px] text-[var(--color-mist-soft)]">
                  {t.tag}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-7 flex items-center justify-end">
        <button
          onClick={() => {
            stopPreview();
            stopLibraryPreview();
            onNext();
          }}
          disabled={nextDisabled}
          className="btn-primary rounded-full px-8 py-3 text-sm disabled:opacity-50 sm:py-3.5 sm:text-base"
        >
          下一步：调参 →
        </button>
      </div>
    </div>
  );
}
