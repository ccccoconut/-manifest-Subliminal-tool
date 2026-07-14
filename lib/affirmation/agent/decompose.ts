import type {
  Affirmation,
  MoodKey,
  SoundscapeId,
  UserInput,
} from "../../types";
import { callLLMJson } from "./llm";
import {
  DECOMPOSE_SYSTEM,
  buildDecomposeUserPrompt,
} from "./prompts";
import type { PsychDecomposition, SceneClassification } from "./types";

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function strArr(v: unknown, fallback: string[]): string[] {
  if (!Array.isArray(v)) return fallback;
  const arr = v.map((x) => String(x).trim()).filter(Boolean);
  return arr.length ? arr : fallback;
}

/** 节点 2：心理拆解（LLM 调用 1）。 */
export async function decomposePsych(
  input: UserInput,
  classification: SceneClassification
): Promise<PsychDecomposition | null> {
  const raw = await callLLMJson<Record<string, unknown>>(
    [
      { role: "system", content: DECOMPOSE_SYSTEM },
      { role: "user", content: buildDecomposeUserPrompt(input, classification) },
    ],
    600
  );
  if (!raw) return null;

  const strategy = strArr(raw.strategy, classification.strategyHints).slice(0, 3);
  const decomposition: PsychDecomposition = {
    surfaceEvent: str(raw.surfaceEvent, input.state.slice(0, 80)),
    realGoal: str(raw.realGoal, input.target || classification.targetStateHint),
    reverseThought: str(raw.reverseThought, "对结果感到不确定"),
    coreGap: str(raw.coreGap, "确定感"),
    newIdentity: str(raw.newIdentity, "正在稳定前行的我"),
    understanding: str(raw.understanding, classification.understandingHint),
    targetState: str(raw.targetState, classification.targetStateHint),
    strategy,
  };

  if (!decomposition.surfaceEvent || !decomposition.newIdentity) return null;
  return decomposition;
}

/** 将拆解 + 写作结果合并为 Affirmation。 */
export function assembleAffirmation(
  decompose: PsychDecomposition,
  write: {
    title: string;
    scene: string;
    emotionTags: string[];
    lines: string[];
    anchorLine: string;
    suggestedSoundscape: SoundscapeId;
    mood: MoodKey;
  }
): Affirmation {
  let title = write.title.trim();
  if (!title.startsWith("《")) title = `《${title.replace(/[《》]/g, "")}》`;

  return {
    title,
    scene: write.scene,
    emotionTags: write.emotionTags,
    understanding: decompose.understanding,
    targetState: decompose.targetState,
    strategy: decompose.strategy,
    lines: write.lines,
    anchorLine: write.anchorLine,
    suggestedSoundscape: write.suggestedSoundscape,
    mood: write.mood,
    source: "agent",
  };
}

/** 拆解失败时的最小拆解（用分类结果兜底，仍可进入写作节点）。 */
export function fallbackDecomposition(
  input: UserInput,
  classification: SceneClassification
): PsychDecomposition {
  return {
    surfaceEvent: input.state.slice(0, 120),
    realGoal: input.target?.trim() || classification.targetStateHint,
    reverseThought: "对现状感到不确定",
    coreGap: "确定感",
    newIdentity: "正在稳定前行的我",
    understanding: classification.understandingHint,
    targetState: classification.targetStateHint,
    strategy: classification.strategyHints,
  };
}
