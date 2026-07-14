"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import AppTopBar from "@/components/ui/AppTopBar";
import GooeyNav from "@/components/ui/GooeyNav";
import WorkDetailModal from "@/components/ui/WorkDetailModal";
import WorkGridPlayButton from "@/components/ui/WorkGridPlayButton";
import type { TrackRecord } from "@/lib/history";
import type { QuotaSnapshot } from "@/lib/quota/types";

export type ThemeMode = "light" | "dark";

export interface UserProfile {
  nickname: string;
  avatarDataUrl: string;
}

const NAV_ITEMS = [
  { label: "我的", href: "#" },
  { label: "slid", href: "#" },
  { label: "社区", href: "#" },
];

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
  quota,
  onCreate,
  onProfileChange,
  onThemeChange,
  onSaveWork,
  onDeleteWork,
}: {
  records: TrackRecord[];
  profile: UserProfile;
  theme: ThemeMode;
  quota: QuotaSnapshot | null;
  onCreate: () => void;
  onProfileChange: (profile: UserProfile) => void;
  onThemeChange: (theme: ThemeMode) => void;
  onSaveWork: (
    id: string,
    data: { title: string; coverDataUrl: string }
  ) => void | Promise<void>;
  onDeleteWork: (id: string) => void;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const drainRef = useRef<{ audio: HTMLAudioElement; url: string } | null>(null);

  const stopDrain = useCallback(() => {
    const cur = drainRef.current;
    if (!cur) return;
    cur.audio.pause();
    URL.revokeObjectURL(cur.url);
    drainRef.current = null;
  }, []);

  const stopGridAndDrain = useCallback(() => {
    stopDrain();
    setPlayingId(null);
  }, [stopDrain]);

  const continueUntilEnd = useCallback(
    (audio: HTMLAudioElement, url: string, trackId: string) => {
      stopDrain();
      setPlayingId(trackId);
      const onEnded = () => {
        audio.pause();
        audio.removeEventListener("ended", onEnded);
        URL.revokeObjectURL(url);
        if (drainRef.current?.audio === audio) drainRef.current = null;
        setPlayingId((cur) => (cur === trackId ? null : cur));
      };
      audio.addEventListener("ended", onEnded);
      drainRef.current = { audio, url };
      if (audio.paused) {
        void audio.play().catch(() => {
          onEnded();
        });
      }
    },
    [stopDrain]
  );

  useEffect(() => () => stopDrain(), [stopDrain]);

  const selected = selectedId
    ? records.find((r) => r.id === selectedId) ?? null
    : null;

  const onAvatarFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onProfileChange({ ...profile, avatarDataUrl: String(reader.result || "") });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col pb-28">
      <AppTopBar
        icon={
          profile.avatarDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarDataUrl} alt="头像" className="h-full w-full object-cover" />
          ) : (
            "In"
          )
        }
        onIconClick={() => setSettingsOpen((v) => !v)}
        iconAriaLabel="打开个人设置"
        iconAriaExpanded={settingsOpen}
        settingsDropdown={
          settingsOpen ? (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="glass absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[min(280px,calc(100vw-2.5rem))] rounded-3xl p-4"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-aura)]/18 text-sm font-bold text-[var(--color-aura)]"
                  aria-label="修改头像"
                >
                  {profile.avatarDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatarDataUrl}
                      alt="头像"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials(profile.nickname)
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[var(--color-haze)]">昵称</p>
                  <input
                    value={profile.nickname}
                    onChange={(e) =>
                      onProfileChange({ ...profile, nickname: e.target.value })
                    }
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
                          ? "pill-active"
                          : "text-[var(--color-haze)] hover:text-[var(--color-mist)]"
                      }`}
                    >
                      {mode === "light" ? "日间" : "夜间"}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : undefined
        }
        rightAction={
          <button
            onClick={onCreate}
            disabled={quota !== null && !quota.canCreate}
            className="btn-primary inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-45"
            title={
              quota && !quota.canCreate
                ? `今日次数已用完，约 ${quota.resetLabel} 重置`
                : undefined
            }
          >
            <Icon className="h-4 w-4">
              <path d="M12 5v14M5 12h14" />
            </Icon>
            新建
          </button>
        }
      />

      <section className="relative flex flex-1 flex-col px-4 py-4">
        {activeTabIndex === 1 ? (
          <div className="flex-1" aria-hidden />
        ) : (
          <div className="flex flex-1 flex-col">
            <motion.div
              key={activeTabIndex}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="flex-1"
            >
              {activeTabIndex === 0 ? (
                records.length === 0 ? (
                  <div className="glass flex min-h-[44dvh] items-center justify-center rounded-[var(--radius-2xl)] px-6 text-center">
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
                  <div className="grid grid-cols-2 gap-3">
                    {records.map((record) => (
                      <div
                        key={record.id}
                        className="glass rounded-3xl p-2.5 transition-colors hover:bg-white/40"
                      >
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              stopDrain();
                              setPlayingId(null);
                              setSelectedId(record.id);
                            }}
                            className="block w-full text-left"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={record.coverDataUrl}
                              alt={record.title}
                              className="aspect-square w-full rounded-2xl object-cover"
                            />
                          </button>
                          <div className="absolute bottom-3 right-3">
                            <WorkGridPlayButton
                              trackId={record.id}
                              active={playingId === record.id}
                              onPlay={(id) => {
                                stopDrain();
                                setPlayingId(id);
                              }}
                              onStop={stopGridAndDrain}
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            stopDrain();
                            setPlayingId(null);
                            setSelectedId(record.id);
                          }}
                          className="mt-2.5 w-full min-w-0 text-left"
                        >
                          <p className="truncate text-sm font-semibold text-[var(--color-mist)]">
                            {record.title}
                          </p>
                          <p className="mt-1 text-xs text-[var(--color-haze)]">
                            {dateLabel(record.createdAt)} · {Math.round(record.durationSec)}s
                          </p>
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="glass flex min-h-[44dvh] flex-col items-center justify-center rounded-[var(--radius-2xl)] px-6 text-center">
                  <h1 className="text-xl font-bold text-[var(--color-mist)] sm:text-2xl">社区</h1>
                  <p className="mt-2 text-sm text-[var(--color-haze)]">社区内容即将开放</p>
                </div>
              )}
            </motion.div>

            {activeTabIndex === 0 && quota && (
              <p
                className={`mt-3 rounded-2xl px-3 py-2.5 text-center text-xs ${
                  quota.canCreate
                    ? "bg-[var(--color-aura)]/10 text-[var(--color-mist-soft)]"
                    : "bg-amber-500/12 text-amber-800"
                }`}
              >
                今日还可制作 {quota.tracksRemaining} / {quota.trackLimit} 条
              </p>
            )}
          </div>
        )}
      </section>

      <div
        className="pointer-events-none fixed bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
        style={{
          left: "var(--frame-left, 0px)",
          width: "min(100%, var(--frame-max, 480px))",
        }}
      >
        {activeTabIndex === 1 && (
          <p className="mb-2 text-center text-[11px] font-medium tracking-wide text-white drop-shadow-[0_1px_4px_rgba(18,63,42,0.35)]">
            沉浸式滑动背景&gt;&lt;
          </p>
        )}
        <div className="gooey-nav-shell glass pointer-events-auto overflow-hidden rounded-[var(--radius-2xl)] shadow-[0_20px_50px_-28px_rgba(18,63,42,0.18)]">
          <GooeyNav
            items={NAV_ITEMS}
            activeIndex={activeTabIndex}
            onActiveChange={setActiveTabIndex}
            initialActiveIndex={0}
          />
        </div>
      </div>

      {selected && (
        <WorkDetailModal
          record={selected}
          onClose={() => {
            setSelectedId(null);
          }}
          onContinueUntilEnd={continueUntilEnd}
          onSave={onSaveWork}
          onDelete={(id) => {
            stopDrain();
            if (playingId === id) setPlayingId(null);
            onDeleteWork(id);
            setSelectedId(null);
          }}
        />
      )}
    </div>
  );
}
