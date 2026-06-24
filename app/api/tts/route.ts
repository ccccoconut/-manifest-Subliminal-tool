import { NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { AI_VOICES } from "@/lib/constants";

export const runtime = "nodejs";
export const maxDuration = 30;

const VALID_VOICES = new Set(AI_VOICES.map((v) => v.id));

function withTimeout<T>(p: Promise<T>, ms: number, msg: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(msg)), ms)),
  ]);
}

// SSML 模板会原样注入文本：去掉会破坏 XML 的字符，并限长。
function sanitize(t: string): string {
  return t
    .replace(/[<>&]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

export async function POST(req: Request) {
  let body: { text?: string; voice?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  // 白名单校验，绝不把任意 voice 透传给上游
  const voice =
    typeof body.voice === "string" && VALID_VOICES.has(body.voice)
      ? body.voice
      : AI_VOICES[0].id;
  const text = sanitize(String(body.text ?? ""));
  if (!text) return NextResponse.json({ error: "empty text" }, { status: 400 });

  const tts = new MsEdgeTTS();
  try {
    // setMetadata 会建立 WebSocket，网络异常时可能挂起 —— 加超时兜底
    await withTimeout(
      tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3),
      12_000,
      "tts connect timeout"
    );
    const { audioStream } = tts.toStream(text);

    const audio = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const timer = setTimeout(() => reject(new Error("tts timeout")), 20_000);
      audioStream.on("data", (c: Buffer) => chunks.push(c));
      audioStream.on("end", () => {
        clearTimeout(timer);
        resolve(Buffer.concat(chunks));
      });
      audioStream.on("error", (e: Error) => {
        clearTimeout(timer);
        reject(e);
      });
    });

    if (!audio.length) throw new Error("empty audio");
    return new NextResponse(new Uint8Array(audio), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audio.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("TTS failed", err);
    return NextResponse.json({ error: "tts failed" }, { status: 502 });
  } finally {
    try {
      tts.close();
    } catch {
      /* noop */
    }
  }
}
