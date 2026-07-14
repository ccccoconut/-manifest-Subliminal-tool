import { NextResponse } from "next/server";
import { DEVICE_HEADER } from "@/lib/quota/constants";
import { consumeTrack, getQuota } from "@/lib/quota/store";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const deviceId = req.headers.get(DEVICE_HEADER);
  const result = getQuota(deviceId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ quota: result.snapshot });
}

export async function POST(req: Request) {
  const deviceId = req.headers.get(DEVICE_HEADER);
  let body: { action?: string; trackId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (body.action === "consume_track") {
    const result = consumeTrack(deviceId, body.trackId);
    if (!result.ok) {
      const status = result.error === "QUOTA_TRACK" ? 429 : 400;
      return NextResponse.json(
        { error: result.error, quota: result.snapshot },
        { status }
      );
    }
    return NextResponse.json({
      ok: true,
      alreadyCounted: result.alreadyCounted,
      quota: result.snapshot,
    });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
