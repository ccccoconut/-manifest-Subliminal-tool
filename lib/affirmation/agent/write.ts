import type { MoodKey, SoundscapeId, ToneKey, UserInput } from "../../types";
import { resolveSoundscapeId } from "../../constants";
import { callLLMJson } from "./llm";
import {
  WRITE_SYSTEM,
  buildWriteUserPrompt,
} from "./prompts";
import type { PsychDecomposition, SceneClassification, WriteOutput } from "./types";

const VALID_SOUNDSCAPES: SoundscapeId[] = [
  "confidence",
  "calm",
  "focus",
  "reset",
  "sleep", // 兼容旧输出，coerce 时映射到 calm
];
const VALID_MOODS: MoodKey[] = ["gentle", "ethereal", "firm", "bright"];

function coerceWrite(
  raw: Record<string, unknown> | null,
  classification: SceneClassification
): WriteOutput | null {
  if (!raw) return null;

  const lines = Array.isArray(raw.affirmations)
    ? raw.affirmations.map((l) => String(l).trim()).filter(Boolean).slice(0, 10)
    : [];
  if (lines.length < 1) return null;

  const emotionTags = Array.isArray(raw.emotionTags)
    ? raw.emotionTags.map((t) => String(t).trim()).filter(Boolean).slice(0, 4)
    : classification.emotionTags;

  const soundscape = resolveSoundscapeId(
    VALID_SOUNDSCAPES.includes(raw.suggestedSoundscape as SoundscapeId)
      ? (raw.suggestedSoundscape as SoundscapeId)
      : classification.soundscape
  );

  const mood = VALID_MOODS.includes(raw.mood as MoodKey)
    ? (raw.mood as MoodKey)
    : classification.mood;

  let title =
    typeof raw.title === "string" && raw.title.trim()
      ? raw.title.trim()
      : "《我正在稳稳地前行》";
  if (!title.startsWith("《")) title = `《${title.replace(/[《》]/g, "")}》`;

  const anchorLine =
    typeof raw.anchorLine === "string" && raw.anchorLine.trim()
      ? raw.anchorLine.trim()
      : lines[0];

  const scene =
    typeof raw.scene === "string" && raw.scene.trim()
      ? raw.scene.trim()
      : classification.sceneLabel;

  return {
    title,
    scene,
    emotionTags: emotionTags.length ? emotionTags : classification.emotionTags,
    affirmations: lines,
    anchorLine,
    suggestedSoundscape: soundscape,
    mood,
  };
}

/** 节点 3：肯定语写作（LLM 调用 2）。 */
export async function writeAffirmations(
  input: UserInput,
  tone: ToneKey,
  classification: SceneClassification,
  decompose: PsychDecomposition,
  priorReasons: string[] = []
): Promise<WriteOutput | null> {
  const raw = await callLLMJson<Record<string, unknown>>(
    [
      { role: "system", content: WRITE_SYSTEM },
      {
        role: "user",
        content: buildWriteUserPrompt(
          input,
          tone,
          classification,
          decompose,
          priorReasons
        ),
      },
    ],
    800
  );
  const write = coerceWrite(raw, classification);
  if (!write) return null;
  return write;
}
