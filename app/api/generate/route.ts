import { NextResponse } from "next/server";
import type { SceneKey, ToneKey, UserInput } from "@/lib/types";
import { runAffirmationAgent } from "@/lib/affirmation/agent";
import { generateFallback } from "@/lib/affirmation/fallback";
import { checkSafety, CRISIS_RESOURCES } from "@/lib/safety";
import { DEVICE_HEADER } from "@/lib/quota/constants";
import { reserveAiCall } from "@/lib/quota/store";

export const runtime = "nodejs";

const VALID_SCENES: SceneKey[] = ["interview", "exam", "sleep", "study", "other"];

export async function POST(req: Request) {
  let body: Partial<UserInput> & { tone?: ToneKey };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const input: UserInput = {
    scene: VALID_SCENES.includes(body.scene as SceneKey)
      ? (body.scene as SceneKey)
      : "other",
    state: (body.state || "").toString().slice(0, 600).trim(),
    target: (body.target || "").toString().slice(0, 300).trim(),
    avoid: (body.avoid || "").toString().slice(0, 300).trim(),
  };
  const tone: ToneKey =
    body.tone === "gentle" || body.tone === "firm" ? body.tone : "default";

  if (!input.state) {
    return NextResponse.json({ error: "empty state" }, { status: 400 });
  }

  const safety = checkSafety(`${input.state} ${input.target} ${input.avoid}`);
  if (safety.triggered) {
    return NextResponse.json({
      safety: { triggered: true, resources: CRISIS_RESOURCES },
    });
  }

  const deviceId = req.headers.get(DEVICE_HEADER);
  const reserved = reserveAiCall(deviceId);

  // 今日作品额度已用尽：不再调用 DeepSeek
  if (!reserved.ok && reserved.error === "QUOTA_TRACK") {
    return NextResponse.json(
      {
        error: "QUOTA_TRACK",
        message: "今日制作次数已用完，请明天再试。删除作品不会返还次数。",
        quota: reserved.snapshot,
      },
      { status: 429 }
    );
  }

  // AI 调用次数用尽：仍返回模板兜底，不扣 DeepSeek
  if (!reserved.ok && reserved.error === "QUOTA_AI") {
    return NextResponse.json({
      affirmation: generateFallback(input, tone),
      quota: reserved.snapshot,
      fallbackReason: "QUOTA_AI",
    });
  }

  if (!reserved.ok) {
    return NextResponse.json(
      {
        affirmation: generateFallback(input, tone),
        fallbackReason: reserved.error,
      },
      { status: 200 }
    );
  }

  const affirmation = await runAffirmationAgent(input, tone);
  return NextResponse.json({
    affirmation,
    quota: reserved.snapshot,
  });
}
