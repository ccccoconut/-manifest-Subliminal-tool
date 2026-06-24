"use client";

import { motion } from "framer-motion";

export interface SafetyData {
  resources: { name: string; phone: string }[];
}

export default function SafetyModal({
  data,
  onClose,
  onContinue,
}: {
  data: SafetyData;
  onClose: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass relative w-full max-w-md rounded-[var(--radius-2xl)] p-7"
      >
        <h3 className="text-lg font-semibold text-[var(--color-mist)]">
          先停下来，给自己一点支持
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-mist-soft)]">
          看起来你正经历很难的时刻。心频是一个放松与自我肯定工具，
          <span className="text-[var(--color-mist)]">不能替代专业的心理帮助</span>。
          如果你有伤害自己或他人的念头，请第一时间联系下面的热线，或身边信任的人。
        </p>
        <div className="mt-4 space-y-2">
          {data.resources.map((r) => (
            <div
              key={r.name + r.phone}
              className="flex items-center justify-between rounded-xl bg-black/[0.05] px-4 py-3"
            >
              <span className="text-sm text-[var(--color-mist-soft)]">{r.name}</span>
              <a
                href={`tel:${r.phone}`}
                className="text-sm font-semibold text-[var(--color-calm)]"
              >
                {r.phone}
              </a>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={onContinue}
            className="btn-ghost rounded-full px-5 py-2.5 text-sm"
          >
            我只是想放松一下，继续生成
          </button>
          <button
            onClick={onClose}
            className="rounded-full px-5 py-2 text-sm text-[var(--color-haze)] hover:text-[var(--color-mist)]"
          >
            返回
          </button>
        </div>
      </motion.div>
    </div>
  );
}
