import { getSoundscape, type SoundscapeMeta } from "../constants";
import type { MoodKey, RhythmKey, SoundscapeId } from "../types";
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
  light: 0.05,
  strong: 0.11,
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
    g.setValueAtTime(baseGain, d.start - 0.3);
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
    const freq = a.rootFreq * Math.pow(2, (interval + m.octave) / 12);
    for (const sign of [-1, 1]) {
      const osc = ctx.createOscillator();
      osc.type = m.osc;
      osc.frequency.value = freq;
      osc.detune.value = sign * m.detune;
      const ng = ctx.createGain();
      ng.gain.value = 0.55 / notes.length;
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
    noiseFilter.type = "highpass";
    noiseFilter.frequency.value = 180;
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
  breathDepth.gain.value = a.noiseLevel * 0.4;
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
    sh.frequency.value = a.rootFreq * 2;
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

  // ---- rhythmic pulse ----
  const amp = RHYTHM_AMP[rhythm];
  if (amp > 0) {
    const pulseGain = ctx.createGain();
    pulseGain.gain.value = 0.0001;
    pulseGain.connect(master);
    const carrier = ctx.createOscillator();
    carrier.type = "sine";
    carrier.frequency.value = a.rootFreq / 2;
    carrier.connect(pulseGain);
    carrier.start(t0);
    carrier.stop(t0 + duration + 0.1);
    sources.push(carrier);

    const beat = 60 / a.tempo;
    const end = t0 + duration - 3;
    for (let t = t0 + fadeIn; t < end; t += beat) {
      pulseGain.gain.setValueAtTime(0.0001, t);
      pulseGain.gain.linearRampToValueAtTime(amp, t + beat * 0.14);
      pulseGain.gain.exponentialRampToValueAtTime(0.0001, t + beat * 0.9);
    }
  }

  return { master, sources };
}

// ----------------- live preview -----------------

export interface PreviewHandle {
  stop: () => void;
}

let activePreview: { ctx: AudioContext; res: BuildResult } | null = null;

/** 实时试听一个音景（循环、无淡出）。会自动停止上一个预览。 */
export async function startPreview(
  id: SoundscapeId,
  mood: MoodKey,
  rhythm: RhythmKey
): Promise<PreviewHandle> {
  stopPreview();
  const meta = getSoundscape(id);
  const ctx = new AudioContext();
  if (ctx.state === "suspended") await ctx.resume();
  const res = buildSoundscape(ctx, ctx.destination, {
    meta,
    mood,
    rhythm,
    startTime: ctx.currentTime,
    duration: 600,
    baseGain: 0.9,
    fadeOut: false,
  });
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
