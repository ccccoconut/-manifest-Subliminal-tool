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

import type { TrackRecord } from "@/lib/history";



export default function WorkDetailModal({

  record,

  onClose,

  onSave,

  onDelete,

}: {

  record: TrackRecord;

  onClose: () => void;

  onSave: (

    id: string,

    data: { title: string; coverDataUrl: string }

  ) => void | Promise<void>;

  onDelete: (id: string) => void;

}) {

  const [draftTitle, setDraftTitle] = useState(record.title);

  const [draftCover, setDraftCover] = useState(record.coverDataUrl);

  const [coverBusy, setCoverBusy] = useState(false);

  const [saving, setSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);



  useEffect(() => {

    setDraftTitle(record.title);

    setDraftCover(record.coverDataUrl);

    setConfirmDelete(false);

  }, [record.id, record.title, record.coverDataUrl]);



  const handleClose = () => {

    onClose();

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



  const handleSave = async () => {

    const title = draftTitle.trim() || record.title;

    setSaving(true);

    try {

      const thumb = await makeThumb(draftCover);

      await onSave(record.id, { title, coverDataUrl: thumb });

      onClose();

    } finally {

      setSaving(false);

    }

  };



  const handleDelete = () => {

    onDelete(record.id);

    onClose();

  };



  return (

    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">

      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <motion.div

        initial={{ opacity: 0, y: 24 }}

        animate={{ opacity: 1, y: 0 }}

        className="glass relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-[1.75rem] p-5 sm:rounded-[var(--radius-2xl)]"

        onClick={(e) => e.stopPropagation()}

      >

        <div className="mb-3 flex items-center justify-between">

          <h3 className="text-base font-semibold text-[var(--color-mist)]">作品详情</h3>

          <button

            onClick={handleClose}

            className="text-sm text-[var(--color-haze)] hover:text-[var(--color-mist)]"

          >

            关闭

          </button>

        </div>



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

            onClick={handleSave}

            className="btn-primary flex-1 rounded-full px-4 py-3 text-sm font-medium disabled:opacity-50"

          >

            {saving ? "保存中…" : "保存"}

          </button>

        </div>

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


