import { Mp3Encoder } from "@breezystack/lamejs";

export interface EncodedAudio {
  blob: Blob;
  ext: "mp3" | "wav";
  mime: string;
}

function floatToInt16(input: Float32Array): Int16Array {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

/** AudioBuffer → MP3（lamejs，纯前端、无版权采样）。 */
export function audioBufferToMp3(buffer: AudioBuffer, kbps = 160): Blob {
  const channels = Math.min(2, buffer.numberOfChannels);
  const sampleRate = buffer.sampleRate;
  const encoder = new Mp3Encoder(channels, sampleRate, kbps);

  const left = floatToInt16(buffer.getChannelData(0));
  const right =
    channels > 1 ? floatToInt16(buffer.getChannelData(1)) : left;

  const blockSize = 1152;
  const data: Uint8Array[] = [];
  for (let i = 0; i < left.length; i += blockSize) {
    const l = left.subarray(i, i + blockSize);
    const r = right.subarray(i, i + blockSize);
    const chunk =
      channels > 1 ? encoder.encodeBuffer(l, r) : encoder.encodeBuffer(l);
    if (chunk.length > 0) data.push(new Uint8Array(chunk));
  }
  const end = encoder.flush();
  if (end.length > 0) data.push(new Uint8Array(end));

  return new Blob(data as BlobPart[], { type: "audio/mpeg" });
}

/** AudioBuffer → WAV（PCM16，零依赖兜底）。 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const channels = Math.min(2, buffer.numberOfChannels);
  const sampleRate = buffer.sampleRate;
  const frames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const dataSize = frames * blockAlign;

  const ab = new ArrayBuffer(44 + dataSize);
  const view = new DataView(ab);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  const chData: Float32Array[] = [];
  for (let ch = 0; ch < channels; ch++) chData.push(buffer.getChannelData(ch));

  let offset = 44;
  for (let i = 0; i < frames; i++) {
    for (let ch = 0; ch < channels; ch++) {
      const s = Math.max(-1, Math.min(1, chData[ch][i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([ab], { type: "audio/wav" });
}

/** 优先 MP3，失败兜底 WAV。 */
export function encodeTrack(buffer: AudioBuffer): EncodedAudio {
  try {
    const blob = audioBufferToMp3(buffer);
    if (blob.size > 1000) return { blob, ext: "mp3", mime: "audio/mpeg" };
  } catch (err) {
    console.warn("mp3 encode failed, falling back to wav", err);
  }
  return { blob: audioBufferToWav(buffer), ext: "wav", mime: "audio/wav" };
}
