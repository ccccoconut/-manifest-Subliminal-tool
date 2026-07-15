import {
  getSoundscape,
  MAX_TOTAL_DURATION,
  MIN_DURATION,
} from "../constants";
import type { DistanceKey, MixParams } from "../types";
import { createReverbIR } from "./noise";
import { attachBaseHzTone, buildSoundscape } from "./soundscapes";

const REVERB_WET: Record<DistanceKey, number> = {
  near: 0.12,
  mid: 0.22,
  far: 0.45,
};

const VOICE_START = 2.6;
const VOICE_SPEED_MIN = 1;
const VOICE_SPEED_MAX = 5;

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

/** 仅解码取时长（用于「默认总时长 / 截断·铺满」提示）。 */
export async function getAudioDuration(blob: Blob): Promise<number> {
  try {
    const buf = await decodeAudio(blob);
    return buf.duration;
  } catch {
    return 0;
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
  /** 短预览模式：把时长压到 N 秒（用于「试听片段」） */
  previewSeconds?: number;
}

/** 离线渲染：背景音(音轨1) + 潜听人声(音轨2，自动循环铺满) + 赫兹音 + 双耳节拍/8D，含混响、限幅、归一化。 */
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
  if (params.bgSource === "upload" || params.bgSource === "library") {
    if (!bgBlob) {
      throw new Error(
        params.bgSource === "library" ? "未选择曲库背景音" : "未选择背景音频文件"
      );
    }
    try {
      bgBuf = await decodeAudio(bgBlob);
    } catch {
      throw new Error("背景音频解码失败，请换 mp3 / wav / m4a 等格式后重试");
    }
  }
  onProgress?.(0.2);

  const isPreview = !!previewSeconds;
  const vStart = isPreview ? 1.0 : VOICE_START;
  const speed = clamp(params.voiceSpeed, VOICE_SPEED_MIN, VOICE_SPEED_MAX);

  // 总时长：预览取 previewSeconds；否则用 totalDuration（上限 30min）
  const duration = isPreview
    ? Math.max(4, previewSeconds as number)
    : clamp(params.totalDuration || 60, MIN_DURATION, MAX_TOTAL_DURATION);

  // 长音频自适应降采样，控制内存与编码耗时
  const SR = duration > 600 ? 16000 : duration > 240 ? 32000 : 44100;

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

  // ---- 音轨 1 · 背景音（潜听设计：不做 ducking，背景保持饱满，人声在其下） ----
  const hasBg =
    params.bgSource === "recipe" ||
    ((params.bgSource === "upload" || params.bgSource === "library") && !!bgBuf);

  if (hasBg) {
    const bgVol = offline.createGain();
    bgVol.gain.value = clamp(params.bgVolume, 0, 1);

    if (params.effect8d) {
      const panner = offline.createStereoPanner();
      const lfo = offline.createOscillator();
      lfo.frequency.value = 0.1;
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
      const built = buildSoundscape(offline, bgVol, {
        meta: getSoundscape(params.soundscape),
        mood: params.mood,
        rhythm: params.rhythm,
        startTime: 0,
        duration,
        baseGain: 1,
        fadeOut: true,
      });
      // 赫兹基准频率：叠一层可感知的基准音色（与试听一致）
      attachBaseHzTone(
        offline,
        bgVol,
        params.baseHz,
        0,
        duration,
        built.sources
      );
    } else if (bgBuf) {
      const src = offline.createBufferSource();
      src.buffer = bgBuf;
      src.loop = true; // 时长 > 原音频 → 自动循环铺满；时长 < 原音频 → stop 截断
      const g = offline.createGain();
      g.gain.setValueAtTime(0.0001, 0);
      g.gain.linearRampToValueAtTime(1, Math.min(2.5, duration * 0.15));
      g.gain.setValueAtTime(1, Math.max(2.6, duration - 2.5));
      g.gain.linearRampToValueAtTime(0.0001, duration);
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

  // ---- 音轨 2 · 人声（潜听：自动循环铺满全长 + 叠加音轨 + 交错） ----
  const wet = REVERB_WET[params.distance ?? "mid"];
  const predelay = offline.createDelay();
  predelay.delayTime.value = 0.02;
  const convolver = offline.createConvolver();
  convolver.buffer = createReverbIR(offline, 2.4, 3.0);
  const wetGain = offline.createGain();
  wetGain.gain.value = wet;
  predelay.connect(convolver);
  convolver.connect(wetGain);
  wetGain.connect(bus);

  // 潜听人声：UI 0..1 映射为相对背景音的小声量，保证整轨都低于背景
  // 滑杆 100% ≈ 背景音量的 10%；5% ≈ 背景的 0.5%，接近「仅沙沙感」
  const bgGain = hasBg ? clamp(params.bgVolume, 0, 1) : 1;
  const voiceUi = clamp(params.voiceVolume, 0, 1);
  const SUBLIMINAL_RATIO = 0.1;
  const vol = hasBg
    ? voiceUi * bgGain * SUBLIMINAL_RATIO
    : voiceUi * 0.22;
  const layers = 1 + clamp(Math.round(params.overlayTracks), 0, 3);
  const stagger = clamp(params.stagger, 0, 2);
  const voiceEnd = duration - 0.6;

  for (let k = 0; k < layers; k++) {
    const start = vStart + k * stagger;
    if (start >= voiceEnd - 0.5) break;

    const src = offline.createBufferSource();
    src.buffer = voiceBuf;
    src.loop = true; // 自动循环匹配背景音频长度
    src.playbackRate.value = speed;

    const hp = offline.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 95;

    const layerVol = vol * (k === 0 ? 1 : 0.78);
    const vg = offline.createGain();
    vg.gain.setValueAtTime(0.0001, start);
    vg.gain.linearRampToValueAtTime(layerVol, start + 0.5);
    vg.gain.setValueAtTime(layerVol, Math.max(start + 0.6, voiceEnd - 0.8));
    vg.gain.linearRampToValueAtTime(0.0001, voiceEnd);

    const panner = offline.createStereoPanner();
    panner.pan.value = layers > 1 ? (k / (layers - 1) - 0.5) * 1.0 : 0;

    src.connect(hp);
    hp.connect(vg);
    vg.connect(panner);

    const dry = offline.createGain();
    dry.gain.value = 1 - wet * 0.5;
    panner.connect(dry);
    dry.connect(bus);
    panner.connect(predelay);

    src.start(start);
    src.stop(voiceEnd + 0.2);
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
