import { generateFallback } from "@/lib/affirmation/fallback";
import { MUSIC_LIBRARY } from "@/lib/musicLibrary";
import { getAudioDuration } from "@/lib/audio/mixer";
import type { Affirmation, BgAudio, UserInput, VoiceTake } from "@/lib/types";

/** 开发跳步用的固定输入 */
export const DEV_MOCK_INPUT: UserInput = {
  scene: "other",
  state: "【测试】今天有点累，想让自己更稳定一点。",
  target: "安静、放松、对自己有底气",
  avoid: "",
};

export function createDevAffirmation(): Affirmation {
  return generateFallback(DEV_MOCK_INPUT, "default");
}

/** 生成一段静音 WAV，当作假录音（约 durationSec 秒） */
export function createSilentVoiceTake(durationSec = 6): VoiceTake {
  const sampleRate = 22050;
  const numSamples = Math.floor(durationSec * sampleRate);
  const dataSize = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);
  // PCM samples stay 0 (silence)

  const blob = new Blob([buffer], { type: "audio/wav" });
  return {
    blob,
    url: URL.createObjectURL(blob),
    durationSec,
    mimeType: "audio/wav",
  };
}

/** 拉取曲库第一首作为假背景（失败则返回 null） */
export async function loadDevLibraryBg(): Promise<BgAudio | null> {
  const track = MUSIC_LIBRARY[0];
  if (!track) return null;
  try {
    const res = await fetch(track.file);
    if (!res.ok) return null;
    const blob = await res.blob();
    const durationSec = await getAudioDuration(blob);
    if (durationSec <= 0) return null;
    return {
      blob,
      name: `${track.artist} - ${track.title}`,
      url: URL.createObjectURL(blob),
      source: "library",
      durationSec,
      libraryId: track.id,
    };
  } catch {
    return null;
  }
}
