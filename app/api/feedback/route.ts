import { NextResponse } from "next/server";
import { DEVICE_HEADER } from "@/lib/quota/constants";
import { addFeedback, listFeedbackByDevice } from "@/lib/feedback/store";
import { notifyNewFeedback } from "@/lib/feedback/lark";
import type { FeedbackPublic } from "@/lib/feedback/types";

function parseDeviceId(req: Request): string | null {
  const raw = req.headers.get(DEVICE_HEADER);
  if (!raw) return null;
  const trimmed = raw.trim();
  return /^[a-zA-Z0-9_-]{8,80}$/.test(trimmed) ? trimmed.slice(0, 80) : null;
}

function toPublic(entry: {
  id: string;
  text: string;
  createdAt: number;
  reply?: string;
  repliedAt?: number;
}): FeedbackPublic {
  return {
    id: entry.id,
    text: entry.text,
    createdAt: entry.createdAt,
    reply: entry.reply,
    repliedAt: entry.repliedAt,
  };
}

export async function GET(req: Request) {
  const deviceId = parseDeviceId(req);
  if (!deviceId) {
    return NextResponse.json({ items: [] });
  }
  const items = listFeedbackByDevice(deviceId).map(toPublic);
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  let body: { text?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "无效请求" }, { status: 400 });
  }

  const text = String(body.text ?? "").trim().slice(0, 200);
  if (text.length < 2) {
    return NextResponse.json({ error: "反馈内容太短" }, { status: 400 });
  }

  const deviceId = parseDeviceId(req);

  try {
    const item = addFeedback({
      id: crypto.randomUUID(),
      text,
      deviceId,
      createdAt: Date.now(),
    });
    void notifyNewFeedback(item);
    return NextResponse.json({ ok: true, item: toPublic(item) });
  } catch (err) {
    console.error("[feedback] persist failed", err);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
