"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ComplianceBar from "@/components/ui/ComplianceBar";
import AppTopBar from "@/components/ui/AppTopBar";
import SafetyModal, { type SafetyData } from "@/components/ui/SafetyModal";
import GenerationOverlay from "@/components/ui/GenerationOverlay";
import HomeDashboard, {
  type ThemeMode,
  type UserProfile,
} from "@/components/HomeDashboard";
import InputStep from "@/components/steps/InputStep";
import AffirmationStep from "@/components/steps/AffirmationStep";
import RecordStep from "@/components/steps/RecordStep";
import BackgroundStep from "@/components/steps/SoundscapeStep";
import MixConsoleStep from "@/components/steps/MixConsoleStep";
import ResultStep from "@/components/steps/ResultStep";
import { APP_NAME, DEFAULT_RECIPE_DURATION, MAX_TOTAL_DURATION, RECIPE_VOICE, resolveSoundscapeId } from "@/lib/constants";
import { generateFallback } from "@/lib/affirmation/fallback";
import { renderMix } from "@/lib/audio/mixer";
import { encodeTrack, type EncodedAudio } from "@/lib/audio/encode";
import {
  defaultCoverPaletteForSoundscape,
  generateCover,
  makeThumb,
} from "@/lib/cover/generateCover";
import { deleteTrackAudio, putTrackAudio } from "@/lib/audio/store";
import {
  deleteTrack,
  loadHistory,
  saveTrack,
  updateTrack,
  type TrackRecord,
} from "@/lib/history";
import {
  consumeTrackQuota,
  fetchQuota,
  quotaExhaustedMessage,
  quotaHeaders,
} from "@/lib/quota/client";
import type { QuotaSnapshot } from "@/lib/quota/types";
import type {
  Affirmation,
  BgAudio,
  MixParams,
  ToneKey,
  Track,
  UserInput,
  VoiceTake,
  WizardStep,
} from "@/lib/types";

const variants = {
  enter: { opacity: 0, y: 16 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

const PROFILE_KEY = "innertune.profile.v1";
const THEME_KEY = "innertune.theme.v1";
const DEFAULT_PROFILE: UserProfile = { nickname: "我的心声", avatarDataUrl: "" };

function defaultParams(aff: Affirmation): MixParams {
  const soundscape = resolveSoundscapeId(aff.suggestedSoundscape);
  const voice = RECIPE_VOICE[soundscape];
  return {
    bgSource: "recipe",
    soundscape,
    mood: voice.mood,
    rhythm: voice.rhythm,
    baseHz: 432,
    bgVolume: 0.95,
    voiceVolume: 0.6, // 潜听：被背景音覆盖
    voiceSpeed: 1.0,
    overlayTracks: 0,
    stagger: 0,
    totalDuration: DEFAULT_RECIPE_DURATION,
    binaural: false,
    binauralHz: 7,
    effect8d: false,
    distance: "mid",
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function sanitize(name: string) {
  return name.replace(/[《》\\/:*?"<>|]/g, "").trim() || APP_NAME;
}

/** 平滑推进进度（用于四阶段生成动画）。用定时器而非 rAF，确保标签页切到后台时仍能推进。 */
function ramp(
  from: number,
  to: number,
  ms: number,
  set: (v: number) => void
): Promise<void> {
  return new Promise((resolve) => {
    const start = Date.now();
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / ms);
      set(from + (to - from) * t);
      if (t >= 1) {
        clearInterval(id);
        resolve();
      }
    }, 30);
  });
}

export default function Studio() {
  const [step, setStep] = useState<WizardStep>("home");
  const [input, setInput] = useState<UserInput | null>(null);
  const [affirmation, setAffirmation] = useState<Affirmation | null>(null);
  const [voiceTake, setVoiceTake] = useState<VoiceTake | null>(null);
  const [bgAudio, setBgAudio] = useState<BgAudio | null>(null);
  const [params, setParams] = useState<MixParams | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [encoded, setEncoded] = useState<EncodedAudio | null>(null);

  const [genAff, setGenAff] = useState(false);
  const [genMix, setGenMix] = useState(false);
  const [progress, setProgress] = useState(0);
  const [safety, setSafety] = useState<SafetyData | null>(null);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<TrackRecord[]>([]);
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [quota, setQuota] = useState<QuotaSnapshot | null>(null);
  const pending = useRef<{ input: UserInput; tone: ToneKey } | null>(null);

  const refreshQuota = useCallback(async () => {
    const next = await fetchQuota();
    if (next) setQuota(next);
  }, []);

  useEffect(() => {
    setMounted(true);
    setHistory(loadHistory());
    void refreshQuota();
    try {
      const savedProfile = localStorage.getItem(PROFILE_KEY);
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setProfile({
          nickname:
            typeof parsed.nickname === "string" && parsed.nickname.trim()
              ? parsed.nickname
              : DEFAULT_PROFILE.nickname,
          avatarDataUrl:
            typeof parsed.avatarDataUrl === "string" ? parsed.avatarDataUrl : "",
        });
      }
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme === "dark" || savedTheme === "light") setTheme(savedTheme);
    } catch {
      /* keep defaults */
    }
  }, [refreshQuota]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* noop */
    }
  }, [mounted, theme]);

  const updateProfile = useCallback((next: UserProfile) => {
    const normalized = {
      nickname: next.nickname.trim() ? next.nickname : DEFAULT_PROFILE.nickname,
      avatarDataUrl: next.avatarDataUrl,
    };
    setProfile(normalized);
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(normalized));
    } catch {
      /* noop */
    }
  }, []);

  const runGenerate = useCallback(
    async (userInput: UserInput, tone: ToneKey, advance: boolean) => {
      setGenAff(true);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: quotaHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ ...userInput, tone }),
        });
        const data = await res.json();
        if (data.quota) setQuota(data.quota);

        if (res.status === 429 && data.error === "QUOTA_TRACK") {
          alert(data.message || quotaExhaustedMessage(data.quota));
          setStep("home");
          return;
        }

        if (data.safety?.triggered) {
          pending.current = { input: userInput, tone };
          setSafety({ resources: data.safety.resources });
          return;
        }
        const aff: Affirmation = data.affirmation ?? generateFallback(userInput, tone);
        setAffirmation(aff);
        if (advance) {
          setParams(defaultParams(aff));
          setStep("affirmation");
        }
      } catch {
        const aff = generateFallback(userInput, tone);
        setAffirmation(aff);
        if (advance) {
          setParams(defaultParams(aff));
          setStep("affirmation");
        }
      } finally {
        setGenAff(false);
      }
    },
    []
  );

  const handleFirstGenerate = (userInput: UserInput) => {
    if (quota && !quota.canCreate) {
      alert(quotaExhaustedMessage(quota));
      setStep("home");
      return;
    }
    setInput(userInput);
    runGenerate(userInput, "default", true);
  };

  const handleRegenerate = (tone: ToneKey) => {
    if (input) runGenerate(input, tone, false);
  };

  const continueDespiteSafety = () => {
    const p = pending.current;
    setSafety(null);
    if (!p) return;
    const aff = generateFallback(p.input, p.tone);
    setAffirmation(aff);
    setParams(defaultParams(aff));
    setStep("affirmation");
  };

  const handleRecordDone = (take: VoiceTake) => {
    setVoiceTake(take);
    setStep("background");
  };

  const handleGenerateTrack = async (take: VoiceTake) => {
    if (!params || !affirmation) return;
    if (quota && !quota.canCreate) {
      alert(quotaExhaustedMessage(quota));
      return;
    }
    setGenMix(true);
    setProgress(0);
    try {
      await ramp(0, 0.22, 650, setProgress);
      await ramp(0.22, 0.45, 650, setProgress);
      const { buffer, durationSec } = await renderMix({
        voiceBlob: take.blob,
        params,
        bgBlob: bgAudio?.blob ?? null,
        onProgress: (p) => setProgress(0.45 + p * 0.45),
      });
      const enc = encodeTrack(buffer);
      const audioBlobUrl = URL.createObjectURL(enc.blob);
      await ramp(0.9, 0.98, 400, setProgress);
      const coverDataUrl = generateCover({
        affirmation: affirmation.anchorLine || affirmation.lines[0] || "",
        palette: defaultCoverPaletteForSoundscape(params.soundscape),
      });
      setProgress(1);
      const t: Track = {
        id: crypto.randomUUID(),
        title: affirmation.title,
        scene: affirmation.scene,
        emotionTags: affirmation.emotionTags,
        understanding: affirmation.understanding,
        lines: affirmation.lines,
        anchorLine: affirmation.anchorLine,
        params,
        audioBlobUrl,
        coverDataUrl,
        durationSec,
        createdAt: Date.now(),
      };

      // 完整流程成功：服务端计次（删除不返还）
      const consumed = await consumeTrackQuota(t.id);
      if (consumed.quota) setQuota(consumed.quota);
      if (!consumed.ok && consumed.error === "QUOTA_TRACK") {
        URL.revokeObjectURL(audioBlobUrl);
        alert(quotaExhaustedMessage(consumed.quota));
        return;
      }

      try {
        await putTrackAudio(t.id, enc.blob);
      } catch (err) {
        console.warn("audio persist failed", err);
      }
      setEncoded(enc);
      setTrack(t);
      setSaved(false);
      setStep("result");
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof Error ? err.message : "混音生成失败，请重试或重新录音。";
      alert(msg);
    } finally {
      setGenMix(false);
    }
  };

  const handleRenameTrack = useCallback((title: string) => {
    setTrack((t) => (t ? { ...t, title } : t));
    setHistory((prev) => {
      if (!prev.some((r) => r.id === (track?.id ?? ""))) return prev;
      return updateTrack(track!.id, { title });
    });
  }, [track]);

  const handleCoverChange = useCallback(
    async (coverDataUrl: string) => {
      setTrack((t) => (t ? { ...t, coverDataUrl } : t));
      if (!track) return;
      const thumb = await makeThumb(coverDataUrl);
      setHistory((prev) => {
        if (!prev.some((r) => r.id === track.id)) return prev;
        return updateTrack(track.id, { coverDataUrl: thumb });
      });
    },
    [track]
  );

  const handleSave = useCallback(async () => {
    if (!track) return;
    if (saved) return;
    setSaved(true);
    const thumb = await makeThumb(track.coverDataUrl);
    const record: TrackRecord = {
      id: track.id,
      title: track.title,
      scene: track.scene,
      emotionTags: track.emotionTags,
      lines: track.lines,
      anchorLine: track.anchorLine,
      params: track.params,
      coverDataUrl: thumb,
      durationSec: track.durationSec,
      ratings: track.ratings,
      createdAt: track.createdAt,
      hasAudio: true,
    };
    setHistory(saveTrack(record));
  }, [saved, track]);

  const handleHistorySave = useCallback(
    async (id: string, data: { title: string; coverDataUrl: string }) => {
      setHistory(updateTrack(id, { title: data.title, coverDataUrl: data.coverDataUrl }));
      setTrack((t) =>
        t && t.id === id ? { ...t, title: data.title, coverDataUrl: data.coverDataUrl } : t
      );
    },
    []
  );

  const handleHistoryDelete = useCallback(async (id: string) => {
    setHistory(deleteTrack(id));
    try {
      await deleteTrackAudio(id);
    } catch {
      /* noop */
    }
  }, []);

  const handleDownloadAudio = () => {
    if (!encoded || !track) return;
    downloadBlob(encoded.blob, `${sanitize(track.title)}.${encoded.ext}`);
  };

  const handleShare = async () => {
    if (!track) return;
    try {
      const blob = await (await fetch(track.coverDataUrl)).blob();
      const file = new File([blob], `${sanitize(track.title)}-声景卡片.png`, {
        type: "image/png",
      });
      const navAny = navigator as Navigator & {
        canShare?: (d: ShareData) => boolean;
      };
      if (navAny.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: track.title,
          text: `我用${APP_NAME}生成了一段专属于自己的显化sub：${track.title}`,
        });
        return;
      }
      downloadBlob(blob, `${sanitize(track.title)}-声景卡片.png`);
    } catch {
      /* user cancelled or unsupported */
    }
  };

  const restart = () => {
    if (voiceTake) URL.revokeObjectURL(voiceTake.url);
    if (bgAudio?.url) URL.revokeObjectURL(bgAudio.url);
    if (track) URL.revokeObjectURL(track.audioBlobUrl);
    setAffirmation(null);
    setVoiceTake(null);
    setBgAudio(null);
    setParams(null);
    setTrack(null);
    setEncoded(null);
    setStep("home");
  };

  const startCreate = () => {
    if (quota && !quota.canCreate) {
      alert(quotaExhaustedMessage(quota));
      return;
    }
    if (voiceTake) URL.revokeObjectURL(voiceTake.url);
    if (bgAudio?.url) URL.revokeObjectURL(bgAudio.url);
    if (track) URL.revokeObjectURL(track.audioBlobUrl);
    setInput(null);
    setAffirmation(null);
    setVoiceTake(null);
    setBgAudio(null);
    setParams(null);
    setTrack(null);
    setEncoded(null);
    setSaved(false);
    setStep("input");
  };

  const wizardBack =
    step === "input"
      ? { label: "返回首页", action: restart }
      : step === "affirmation"
        ? { label: "返回", action: () => setStep("input") }
        : step === "record"
          ? { label: "返回修改肯定语", action: () => setStep("affirmation") }
          : step === "background"
            ? { label: "返回重录", action: () => setStep("record") }
            : step === "mixconsole"
              ? { label: "返回背景音", action: () => setStep("background") }
              : step === "result"
                ? { label: "返回首页", action: restart }
                : null;

  return (
    <main className="relative flex min-h-screen flex-col">
      {step !== "home" && (
        <AppTopBar
          icon="In"
          onIconClick={restart}
          iconAriaLabel="返回首页"
          backLabel={wizardBack?.label}
          onBack={wizardBack?.action}
        />
      )}

      <section
        className={`flex flex-1 ${
          step === "home" ? "" : "items-start justify-center px-4 pb-8 pt-1"
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={variants}
            initial="center"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: "easeOut" }}
            className="w-full"
          >
            {step === "home" && (
              <HomeDashboard
                records={history}
                profile={profile}
                theme={theme}
                quota={quota}
                onCreate={startCreate}
                onProfileChange={updateProfile}
                onThemeChange={setTheme}
                onSaveWork={handleHistorySave}
                onDeleteWork={handleHistoryDelete}
              />
            )}
            {step === "input" && (
              <InputStep
                onGenerate={handleFirstGenerate}
                loading={genAff}
                initial={input}
              />
            )}
            {step === "affirmation" && affirmation && (
              <AffirmationStep
                affirmation={affirmation}
                regenerating={genAff}
                onLinesChange={(lines) =>
                  setAffirmation((prev) =>
                    prev
                      ? {
                          ...prev,
                          lines,
                          anchorLine: lines[0] ?? prev.anchorLine,
                        }
                      : prev
                  )
                }
                onRegenerate={handleRegenerate}
                onNext={() => setStep("record")}
              />
            )}
            {step === "record" && affirmation && (
              <RecordStep
                anchorLine={affirmation.anchorLine}
                lines={affirmation.lines}
                initialTake={voiceTake}
                onDone={handleRecordDone}
              />
            )}
            {step === "background" && params && (
              <BackgroundStep
                params={params}
                onParamsChange={setParams}
                bgAudio={bgAudio}
                onBgAudioChange={(a) => {
                  setBgAudio(a);
                  if (a && a.durationSec > 0) {
                    setParams((p) =>
                      p
                        ? {
                            ...p,
                            bgSource: "upload",
                            totalDuration: Math.min(
                              MAX_TOTAL_DURATION,
                              Math.round(a.durationSec)
                            ),
                          }
                        : p
                    );
                  }
                }}
                onNext={() => setStep("mixconsole")}
              />
            )}
            {step === "mixconsole" && params && voiceTake && (
              <MixConsoleStep
                params={params}
                onParamsChange={setParams}
                voiceBlob={voiceTake.blob}
                bgAudio={bgAudio}
                onGenerate={() => handleGenerateTrack(voiceTake)}
                generating={genMix}
              />
            )}
            {step === "result" && track && (
              <ResultStep
                track={track}
                onSave={handleSave}
                onDownloadAudio={handleDownloadAudio}
                onShare={handleShare}
                onRestart={restart}
                onRename={handleRenameTrack}
                onCoverChange={handleCoverChange}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      <footer className="pb-6">
        {step !== "home" && step !== "input" && <ComplianceBar compact />}
      </footer>

      {genMix && <GenerationOverlay progress={progress} />}

      {safety && (
        <SafetyModal
          data={safety}
          onClose={() => setSafety(null)}
          onContinue={continueDespiteSafety}
        />
      )}

    </main>
  );
}
