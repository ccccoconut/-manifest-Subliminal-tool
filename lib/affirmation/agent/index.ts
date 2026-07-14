import type { ToneKey, UserInput, Affirmation } from "../../types";
import { generateFallback } from "../fallback";
import { validateAffirmation } from "../rules";
import { classifyScene } from "./classify";
import {
  assembleAffirmation,
  decomposePsych,
  fallbackDecomposition,
} from "./decompose";
import { writeAffirmations } from "./write";

const MAX_WRITE_ATTEMPTS = 2;

/**
 * 酥饼肯定语 Agent（路线 A）：编排型多步流水线。
 * classify → decompose → write → validate → repair → fallback
 */
export async function runAffirmationAgent(
  input: UserInput,
  tone: ToneKey
): Promise<Affirmation> {
  const classification = classifyScene(input);
  console.info("[agent] classified", classification.themeKey, classification.soundscape);

  let decompose = await decomposePsych(input, classification);
  if (!decompose) {
    console.warn("[agent] decompose failed, using rule-based decomposition");
    decompose = fallbackDecomposition(input, classification);
  }

  let reasons: string[] = [];
  for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt++) {
    const write = await writeAffirmations(
      input,
      tone,
      classification,
      decompose,
      attempt === 0 ? [] : reasons
    );
    if (!write) {
      console.warn(`[agent] write failed (attempt ${attempt + 1})`);
      break;
    }

    const candidate = assembleAffirmation(decompose, {
      title: write.title,
      scene: write.scene,
      emotionTags: write.emotionTags,
      lines: write.affirmations,
      anchorLine: write.anchorLine,
      suggestedSoundscape: write.suggestedSoundscape,
      mood: write.mood,
    });

    reasons = validateAffirmation(candidate);
    if (reasons.length === 0) {
      console.info("[agent] success", { theme: classification.themeKey, attempt: attempt + 1 });
      return candidate;
    }
    console.warn(
      `[agent] validation failed (attempt ${attempt + 1}/${MAX_WRITE_ATTEMPTS}): ${reasons.join("; ")}`
    );
  }

  console.warn("[agent] falling back to template");
  return generateFallback(input, tone);
}
