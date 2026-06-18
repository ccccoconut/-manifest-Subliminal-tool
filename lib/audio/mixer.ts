import { getSoundscape, MAX_DURATION, MIN_DURATION } from "../constants";
import type { DistanceKey, MixParams } from "../types";
import { createReverbIR } from "./noise";
import { buildSoundscape } from "./soundscapes";

const REVERB_WET: Record<DistanceKey, number> = {
  near: 0.12,
  mid: 0.28,
  far: 0.52,
};

const SR = 44100;
const VOICE_START = 2.6;
const LOOP_GAP = 1.2; // 人声循环之间的间隔（秒）
const DUCK = 0.42;

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

async function decodeAudio(blob: Blob): Promise<AudioBuffer> {
  const arrayBuf = await blob.arrayBuffer();
  const tmp = new AudioContext();
  try {
    return await tmp.decodeAudioData(arrayBuf);
  } finally {
    tmp.close().catch(() => {});
  }
}

export interface MixResult {
  buffer: AudioBuffer;
  durationSec: number;
}

export interface RenderInput {
  voiceBlob: Blob;
  params: MixParams;
  bgBlob?: Blob | null; // 上传/QQ音乐 的背景音
  onProgress?: (p: number) => void;
  /** 短预览模式：把时长压到 N 秒、人声只播一遍、提前入声（用于「全曲试听」） */
  previewSeconds?: number;
}

/** 离线渲染：背景音（音轨1）+ 人声（音轨2）+ 双耳节拍/8D，含 ducking、混响、淡入淡出、归一化。 */
export async function renderMix({
  voiceBlob,
  params,
  bgBlob,
  onProgress,
  previewSeconds,
}: RenderInput): Promise<MixResult> {
  onProgress?.(0.05);
  const voiceBuf = await decodeAudio(voiceBlob);

  let bgBuf: AudioBuffer | null = null;
  if (params.bgSource === "upload" && bgBlob) {
    try {
      bgBuf = await decodeAudio(bgBlob);
    } catch {
      bgBuf = null;
    }
  }
  onProgress?.(0.2);

  const isPreview = !!previewSeconds;
  const vStart = isPreview ? 1.2 : VOICE_START;
  const speed = clamp(params.voiceSpeed, 0.5, 10);
  const voicePlay = voiceBuf.duration / speed;
  const requestedLoops = isPreview ? 1 : clamp(Math.round(params.voiceLoops), 1, 4);
  // 只排能在 MAX_DURATION 内完整播放的循环，避免后面的循环越界变静音
  const maxLoops = Math.max(
    1,
    Math.floor((MAX_DURATION - vStart - 3.6 + LOOP_GAP) / (voicePlay + LOOP_GAP))
  );
  const loops = Math.min(requestedLoops, maxLoops);
  const totalVoice = voicePlay * loops + LOOP_GAP * (loops - 1);
  const duration = isPreview
    ? Math.max(4, previewSeconds as number)
    : clamp(VOICE_START + totalVoice + 3.6, MIN_DURATION, MAX_DURATION);
  const voiceRegionEnd = Math.min(vStart + totalVoice, duration - 1.0);

  const offline = new OfflineAudioContext(2, Math.ceil(duration * SR), SR);

  // ---- master bus → soft limiter → destination ----
  const bus = offline.createGain();
  const limiter = offline.createDynamicsCompressor();
  limiter.threshold.value = -3;
  limiter.knee.value = 6;
  limiter.ratio.value = 4;
  limiter.attack.value = 0.005;
  limiter.release.value = 0.25;
  bus.connect(limiter);
  limiter.connect(offline.destination);

  // ---- 音轨 1 · 背景音 ----
  const hasBg =
    params.bgSource === "recipe" ||
    (params.bgSource === "upload" && !!bgBuf);

  if (hasBg) {
    const bgVol = offline.createGain();
    bgVol.gain.value = clamp(params.bgVolume, 0, 1);

    // 8D 自动声像旋转
    if (params.effect8d) {
      const panner = offline.createStereoPanner();
      const lfo = offline.createOscillator();
      lfo.frequency.value = 0.12;
      const lfoGain = offline.createGain();
      lfoGain.gain.value = 0.95;
      lfo.connect(lfoGain);
      lfoGain.connect(panner.pan);
      lfo.start(0);
      lfo.stop(duration);
      bgVol.connect(panner);
      panner.connect(bus);
    } else {
      bgVol.connect(bus);
    }

    if (params.bgSource === "recipe") {
      buildSoundscape(offline, bgVol, {
        meta: getSoundscape(params.soundscape),
        mood: params.mood,
        rhythm: params.rhythm,
        startTime: 0,
        duration,
        baseGain: 1,
        fadeOut: true,
        duck: { start: vStart, end: voiceRegionEnd, amount: DUCK },
        pitchSemitones: params.bgPitch,
      });
    } else if (bgBuf) {
      const src = offline.createBufferSource();
      src.buffer = bgBuf;
      src.loop = true;
      src.playbackRate.value = Math.pow(2, params.bgPitch / 12);
      const g = offline.createGain();
      // 所有自动化事件时间必须严格递增；预览模式 vStart 较早，淡入需在入声前完成
      const bgFadeIn = Math.min(2.5, Math.max(0.4, vStart - 0.4));
      const duckStart = Math.max(bgFadeIn + 0.05, vStart - 0.3);
      const duckEnd = Math.max(duckStart + 0.4, voiceRegionEnd);
      g.gain.setValueAtTime(0.0001, 0);
      g.gain.linearRampToValueAtTime(1, bgFadeIn); // 淡入
      g.gain.setValueAtTime(1, duckStart);
      g.gain.linearRampToValueAtTime(DUCK, duckStart + 0.4); // duck 下压
      g.gain.setValueAtTime(DUCK, duckEnd);
      g.gain.linearRampToValueAtTime(1, duckEnd + 0.9); // 回升
      g.gain.setValueAtTime(1, Math.max(duckEnd + 1, duration - 3));
      g.gain.linearRampToValueAtTime(0.0001, duration); // 淡出
      src.connect(g);
      g.connect(bgVol);
      src.start(0);
      src.stop(duration);
    }
  }

  // ---- 双耳节拍（中性声音设计，不宣称疗效） ----
  if (params.binaural) {
    const baseF = 110;
    const beat = clamp(params.binauralHz, 2, 14);
    for (const [f, pan] of [
      [baseF, -1],
      [baseF + beat, 1],
    ] as const) {
      const o = offline.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = offline.createGain();
      g.gain.value = 0.04;
      const p = offline.createStereoPanner();
      p.pan.value = pan;
      o.connect(g);
      g.connect(p);
      p.connect(bus);
      o.start(0);
      o.stop(duration);
    }
  }

  // ---- 音轨 2 · 人声（变速 + 循环 + 混响） ----
  const wet = REVERB_WET[params.distance];
  const predelay = offline.createDelay();
  predelay.delayTime.value = params.distance === "far" ? 0.06 : 0.02;
  const convolver = offline.createConvolver();
  convolver.buffer = createReverbIR(offline, 2.6, 3.0);
  const wetGain = offline.createGain();
  wetGain.gain.value = wet;
  predelay.connect(convolver);
  convolver.connect(wetGain);
  wetGain.connect(bus);

  const vol = clamp(params.voiceVolume, 0, 1.2);
  for (let i = 0; i < loops; i++) {
    const start = vStart + i * (voicePlay + LOOP_GAP);
    const end = start + voicePlay;

    const src = offline.createBufferSource();
    src.buffer = voiceBuf;
    src.playbackRate.value = speed;

    const hp = offline.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 95;
    const tone = offline.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = params.distance === "far" ? 3400 : 9000;

    const vg = offline.createGain();
    vg.gain.setValueAtTime(0.0001, start);
    vg.gain.linearRampToValueAtTime(vol, start + 0.3);
    vg.gain.setValueAtTime(vol, Math.max(start + 0.4, end - 0.5));
    vg.gain.linearRampToValueAtTime(0.0001, end + 0.4);

    src.connect(hp);
    hp.connect(tone);
    tone.connect(vg);

    const dry = offline.createGain();
    dry.gain.value = 1 - wet * 0.5;
    vg.connect(dry);
    dry.connect(bus);

    vg.connect(predelay);

    src.start(start);
    src.stop(Math.min(end + 0.05, duration - 0.01));
  }

  onProgress?.(0.35);
  const rendered = await offline.startRendering();
  onProgress?.(0.9);

  normalize(rendered, 0.9);
  onProgress?.(1);

  return { buffer: rendered, durationSec: duration };
}

function normalize(buffer: AudioBuffer, target: number): void {
  let peak = 0;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      const v = Math.abs(data[i]);
      if (v > peak) peak = v;
    }
  }
  if (peak < 1e-5) return;
  const gain = Math.min(4, target / peak);
  if (gain <= 1.01 && gain >= 0.99) return;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) data[i] *= gain;
  }
}
