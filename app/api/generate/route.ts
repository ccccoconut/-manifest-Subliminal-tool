import { NextResponse } from "next/server";
import type { SceneKey, ToneKey, UserInput } from "@/lib/types";
import { runAffirmationAgent } from "@/lib/affirmation/agent";
import { checkSafety, CRISIS_RESOURCES } from "@/lib/safety";

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

  const affirmation = await runAffirmationAgent(input, tone);
  return NextResponse.json({ affirmation });
}
