"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import CoverPalettePicker from "@/components/ui/CoverPalettePicker";
import {
  coverFromImageFile,
  generateCover,
  type CoverPaletteId,
  makeThumb,
} from "@/lib/cover/generateCover";
import { getTrackAudio } from "@/lib/audio/store";
import type { TrackRecord } from "@/lib/history";

type ModalMode = "play" | "edit";

function fmt(sec: number): string {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function WorkDetailModal({
  record,
  onClose,
  onSave,
  onDelete,
  onContinueUntilEnd,
}: {
  record: TrackRecord;
  onClose: () => void;
  onSave: (
    id: string,
    data: { title: string; coverDataUrl: string }
  ) => void | Promise<void>;
  onDelete: (id: string) => void;
  /** 退出时若正在播放：由外部接管，播完当前这一遍后停止（不再循环） */
  onContinueUntilEnd: (
    audio: HTMLAudioElement,
    url: string,
    trackId: string
  ) => void;
}) {
  const [mode, setMode] = useState<ModalMode>("play");
  const [draftTitle, setDraftTitle] = useState(record.title);
  const [draftCover, setDraftCover] = useState(record.coverDataUrl);
  const [coverBusy, setCoverBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const allowLoopRef = useRef(true);
  const handedOffRef = useRef(false);
  const playingRef = useRef(false);

  const [audioReady, setAudioReady] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  // 切换作品：回到播放态，重置草稿
  useEffect(() => {
    setMode("play");
    setDraftTitle(record.title);
    setDraftCover(record.coverDataUrl);
    setConfirmDelete(false);
    setCur(0);
    setDur(0);
    setPlaying(false);
    allowLoopRef.current = true;
  }, [record.id, record.title, record.coverDataUrl]);

  // 加载音频；卡片内默认单曲循环
  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;
    let audio: HTMLAudioElement | null = null;
    handedOffRef.current = false;
    allowLoopRef.current = true;

    const onTime = () => {
      if (audio) setCur(audio.currentTime);
    };
    const onMeta = () => {
      if (audio) setDur(audio.duration || 0);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      if (!audio) return;
      if (allowLoopRef.current) {
        audio.currentTime = 0;
        void audio.play();
        return;
      }
      setPlaying(false);
      audio.currentTime = 0;
      setCur(0);
    };

    setAudioError("");
    setAudioReady(false);
    setPlaying(false);
    setCur(0);
    setDur(0);

    (async () => {
      try {
        const blob = await getTrackAudio(record.id);
        if (cancelled) return;
        if (!blob) {
          setAudioError("未找到本地音频（可能是旧作品，请重新生成一次）");
          return;
        }
        url = URL.createObjectURL(blob);
        urlRef.current = url;
        audio = new Audio(url);
        audio.preload = "metadata";
        audioRef.current = audio;
        audio.addEventListener("timeupdate", onTime);
        audio.addEventListener("loadedmetadata", onMeta);
        audio.addEventListener("durationchange", onMeta);
        audio.addEventListener("play", onPlay);
        audio.addEventListener("pause", onPause);
        audio.addEventListener("ended", onEnded);
        setAudioReady(true);
      } catch {
        if (!cancelled) setAudioError("音频加载失败");
      }
    })();

    return () => {
      cancelled = true;
      if (handedOffRef.current) {
        // 已交给外部播完本轮，不要 pause / revoke
        if (audio) {
          audio.removeEventListener("timeupdate", onTime);
          audio.removeEventListener("loadedmetadata", onMeta);
          audio.removeEventListener("durationchange", onMeta);
          audio.removeEventListener("play", onPlay);
          audio.removeEventListener("pause", onPause);
          audio.removeEventListener("ended", onEnded);
        }
        return;
      }
      if (audio) {
        audio.pause();
        audio.removeEventListener("timeupdate", onTime);
        audio.removeEventListener("loadedmetadata", onMeta);
        audio.removeEventListener("durationchange", onMeta);
        audio.removeEventListener("play", onPlay);
        audio.removeEventListener("pause", onPause);
        audio.removeEventListener("ended", onEnded);
      }
      if (audioRef.current === audio) audioRef.current = null;
      if (url) URL.revokeObjectURL(url);
      if (urlRef.current === url) urlRef.current = null;
    };
  }, [record.id]);

  // 进入编辑时暂停
  useEffect(() => {
    if (mode === "edit" && audioRef.current) {
      audioRef.current.pause();
    }
  }, [mode]);

  const handleClose = () => {
    // 关闭后不再循环：若正在播，交给外部播完本遍再停
    allowLoopRef.current = false;
    const audio = audioRef.current;
    const url = urlRef.current;
    if (playingRef.current && audio && url) {
      handedOffRef.current = true;
      audioRef.current = null;
      urlRef.current = null;
      onContinueUntilEnd(audio, url, record.id);
    } else {
      audio?.pause();
    }
    onClose();
  };

  const togglePlay = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      return;
    }
    try {
      allowLoopRef.current = true;
      await a.play();
    } catch {
      setAudioError("播放失败，请重试");
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !dur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX =
      "touches" in e ? e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX : e.clientX;
    if (clientX == null) return;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    a.currentTime = ratio * dur;
    setCur(a.currentTime);
  };

  const enterEdit = () => {
    setDraftTitle(record.title);
    setDraftCover(record.coverDataUrl);
    setMode("edit");
  };

  const cancelEdit = () => {
    setDraftTitle(record.title);
    setDraftCover(record.coverDataUrl);
    setConfirmDelete(false);
    setMode("play");
  };

  const applyTemplate = async (palette: CoverPaletteId) => {
    setCoverBusy(true);
    try {
      const cover = generateCover({
        affirmation: record.anchorLine || record.lines[0] || "",
        palette,
      });
      setDraftCover(cover);
    } finally {
      setCoverBusy(false);
    }
  };

  const onUploadCover = async (file: File | undefined) => {
    if (!file) return;
    setCoverBusy(true);
    try {
      const cover = await coverFromImageFile(file);
      setDraftCover(cover);
    } catch {
      alert("封面图片读取失败，请换一张图试试");
    } finally {
      setCoverBusy(false);
    }
  };

  const handleKeep = async () => {
    const title = draftTitle.trim() || record.title;
    setSaving(true);
    try {
      const thumb = await makeThumb(draftCover);
      await onSave(record.id, { title, coverDataUrl: thumb });
      setMode("play");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    allowLoopRef.current = false;
    audioRef.current?.pause();
    onDelete(record.id);
  };

  const pct = dur ? (cur / dur) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-[1.75rem] p-5 sm:rounded-[var(--radius-2xl)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="min-w-0 truncate text-base font-semibold text-[var(--color-mist)]">
            {mode === "play" ? record.title : "编辑"}
          </h3>
          <div className="flex shrink-0 items-center gap-2">
            {mode === "play" ? (
              <>
                <button
                  type="button"
                  onClick={enterEdit}
                  className="rounded-full bg-black/[0.05] px-3 py-1.5 text-sm text-[var(--color-mist)] hover:bg-black/[0.08]"
                >
                  编辑
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-sm text-[var(--color-haze)] hover:text-[var(--color-mist)]"
                >
                  关闭
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={cancelEdit}
                className="text-sm text-[var(--color-haze)] hover:text-[var(--color-mist)]"
              >
                取消
              </button>
            )}
          </div>
        </div>

        {mode === "play" ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={record.coverDataUrl}
              alt={record.title}
              className="mx-auto aspect-square w-full max-w-[280px] rounded-2xl object-cover shadow-lg"
            />

            <div className="mt-5 rounded-2xl bg-black/[0.04] p-3.5">
              {audioError ? (
                <p className="py-3 text-center text-xs text-amber-600">{audioError}</p>
              ) : !audioReady ? (
                <p className="py-3 text-center text-xs text-[var(--color-haze)]">加载音频…</p>
              ) : (
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={togglePlay}
                    aria-label={playing ? "暂停" : "播放"}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full backdrop-blur-md"
                    style={{
                      background: "rgba(255, 255, 255, 0.55)",
                      border: "1px solid rgba(255, 255, 255, 0.65)",
                    }}
                  >
                    {playing ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#123f2a">
                        <rect x="6" y="5" width="4" height="14" rx="1" />
                        <rect x="14" y="5" width="4" height="14" rx="1" />
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="#123f2a">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div
                      role="slider"
                      aria-valuemin={0}
                      aria-valuemax={dur || 0}
                      aria-valuenow={cur}
                      tabIndex={0}
                      onClick={seek}
                      onTouchStart={seek}
                      className="group relative h-1.5 cursor-pointer touch-none rounded-full bg-black/[0.08]"
                    >
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-[var(--color-aura)]"
                        style={{ width: `${pct}%` }}
                      />
                      <div
                        className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[var(--color-aura-deep)] shadow"
                        style={{ left: `calc(${pct}% - 5px)` }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] tabular-nums text-[var(--color-haze)]">
                      <span>{fmt(cur)}</span>
                      <span>{fmt(dur)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5">
              <p className="mb-2 text-xs font-medium text-[var(--color-haze)]">肯定语</p>
              <div className="space-y-2">
                {record.lines.map((line, i) => (
                  <p
                    key={`${line}-${i}`}
                    className="rounded-xl bg-black/[0.04] px-3.5 py-2.5 text-sm leading-relaxed text-[var(--color-mist-soft)]"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={draftCover}
              alt={draftTitle}
              className="mx-auto aspect-square w-full max-w-[280px] rounded-2xl object-cover shadow-lg"
            />

            <div className="mt-4">
              <p className="mb-1.5 text-xs text-[var(--color-haze)]">作品名称</p>
              <input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                className="w-full rounded-xl bg-black/[0.05] px-3 py-2.5 text-sm font-semibold text-[var(--color-mist)] outline-none ring-1 ring-black/[0.06] focus:ring-[var(--color-aura)]/60"
                placeholder="输入作品名称"
              />
            </div>

            <div className="mt-5">
              <p className="mb-2 text-xs font-medium text-[var(--color-haze)]">更换封面</p>
              <CoverPalettePicker
                disabled={coverBusy || saving}
                onSelect={applyTemplate}
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onUploadCover(e.target.files?.[0])}
              />
              <button
                disabled={coverBusy || saving}
                onClick={() => fileRef.current?.click()}
                className="btn-ghost mt-2 w-full rounded-full px-4 py-2 text-sm disabled:opacity-50"
              >
                {coverBusy ? "处理中…" : "上传自定义封面"}
              </button>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setConfirmDelete(true)}
                className="flex-1 rounded-full bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-600 disabled:opacity-50"
              >
                删除
              </button>
              <button
                type="button"
                disabled={saving || coverBusy}
                onClick={handleKeep}
                className="btn-primary flex-1 rounded-full px-4 py-3 text-sm font-medium disabled:opacity-50"
              >
                {saving ? "保存中…" : "保留"}
              </button>
            </div>
          </>
        )}
      </motion.div>

      {confirmDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-6"
          onClick={() => setConfirmDelete(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass relative w-full max-w-sm rounded-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-base font-semibold text-[var(--color-mist)]">确认删除？</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-mist-soft)]">
              删除后不可恢复，作品名称、封面和音频将从本设备永久移除。
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="btn-ghost flex-1 rounded-full px-4 py-2.5 text-sm"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 rounded-full bg-rose-600 px-4 py-2.5 text-sm font-medium text-white"
              >
                确认删除
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
