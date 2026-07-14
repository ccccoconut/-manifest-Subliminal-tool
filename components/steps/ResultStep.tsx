"use client";



import { useEffect, useRef, useState } from "react";

import { motion } from "framer-motion";

import AudioPlayer from "@/components/ui/AudioPlayer";

import CoverPalettePicker from "@/components/ui/CoverPalettePicker";

import {

  coverFromImageFile,

  generateCover,

  type CoverPaletteId,

} from "@/lib/cover/generateCover";

import { getSoundscape } from "@/lib/constants";

import type { Track } from "@/lib/types";



export default function ResultStep({

  track,

  onSave,

  onDownloadAudio,

  onShare,

  onRestart,

  onRename,

  onCoverChange,

}: {

  track: Track;

  onSave: () => void;

  onDownloadAudio: () => void;

  onShare: () => void;

  onRestart: () => void;

  onRename: (title: string) => void;

  onCoverChange: (coverDataUrl: string) => void | Promise<void>;

}) {

  const accent = getSoundscape(track.params.soundscape).accent;

  const [editingTitle, setEditingTitle] = useState(false);

  const [draftTitle, setDraftTitle] = useState(track.title);

  const [coverBusy, setCoverBusy] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);



  useEffect(() => {

    onSave();

  }, [onSave, track.id]);



  useEffect(() => {

    setDraftTitle(track.title);

    setEditingTitle(false);

  }, [track.id, track.title]);



  const commitTitle = () => {

    const next = draftTitle.trim();

    if (next) onRename(next);

    else setDraftTitle(track.title);

    setEditingTitle(false);

  };



  const applyTemplate = async (palette: CoverPaletteId) => {

    setCoverBusy(true);

    try {

      const cover = generateCover({

        affirmation: track.anchorLine || track.lines[0] || "",

        palette,

      });

      await onCoverChange(cover);

    } finally {

      setCoverBusy(false);

    }

  };



  const onUploadCover = async (file: File | undefined) => {

    if (!file) return;

    setCoverBusy(true);

    try {

      const cover = await coverFromImageFile(file);

      await onCoverChange(cover);

    } catch {

      alert("封面图片读取失败，请换一张图试试");

    } finally {

      setCoverBusy(false);

    }

  };



  return (

    <div className="mx-auto w-full max-w-3xl">

      <p className="text-center text-sm text-[var(--color-aura)]">

        你的所愿变成了一首只属于你的音乐

      </p>



      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,320px)_1fr]">

        <div className="glass rounded-[var(--radius-2xl)] p-5">

          <motion.div

            initial={{ opacity: 0, scale: 0.92 }}

            animate={{ opacity: 1, scale: 1 }}

            className="relative mx-auto w-full max-w-[300px] overflow-hidden rounded-2xl shadow-2xl"

          >

            {/* eslint-disable-next-line @next/next/no-img-element */}

            <img

              src={track.coverDataUrl}

              alt={track.title}

              className="aspect-square w-full object-cover"

            />

            <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/82 p-3 shadow-lg backdrop-blur-md">

              <AudioPlayer src={track.audioBlobUrl} accent={accent} />

            </div>

          </motion.div>



          <div className="mt-4 flex items-center justify-center gap-2">

            {editingTitle ? (

              <input

                value={draftTitle}

                autoFocus

                onChange={(e) => setDraftTitle(e.target.value)}

                onBlur={commitTitle}

                onKeyDown={(e) => {

                  if (e.key === "Enter") commitTitle();

                  if (e.key === "Escape") {

                    setDraftTitle(track.title);

                    setEditingTitle(false);

                  }

                }}

                className="w-full rounded-xl bg-black/[0.05] px-3 py-2 text-center text-sm font-semibold text-[var(--color-mist)] outline-none ring-1 ring-black/[0.06] focus:ring-[var(--color-aura)]/60"

              />

            ) : (

              <>

                <p className="min-w-0 truncate text-center text-base font-semibold text-[var(--color-mist)]">

                  {track.title}

                </p>

                <button

                  onClick={() => setEditingTitle(true)}

                  aria-label="修改音频名"

                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/[0.05] text-[var(--color-haze)] transition-colors hover:bg-black/[0.08] hover:text-[var(--color-mist)]"

                >

                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">

                    <path

                      d="M4 20h4.2L19.1 9.1a2.2 2.2 0 0 0 0-3.1L18 4.9a2.2 2.2 0 0 0-3.1 0L4 15.8V20Z"

                      stroke="currentColor"

                      strokeWidth="1.8"

                      strokeLinecap="round"

                      strokeLinejoin="round"

                    />

                    <path

                      d="M13.8 6 18 10.2"

                      stroke="currentColor"

                      strokeWidth="1.8"

                      strokeLinecap="round"

                    />

                  </svg>

                </button>

              </>

            )}

          </div>



          <div className="mt-4">

            <p className="mb-2 text-xs font-medium text-[var(--color-haze)]">更换封面</p>

            <CoverPalettePicker disabled={coverBusy} onSelect={applyTemplate} />

            <input

              ref={fileRef}

              type="file"

              accept="image/*"

              className="hidden"

              onChange={(e) => onUploadCover(e.target.files?.[0])}

            />

            <button

              disabled={coverBusy}

              onClick={() => fileRef.current?.click()}

              className="btn-ghost mt-2 w-full rounded-full px-3 py-2 text-xs disabled:opacity-50"

            >

              {coverBusy ? "处理中…" : "上传自定义封面"}

            </button>

          </div>

        </div>



        <div className="glass rounded-[var(--radius-2xl)] p-6">

          <p className="mb-4 text-sm font-semibold text-[var(--color-mist)]">肯定语</p>

          <div className="space-y-3">

            {track.lines.map((l, i) => (

              <p

                key={`${l}-${i}`}

                className="rounded-2xl bg-black/[0.04] px-4 py-3 text-sm leading-relaxed text-[var(--color-mist-soft)]"

              >

                {l}

              </p>

            ))}

          </div>

        </div>

      </div>



      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">

        <button onClick={onDownloadAudio} className="btn-ghost rounded-full px-4 py-2 text-sm">

          下载音频

        </button>

        <button onClick={onShare} className="btn-ghost rounded-full px-4 py-2 text-sm">

          分享声景卡片

        </button>

        <button onClick={onRestart} className="btn-primary rounded-full px-5 py-2 text-sm">

          再做一条 →

        </button>

      </div>

      <p className="mx-auto mt-6 max-w-md text-center text-sm leading-relaxed text-[var(--color-mist-soft)]">

        我们不是让 AI 替你写一首歌，

        <br />

        而是帮你把一句「我不行」，变成用你自己声音说出的「

        <span className="text-gradient font-semibold">我可以</span>」。

      </p>

    </div>

  );

}


