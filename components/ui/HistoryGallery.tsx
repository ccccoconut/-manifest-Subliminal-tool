"use client";

import { motion } from "framer-motion";
import { getSoundscape, RATING_DIMS } from "@/lib/constants";
import type { TrackRecord } from "@/lib/history";

function dateLabel(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function RatingsDelta({ r }: { r: TrackRecord }) {
  const rt = r.ratings;
  if (!rt || rt.after.tension === 0 || rt.after.confidence === 0) return null;
  return (
    <p className="mt-0.5 text-[11px] text-[var(--color-mist-soft)]">
      {RATING_DIMS.map((d) => `${d.label} ${rt.before[d.key]}→${rt.after[d.key]}`).join(" · ")}
    </p>
  );
}

export default function HistoryGallery({
  records,
  onDelete,
  onClose,
}: {
  records: TrackRecord[];
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-[var(--radius-2xl)] p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--color-mist)]">
            我的音轨 · {records.length}
          </h3>
          <button
            onClick={onClose}
            className="text-sm text-[var(--color-haze)] hover:text-[var(--color-mist)]"
          >
            关闭
          </button>
        </div>

        {records.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--color-haze)]">
            还没有保存的音轨。生成一条后点「保存到我的音轨」。
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {records.map((r) => (
              <div key={r.id} className="flex gap-3 rounded-2xl bg-white/[0.05] p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.coverDataUrl}
                  alt={r.title}
                  className="h-20 w-20 shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--color-mist)]">
                    {r.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[var(--color-aura)]">
                    {getSoundscape(r.params.soundscape).name} ·{" "}
                    {Math.round(r.durationSec)}s
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--color-haze)]">
                    {dateLabel(r.createdAt)}
                  </p>
                  <RatingsDelta r={r} />
                  <button
                    onClick={() => onDelete(r.id)}
                    className="mt-1 text-[11px] text-[var(--color-haze)] hover:text-rose-400"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="mt-5 text-center text-[11px] text-[var(--color-haze)]">
          音轨文件仅保存在本设备本地，用于你的私人回顾。
        </p>
      </motion.div>
    </div>
  );
}
