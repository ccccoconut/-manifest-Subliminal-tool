"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Stepper from "@/components/ui/Stepper";
import ComplianceBar from "@/components/ui/ComplianceBar";
import SafetyModal, { type SafetyData } from "@/components/ui/SafetyModal";
import HistoryGallery from "@/components/ui/HistoryGallery";
import GenerationOverlay from "@/components/ui/GenerationOverlay";
import InputStep from "@/components/steps/InputStep";
import AffirmationStep from "@/components/steps/AffirmationStep";
import RecordStep from "@/components/steps/RecordStep";
import BackgroundStep from "@/components/steps/SoundscapeStep";
import MixConsoleStep from "@/components/steps/MixConsoleStep";
import ResultStep from "@/components/steps/ResultStep";
import { APP_NAME } from "@/lib/constants";
import { generateFallback } from "@/lib/affirmation/fallback";
import { renderMix } from "@/lib/audio/mixer";
import { encodeTrack, type EncodedAudio } from "@/lib/audio/encode";
import { generateCover, makeThumb } from "@/lib/cover/generateCover";
import {
  deleteTrack,
  loadHistory,
  saveTrack,
  type TrackRecord,
} from "@/lib/history";
import type {
  Affirmation,
  BgAudio,
  MixParams,
  Ratings,
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

function defaultParams(aff: Affirmation): MixParams {
  const lively =
    aff.mood === "bright" ||
    aff.suggestedSoundscape === "confidence" ||
    aff.suggestedSoundscape === "reset";
  return {
    bgSource: "recipe",
    soundscape: aff.suggestedSoundscape,
    mood: aff.mood,
    rhythm: lively ? "light" : "none",
    bgVolume: 0.95,
    bgPitch: 0,
    voiceVolume: 1.0,
    voiceSpeed: 1.0,
    voiceLoops: 1,
    distance: "mid",
    binaural: false,
    binauralHz: 7,
    effect8d: false,
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
  return name.replace(/[《》\\/:*?"<>|]/g, "").trim() || "心声调频";
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
  const [step, setStep] = useState<WizardStep>("input");
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
  const [showHistory, setShowHistory] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pending = useRef<{ input: UserInput; tone: ToneKey } | null>(null);

  useEffect(() => {
    setMounted(true);
    setHistory(loadHistory());
  }, []);

  const runGenerate = useCallback(
    async (userInput: UserInput, tone: ToneKey, advance: boolean) => {
      setGenAff(true);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...userInput, tone }),
        });
        const data = await res.json();
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
    setGenMix(true);
    setProgress(0);
    try {
      // 阶段 1-2：理解 / 自我对话（已生成，做叙事性推进）
      await ramp(0, 0.22, 650, setProgress);
      await ramp(0.22, 0.45, 650, setProgress);
      // 阶段 3：混音（真实进度映射到 0.45→0.9）
      const { buffer, durationSec } = await renderMix({
        voiceBlob: take.blob,
        params,
        bgBlob: bgAudio?.blob ?? null,
        onProgress: (p) => setProgress(0.45 + p * 0.45),
      });
      const enc = encodeTrack(buffer);
      const audioBlobUrl = URL.createObjectURL(enc.blob);
      // 阶段 4：封面
      await ramp(0.9, 0.98, 400, setProgress);
      const coverDataUrl = generateCover({
        title: affirmation.title,
        scene: affirmation.scene,
        emotionTags: affirmation.emotionTags,
        soundscape: params.soundscape,
        anchorLine: affirmation.anchorLine,
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
      setEncoded(enc);
      setTrack(t);
      setSaved(false);
      setStep("result");
    } catch (err) {
      console.error(err);
      alert("混音生成失败，请重试或重新录音。");
    } finally {
      setGenMix(false);
    }
  };

  const handleRatingsChange = useCallback((ratings: Ratings) => {
    setTrack((t) => (t ? { ...t, ratings } : t));
  }, []);

  const handleSave = async () => {
    if (!track) return;
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
    };
    setHistory(saveTrack(record));
  };

  const handleDownloadAudio = () => {
    if (!encoded || !track) return;
    downloadBlob(encoded.blob, `${sanitize(track.title)}.${encoded.ext}`);
  };

  const handleDownloadCover = () => {
    if (!track) return;
    fetch(track.coverDataUrl)
      .then((r) => r.blob())
      .then((b) => downloadBlob(b, `${sanitize(track.title)}-封面.png`));
  };

  const handleShare = async () => {
    if (!track) return;
    // 仅分享封面声景卡片（不含本人声音音频），与「分享声景卡片」的承诺一致
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
          text: `我用${APP_NAME}生成了一段属于自己的心声调频：${track.title}`,
        });
        return;
      }
    } catch {
      /* user cancelled or unsupported */
    }
    handleDownloadCover();
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
    setStep("input");
  };

  return (
    <main className="relative flex min-h-screen flex-col">
      <header className="relative px-4 pt-6">
        <Stepper current={step} />
        {mounted && history.length > 0 && step === "input" && (
          <button
            onClick={() => setShowHistory(true)}
            className="absolute right-4 top-5 rounded-full border border-white/12 px-3 py-1.5 text-xs text-[var(--color-mist-soft)] transition-colors hover:border-[var(--color-aura)]/60 hover:text-[var(--color-mist)]"
          >
            我的音轨 {history.length}
          </button>
        )}
      </header>

      <section className="flex flex-1 items-center justify-center px-4 py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: "easeOut" }}
            className="w-full"
          >
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
                onLinesChange={(lines) => setAffirmation({ ...affirmation, lines })}
                onAnchorChange={(anchorLine) =>
                  setAffirmation({ ...affirmation, anchorLine })
                }
                onRegenerate={handleRegenerate}
                onNext={() => setStep("record")}
                onBack={() => setStep("input")}
              />
            )}
            {step === "record" && affirmation && (
              <RecordStep
                anchorLine={affirmation.anchorLine}
                lines={affirmation.lines}
                initialTake={voiceTake}
                onDone={handleRecordDone}
                onQuickGenerate={(take) => {
                  setVoiceTake(take);
                  handleGenerateTrack(take);
                }}
                onBack={() => setStep("affirmation")}
              />
            )}
            {step === "background" && params && (
              <BackgroundStep
                params={params}
                onParamsChange={setParams}
                bgAudio={bgAudio}
                onBgAudioChange={setBgAudio}
                onNext={() => setStep("mixconsole")}
                onBack={() => setStep("record")}
              />
            )}
            {step === "mixconsole" && params && voiceTake && (
              <MixConsoleStep
                params={params}
                onParamsChange={setParams}
                voiceBlob={voiceTake.blob}
                bgAudio={bgAudio}
                onGenerate={() => handleGenerateTrack(voiceTake)}
                onBack={() => setStep("background")}
                generating={genMix}
              />
            )}
            {step === "result" && track && (
              <ResultStep
                track={track}
                saved={saved}
                onSave={handleSave}
                onDownloadAudio={handleDownloadAudio}
                onDownloadCover={handleDownloadCover}
                onShare={handleShare}
                onRestart={restart}
                onRatingsChange={handleRatingsChange}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      <footer className="pb-6">
        <ComplianceBar compact={step === "input"} />
      </footer>

      {genMix && <GenerationOverlay progress={progress} />}

      {safety && (
        <SafetyModal
          data={safety}
          onClose={() => setSafety(null)}
          onContinue={continueDespiteSafety}
        />
      )}

      {showHistory && (
        <HistoryGallery
          records={history}
          onDelete={(id) => setHistory(deleteTrack(id))}
          onClose={() => setShowHistory(false)}
        />
      )}
    </main>
  );
}
