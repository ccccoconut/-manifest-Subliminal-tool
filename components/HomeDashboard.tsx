"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { APP_NAME } from "@/lib/constants";
import type { TrackRecord } from "@/lib/history";

export type ThemeMode = "light" | "dark";

export interface UserProfile {
  nickname: string;
  avatarDataUrl: string;
}

function Icon({
  children,
  className = "h-5 w-5",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {children}
    </svg>
  );
}

function dateLabel(ts: number) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function initials(name: string) {
  return (name.trim().slice(0, 2) || "我").toUpperCase();
}

export default function HomeDashboard({
  records,
  profile,
  theme,
  onCreate,
  onProfileChange,
  onThemeChange,
}: {
  records: TrackRecord[];
  profile: UserProfile;
  theme: ThemeMode;
  onCreate: () => void;
  onProfileChange: (profile: UserProfile) => void;
  onThemeChange: (theme: ThemeMode) => void;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"works" | "community">("works");
  const fileRef = useRef<HTMLInputElement>(null);

  const onAvatarFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onProfileChange({ ...profile, avatarDataUrl: String(reader.result || "") });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-aura)]/15 text-sm font-bold text-[var(--color-aura)]">
            In
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-mist)]">{APP_NAME}</p>
            <p className="text-[11px] text-[var(--color-haze)]">个人声音音乐工作台</p>
          </div>
        </div>
        <button
          onClick={onCreate}
          className="btn-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm"
        >
          <Icon className="h-4 w-4">
            <path d="M12 5v14M5 12h14" />
          </Icon>
          新建作品
        </button>
      </header>

      <section className="relative flex flex-1 flex-col py-8">
        <div className="mx-auto flex w-full max-w-md rounded-full border border-[var(--color-border)] bg-white/60 p-1 shadow-[0_14px_36px_-28px_rgba(76,29,149,0.42)] backdrop-blur">
          {[
            { key: "works", label: "我的作品" },
            { key: "community", label: "社群" },
          ].map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as "works" | "community")}
                className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                  active
                    ? "bg-[var(--color-aura)] text-white shadow-[0_10px_26px_-16px_rgba(124,58,237,0.85)]"
                    : "text-[var(--color-haze)] hover:text-[var(--color-mist)]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="glass mt-6 min-h-[560px] rounded-[var(--radius-2xl)] p-5 sm:p-7"
        >
          {activeTab === "works" ? (
            <>
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                  <h1 className="text-3xl font-bold text-[var(--color-mist)]">我的作品</h1>
                <p className="mt-1 text-sm text-[var(--color-haze)]">
                  {records.length > 0 ? `${records.length} 条已保存音频` : "还没有保存的音频"}
                </p>
              </div>
            </div>

            {records.length === 0 ? (
                <div className="flex min-h-[380px] items-center justify-center rounded-3xl border border-dashed border-[var(--color-border)] bg-black/[0.03] px-8 text-center">
                <div>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-aura)]/12 text-[var(--color-aura)]">
                    <Icon className="h-6 w-6">
                      <path d="M9 18V6l11-2v12" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="17" cy="16" r="3" />
                    </Icon>
                  </div>
                  <p className="mt-4 text-sm font-semibold text-[var(--color-mist)]">
                    创建第一条 Sub 音频
                  </p>
                </div>
              </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {records.map((record) => (
                  <div
                    key={record.id}
                      className="rounded-3xl bg-black/[0.04] p-3 transition-colors hover:bg-black/[0.06]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={record.coverDataUrl}
                      alt={record.title}
                        className="aspect-square w-full rounded-2xl object-cover"
                    />
                      <div className="mt-3 min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--color-mist)]">
                        {record.title}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-haze)]">
                        {dateLabel(record.createdAt)} · {Math.round(record.durationSec)}s
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </>
          ) : (
            <>
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-[var(--color-mist)]">社群</h1>
                  <p className="mt-1 text-sm text-[var(--color-haze)]">预留入口</p>
                </div>
              </div>
              <div className="flex min-h-[380px] items-center justify-center rounded-3xl border border-dashed border-[var(--color-border)] bg-black/[0.03]">
                <span className="text-sm text-[var(--color-haze)]">社群内容即将开放</span>
            </div>
            </>
          )}
        </motion.div>
      </section>

      <div className="fixed bottom-5 left-5 z-40">
        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="glass mb-3 w-[280px] rounded-3xl p-4"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => fileRef.current?.click()}
                className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-aura)]/18 text-sm font-bold text-[var(--color-aura)]"
                aria-label="修改头像"
              >
                {profile.avatarDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatarDataUrl} alt="头像" className="h-full w-full object-cover" />
                ) : (
                  initials(profile.nickname)
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[var(--color-haze)]">昵称</p>
                <input
                  value={profile.nickname}
                  onChange={(e) => onProfileChange({ ...profile, nickname: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-black/[0.05] px-3 py-2 text-sm font-semibold text-[var(--color-mist)] outline-none ring-1 ring-black/[0.06] focus:ring-[var(--color-aura)]/60"
                />
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onAvatarFile(e.target.files?.[0])}
            />
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-black/[0.04] p-2">
              <span className="px-2 text-xs font-medium text-[var(--color-mist-soft)]">
                显示模式
              </span>
              <div className="flex rounded-full bg-white/50 p-1">
                {(["light", "dark"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => onThemeChange(mode)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                      theme === mode
                        ? "bg-[var(--color-aura)] text-white"
                        : "text-[var(--color-haze)] hover:text-[var(--color-mist)]"
                    }`}
                  >
                    {mode === "light" ? "日间" : "夜间"}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <button
          onClick={() => setSettingsOpen((v) => !v)}
          className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[var(--color-aura)] text-sm font-bold text-white shadow-[0_14px_32px_-16px_rgba(124,58,237,0.9)] ring-4 ring-white/70"
          aria-label="打开个人设置"
        >
          {profile.avatarDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarDataUrl} alt="头像" className="h-full w-full object-cover" />
          ) : (
            initials(profile.nickname)
          )}
        </button>
      </div>
    </div>
  );
}
