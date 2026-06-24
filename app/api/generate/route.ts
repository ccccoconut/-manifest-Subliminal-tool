import { NextResponse } from "next/server";
import type {
  Affirmation,
  MoodKey,
  SceneKey,
  SoundscapeId,
  ToneKey,
  UserInput,
} from "@/lib/types";
import { generateFallback } from "@/lib/affirmation/fallback";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/affirmation/prompt";
import { checkSafety, CRISIS_RESOURCES } from "@/lib/safety";

export const runtime = "nodejs";

const VALID_SOUNDSCAPES: SoundscapeId[] = [
  "confidence",
  "calm",
  "focus",
  "reset",
  "sleep",
];
const VALID_MOODS: MoodKey[] = ["gentle", "ethereal", "firm", "bright"];
const VALID_SCENES: SceneKey[] = ["interview", "exam", "sleep", "study", "other"];

// 输出合规兜底：即便提示词已约束，仍对生成文本做一次禁词扫描，命中即回退模板。
const BANNED = [
  /(治愈|治疗|根治|治好)[^，。；\s]{0,4}(焦虑|抑郁|失眠|强迫|恐慌|病)/,
  /不需要(看医生|就医|心理咨询|吃药)/,
  /替代[^，。；\s]{0,3}(治疗|药物|医生|咨询)/,
  /(一定会|必将|包你|保证你|绝对会|百分百)/,
  /(显化|招财|转运|改运|风水|能量场|磁场|宇宙能量|潜意识植入|开运|改变命运)/,
  /频率[^，。；\s]{0,2}(改变|命运|显化)/,
];

function violatesGuardrails(a: Affirmation): boolean {
  const text = [a.title, a.understanding, a.targetState, a.anchorLine, ...a.lines, ...a.strategy].join(" ");
  return BANNED.some((re) => re.test(text));
}

// 肯定语必须现在时、正面、无否定词；只检查朗读内容（title/anchor/lines），不检查 understanding 分析文本。
const NEGATION = /[不没别甭莫勿]|摆脱|拒绝|逃避|避免/;
function hasNegation(a: Affirmation): boolean {
  return NEGATION.test([a.title, a.anchorLine, ...a.lines].join(" "));
}

function coerce(raw: unknown, input: UserInput, tone: ToneKey): Affirmation {
  const fallback = generateFallback(input, tone);
  if (!raw || typeof raw !== "object") return fallback;
  const o = raw as Record<string, unknown>;

  const lines = Array.isArray(o.affirmations)
    ? o.affirmations.map((l) => String(l).trim()).filter(Boolean).slice(0, 8)
    : [];
  if (lines.length < 1) return fallback; // 质量不足，回退

  const tags = Array.isArray(o.emotionTags)
    ? o.emotionTags.map((t) => String(t).trim()).filter(Boolean).slice(0, 4)
    : fallback.emotionTags;

  const strategy = Array.isArray(o.strategy)
    ? o.strategy.map((s) => String(s).trim()).filter(Boolean).slice(0, 3)
    : fallback.strategy;

  const soundscape = VALID_SOUNDSCAPES.includes(
    o.suggestedSoundscape as SoundscapeId
  )
    ? (o.suggestedSoundscape as SoundscapeId)
    : fallback.suggestedSoundscape;

  const mood = VALID_MOODS.includes(o.mood as MoodKey)
    ? (o.mood as MoodKey)
    : fallback.mood;

  let title =
    typeof o.title === "string" && o.title.trim() ? o.title.trim() : fallback.title;
  if (!title.startsWith("《")) title = `《${title.replace(/[《》]/g, "")}》`;

  const str = (v: unknown, f: string) =>
    typeof v === "string" && v.trim() ? v.trim() : f;

  return {
    title,
    scene: str(o.scene, fallback.scene),
    emotionTags: tags.length ? tags : fallback.emotionTags,
    understanding: str(o.understanding, fallback.understanding),
    targetState: str(o.targetState, fallback.targetState),
    strategy: strategy.length ? strategy : fallback.strategy,
    lines,
    anchorLine: str(o.anchorLine, lines[0] ?? fallback.anchorLine),
    suggestedSoundscape: soundscape,
    mood,
    source: "deepseek",
  };
}

async function callDeepSeek(
  input: UserInput,
  tone: ToneKey
): Promise<Affirmation | null> {
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  if (!key) return null;

  const base = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(
    /\/$/,
    ""
  );
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(input, tone) },
        ],
        response_format: { type: "json_object" },
        temperature: 1.0,
        max_tokens: 1100,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error("DeepSeek error", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      if (!m) return null;
      parsed = JSON.parse(m[0]);
    }
    return coerce(parsed, input, tone);
  } catch (err) {
    console.error("DeepSeek request failed", err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

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

  let ai = await callDeepSeek(input, tone);
  if (ai && (violatesGuardrails(ai) || hasNegation(ai))) {
    console.warn("DeepSeek output hit guardrails/negation, falling back to template");
    ai = null;
  }
  const affirmation = ai ?? generateFallback(input, tone);

  return NextResponse.json({ affirmation });
}
