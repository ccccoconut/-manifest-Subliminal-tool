import type { VoiceTake } from "../types";

function pickMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  if (typeof MediaRecorder === "undefined") return "";
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return "";
}

/** 麦克风录音 + 实时波形分析。 */
export class VoiceRecorder {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private waveData: Uint8Array<ArrayBuffer> | null = null;
  private startedAt = 0;
  private mime = "";

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    this.ctx = new AudioContext();
    const source = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    source.connect(this.analyser);
    this.waveData = new Uint8Array(new ArrayBuffer(this.analyser.fftSize));

    this.mime = pickMimeType();
    this.chunks = [];
    this.recorder = new MediaRecorder(
      this.stream,
      this.mime ? { mimeType: this.mime } : undefined
    );
    this.recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) this.chunks.push(e.data);
    };
    this.recorder.start(200);
    this.startedAt = performance.now();
  }

  /** 当前音量（0-1），用于跳动的可视化。 */
  getLevel(): number {
    if (!this.analyser || !this.waveData) return 0;
    this.analyser.getByteTimeDomainData(this.waveData);
    let sum = 0;
    for (let i = 0; i < this.waveData.length; i++) {
      const v = (this.waveData[i] - 128) / 128;
      sum += v * v;
    }
    return Math.min(1, Math.sqrt(sum / this.waveData.length) * 3.2);
  }

  elapsedSec(): number {
    return this.startedAt ? (performance.now() - this.startedAt) / 1000 : 0;
  }

  async stop(): Promise<VoiceTake> {
    const rec = this.recorder;
    if (!rec) throw new Error("recorder not started");
    const durationSec = this.elapsedSec();
    const blob: Blob = await new Promise((resolve) => {
      rec.onstop = () => {
        resolve(new Blob(this.chunks, { type: this.mime || "audio/webm" }));
      };
      rec.stop();
    });
    this.cleanup();
    return {
      blob,
      url: URL.createObjectURL(blob),
      durationSec,
      mimeType: blob.type,
    };
  }

  cancel(): void {
    try {
      this.recorder?.stop();
    } catch {
      /* noop */
    }
    this.cleanup();
  }

  private cleanup(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.ctx?.close().catch(() => {});
    this.stream = null;
    this.ctx = null;
    this.analyser = null;
    this.recorder = null;
  }
}
