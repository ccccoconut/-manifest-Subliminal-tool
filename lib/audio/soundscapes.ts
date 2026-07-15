import { getSoundscape, RECIPE_VOICE, type SoundscapeMeta } from "../constants";
import type { BaseHz, MoodKey, RhythmKey, SoundscapeId } from "../types";
import { createNoiseBuffer } from "./noise";

interface MoodProfile {
  brightnessMul: number;
  detune: number;
  octave: number; // 半音偏移
  padMul: number;
  osc: OscillatorType;
}

const MOOD: Record<MoodKey, MoodProfile> = {
  gentle: { brightnessMul: 0.85, detune: 7, octave: 0, padMul: 1.0, osc: "sine" },
  ethereal: { brightnessMul: 1.1, detune: 11, octave: 12, padMul: 0.9, osc: "sine" },
  firm: { brightnessMul: 1.15, detune: 5, octave: 0, padMul: 1.05, osc: "triangle" },
  bright: { brightnessMul: 1.4, detune: 8, octave: 0, padMul: 0.95, osc: "triangle" },
};

const RHYTHM_AMP: Record<RhythmKey, number> = {
  none: 0,
  light: 0.012,
  strong: 0.028,
};

export interface BuildOpts {
  meta: SoundscapeMeta;
  mood: MoodKey;
  rhythm: RhythmKey;
  startTime: number;
  duration: number;
  baseGain?: number;
  fadeOut?: boolean;
  duck?: { start: number; end: number; amount: number };
  /** 整体音调偏移（半音），用于 STEP5「音调」参数 */
  pitchSemitones?: number;
}

export interface BuildResult {
  master: GainNode;
  sources: AudioScheduledSourceNode[];
}

/** 把一段程序化音景写入给定的（在线或离线）AudioContext。 */
export function buildSoundscape(
  ctx: BaseAudioContext,
  destination: AudioNode,
  opts: BuildOpts
): BuildResult {
  const { meta, mood, rhythm, startTime: t0, duration } = opts;
  const a = meta.audio;
  const m = MOOD[mood];
  const pitch = opts.pitchSemitones ?? 0;
  const pitchMul = Math.pow(2, pitch / 12);
  const baseGain = opts.baseGain ?? 1;
  const fadeIn = 2.5;
  const sources: AudioScheduledSourceNode[] = [];

  const master = ctx.createGain();
  master.connect(destination);

  // ---- master envelope (fade in / duck / fade out) ----
  const g = master.gain;
  g.setValueAtTime(0.0001, t0);
  g.linearRampToValueAtTime(baseGain, t0 + fadeIn);
  if (opts.duck && opts.duck.start > t0 + fadeIn) {
    const d = opts.duck;
    // duck 锚点不得早于淡入结束，否则会截断淡入造成爆音
    g.setValueAtTime(baseGain, Math.max(t0 + fadeIn, d.start - 0.3));
    g.linearRampToValueAtTime(baseGain * d.amount, d.start + 0.4);
    g.setValueAtTime(baseGain * d.amount, Math.max(d.start + 0.5, d.end));
    g.linearRampToValueAtTime(baseGain, d.end + 0.9);
  }
  if (opts.fadeOut) {
    const fo = t0 + duration;
    g.setValueAtTime(baseGain, Math.max(t0 + fadeIn, fo - 3));
    g.linearRampToValueAtTime(0.0001, fo);
  }

  const cutoff = Math.min(a.brightness * m.brightnessMul, ctx.sampleRate / 2.2);

  // ---- pad ----
  const padGain = ctx.createGain();
  padGain.gain.value = a.padLevel * m.padMul;
  padGain.connect(master);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = cutoff;
  filter.Q.value = 0.7;
  filter.connect(padGain);

  // slow filter sweep
  const sweep = ctx.createOscillator();
  sweep.frequency.value = 0.05;
  const sweepDepth = ctx.createGain();
  sweepDepth.gain.value = cutoff * 0.3;
  sweep.connect(sweepDepth);
  sweepDepth.connect(filter.frequency);
  sweep.start(t0);
  sweep.stop(t0 + duration + 0.1);
  sources.push(sweep);

  const notes = a.chord;
  for (const interval of notes) {
    const freq = a.rootFreq * Math.pow(2, (interval + m.octave + pitch) / 12);
    for (const sign of [-1, 1]) {
      const osc = ctx.createOscillator();
      osc.type = m.osc;
      osc.frequency.value = freq;
      osc.detune.value = sign * m.detune;
      const ng = ctx.createGain();
      ng.gain.value = 0.42 / notes.length;
      osc.connect(ng);
      ng.connect(filter);
      osc.start(t0);
      osc.stop(t0 + duration + 0.15);
      sources.push(osc);
    }
  }

  // ---- noise / air layer ----
  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = createNoiseBuffer(ctx, a.noiseType, 2.5);
  noiseSrc.loop = true;
  const noiseFilter = ctx.createBiquadFilter();
  if (a.noiseType === "white" && meta.id === "focus") {
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = Math.max(700, cutoff * 0.55);
  } else {
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = Math.max(900, cutoff * 0.8);
  }
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = a.noiseLevel;
  noiseSrc.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(master);
  // breathing modulation
  const breath = ctx.createOscillator();
  breath.frequency.value = 0.08;
  const breathDepth = ctx.createGain();
  breathDepth.gain.value = a.noiseLevel * 0.22;
  breath.connect(breathDepth);
  breathDepth.connect(noiseGain.gain);
  breath.start(t0);
  breath.stop(t0 + duration + 0.1);
  noiseSrc.start(t0);
  noiseSrc.stop(t0 + duration + 0.1);
  sources.push(noiseSrc, breath);

  // ---- subtle stereo shimmer ----
  for (const [sign, pan] of [
    [1, -0.7],
    [-1, 0.7],
  ] as const) {
    const sh = ctx.createOscillator();
    sh.type = "sine";
    sh.frequency.value = a.rootFreq * pitchMul * 2;
    sh.detune.value = sign * 1.2;
    const shGain = ctx.createGain();
    shGain.gain.value = 0.016;
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    sh.connect(shGain);
    shGain.connect(panner);
    panner.connect(master);
    sh.start(t0);
    sh.stop(t0 + duration + 0.1);
    sources.push(sh);
  }

  // ---- rhythmic pulse（极轻呼吸起伏，避免鼓点感） ----
  const amp = RHYTHM_AMP[rhythm];
  if (amp > 0) {
    const pulseGain = ctx.createGain();
    pulseGain.gain.value = 0.0001;
    const pulseFilter = ctx.createBiquadFilter();
    pulseFilter.type = "lowpass";
    pulseFilter.frequency.value = Math.min(220, cutoff * 0.35);
    pulseFilter.Q.value = 0.5;
    pulseFilter.connect(pulseGain);
    pulseGain.connect(master);

    const carrier = ctx.createOscillator();
    carrier.type = "sine";
    carrier.frequency.value = a.rootFreq * pitchMul * 0.25;
    carrier.connect(pulseFilter);
    carrier.start(t0);
    carrier.stop(t0 + duration + 0.1);
    sources.push(carrier);

    const beat = (60 / a.tempo) * 2;
    const end = t0 + duration - 3;
    for (let t = t0 + fadeIn; t < end; t += beat) {
      pulseGain.gain.setValueAtTime(0.0001, t);
      pulseGain.gain.linearRampToValueAtTime(amp, t + beat * 0.42);
      pulseGain.gain.linearRampToValueAtTime(0.0001, t + beat * 0.95);
    }
  }

  return { master, sources };
}

/**
 * 赫兹基准层：叠在配方之上，不同频率用不同增益与轻微谐波着色，
 * 让 432→852 的明暗/厚度差异在试听和合成里都可感知。
 */
export function attachBaseHzTone(
  ctx: BaseAudioContext,
  destination: AudioNode,
  hz: BaseHz,
  startTime: number,
  duration: number,
  sources: AudioScheduledSourceNode[]
): void {
  if (!hz || hz <= 0) return;

  // 低频更「厚」、高频更「薄」：增益随频率略降，避免 852 刺耳
  const level = Math.max(0.05, 0.14 - (hz - 432) * 0.00008);
  const toneGain = ctx.createGain();
  toneGain.gain.setValueAtTime(0.0001, startTime);
  toneGain.gain.linearRampToValueAtTime(level, startTime + 1.2);
  if (duration < 500) {
    toneGain.gain.setValueAtTime(level, Math.max(startTime + 1.3, startTime + duration - 2.5));
    toneGain.gain.linearRampToValueAtTime(0.0001, startTime + duration);
  }
  toneGain.connect(destination);

  // 基频
  const fund = ctx.createOscillator();
  fund.type = "sine";
  fund.frequency.value = hz;
  const fundG = ctx.createGain();
  fundG.gain.value = 1;
  fund.connect(fundG);
  fundG.connect(toneGain);
  fund.start(startTime);
  fund.stop(startTime + duration + 0.1);
  sources.push(fund);

  // 轻微二次谐波：高频选项更「亮」、低频更「暖」
  const harm = ctx.createOscillator();
  harm.type = "sine";
  harm.frequency.value = hz * 2;
  const harmG = ctx.createGain();
  harmG.gain.value = hz >= 700 ? 0.28 : hz >= 550 ? 0.18 : 0.1;
  harm.connect(harmG);
  harmG.connect(toneGain);
  harm.start(startTime);
  harm.stop(startTime + duration + 0.1);
  sources.push(harm);

  // 低频再叠一层极轻的 1/2 次谐波，增加厚度
  if (hz <= 528) {
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.value = hz / 2;
    const subG = ctx.createGain();
    subG.gain.value = 0.22;
    sub.connect(subG);
    subG.connect(toneGain);
    sub.start(startTime);
    sub.stop(startTime + duration + 0.1);
    sources.push(sub);
  }
}

// ----------------- live preview -----------------

export interface PreviewHandle {
  stop: () => void;
}

let activePreview: { ctx: AudioContext; res: BuildResult } | null = null;

/** 实时试听一个音景（循环、无淡出）。会自动停止上一个预览。 */
export async function startPreview(
  id: SoundscapeId,
  mood?: MoodKey,
  rhythm?: RhythmKey,
  pitchSemitones = 0,
  baseHz: BaseHz = 0
): Promise<PreviewHandle> {
  stopPreview();
  const meta = getSoundscape(id);
  const voice = RECIPE_VOICE[meta.id] ?? RECIPE_VOICE.calm;
  const ctx = new AudioContext();
  if (ctx.state === "suspended") await ctx.resume();
  const t0 = ctx.currentTime;
  const res = buildSoundscape(ctx, ctx.destination, {
    meta,
    mood: mood ?? voice.mood,
    rhythm: rhythm ?? voice.rhythm,
    startTime: t0,
    duration: 600,
    baseGain: 0.72,
    fadeOut: false,
    pitchSemitones,
  });
  attachBaseHzTone(ctx, ctx.destination, baseHz, t0, 600, res.sources);
  activePreview = { ctx, res };
  return { stop: stopPreview };
}

export function stopPreview() {
  if (!activePreview) return;
  const { ctx, res } = activePreview;
  activePreview = null;
  try {
    const now = ctx.currentTime;
    res.master.gain.cancelScheduledValues(now);
    res.master.gain.setValueAtTime(res.master.gain.value, now);
    res.master.gain.linearRampToValueAtTime(0.0001, now + 0.4);
    res.sources.forEach((s) => {
      try {
        s.stop(now + 0.5);
      } catch {
        /* already stopped */
      }
    });
    setTimeout(() => ctx.close().catch(() => {}), 700);
  } catch {
    ctx.close().catch(() => {});
  }
}
