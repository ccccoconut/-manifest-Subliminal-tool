import { getSoundscape, MAX_DURATION, MIN_DURATION } from "../constants";
import type { DistanceKey, MixParams, VoiceLevelKey } from "../types";
import { createReverbIR } from "./noise";
import { buildSoundscape } from "./soundscapes";

const VOICE_GAIN: Record<VoiceLevelKey, number> = {
  clear: 1.0,
  soft: 0.72,
  surround: 0.92,
};
const REVERB_WET: Record<DistanceKey, number> = {
  near: 0.12,
  mid: 0.28,
  far: 0.52,
};

const SR = 44100;
const VOICE_START = 2.6;

async function decodeVoice(blob: Blob): Promise<AudioBuffer> {
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

/** 离线渲染：人声 + 程序化音景，含 ducking、混响、淡入淡出、归一化。 */
export async function renderMix(
  voiceBlob: Blob,
  params: MixParams,
  onProgress?: (p: number) => void
): Promise<MixResult> {
  onProgress?.(0.05);
  const voiceBuf = await decodeVoice(voiceBlob);
  onProgress?.(0.2);

  const voiceDur = voiceBuf.duration;
  const duration = Math.min(
    MAX_DURATION,
    Math.max(MIN_DURATION, VOICE_START + voiceDur + 3.6)
  );
  const voiceEnd = Math.min(VOICE_START + voiceDur, duration - 1.2);

  const offline = new OfflineAudioContext(2, Math.ceil(duration * SR), SR);

  // master bus → soft limiter → destination
  const bus = offline.createGain();
  const limiter = offline.createDynamicsCompressor();
  limiter.threshold.value = -3;
  limiter.knee.value = 6;
  limiter.ratio.value = 4;
  limiter.attack.value = 0.005;
  limiter.release.value = 0.25;
  bus.connect(limiter);
  limiter.connect(offline.destination);

  // ---- soundscape (ducked under the voice) ----
  buildSoundscape(offline, bus, {
    meta: getSoundscape(params.soundscape),
    mood: params.mood,
    rhythm: params.rhythm,
    startTime: 0,
    duration,
    baseGain: 0.95,
    fadeOut: true,
    duck: { start: VOICE_START, end: voiceEnd, amount: 0.42 },
  });

  // ---- voice chain ----
  const src = offline.createBufferSource();
  src.buffer = voiceBuf;

  const hp = offline.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 95;

  const tone = offline.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = params.distance === "far" ? 3400 : 9000;

  const voiceGain = offline.createGain();
  const vg = VOICE_GAIN[params.voiceLevel];
  // fade in/out on the voice
  voiceGain.gain.setValueAtTime(0.0001, VOICE_START);
  voiceGain.gain.linearRampToValueAtTime(vg, VOICE_START + 0.35);
  voiceGain.gain.setValueAtTime(vg, Math.max(VOICE_START + 0.5, voiceEnd - 1.2));
  voiceGain.gain.linearRampToValueAtTime(0.0001, voiceEnd + 0.6);

  src.connect(hp);
  hp.connect(tone);
  tone.connect(voiceGain);

  // dry path
  const dry = offline.createGain();
  let wetAmt = REVERB_WET[params.distance];
  if (params.voiceLevel === "surround") wetAmt = Math.min(0.7, wetAmt + 0.14);
  // dry + wet 增益之和保持为 1，避免叠加后超过 1.0 触发不必要的限幅
  dry.gain.value = 1 - wetAmt * 0.6;
  voiceGain.connect(dry);
  dry.connect(bus);

  // wet path (reverb)
  const predelay = offline.createDelay();
  predelay.delayTime.value = params.distance === "far" ? 0.06 : 0.02;
  const convolver = offline.createConvolver();
  convolver.buffer = createReverbIR(
    offline,
    params.voiceLevel === "surround" ? 3.2 : 2.4,
    3.0
  );
  const wet = offline.createGain();
  wet.gain.value = wetAmt * 0.6;
  voiceGain.connect(predelay);
  predelay.connect(convolver);
  convolver.connect(wet);
  wet.connect(bus);

  src.start(VOICE_START);
  // 录音过长时把停止时间夹在离线上下文时长内，避免超出渲染区间
  src.stop(Math.min(VOICE_START + voiceDur + 0.05, duration - 0.01));

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
