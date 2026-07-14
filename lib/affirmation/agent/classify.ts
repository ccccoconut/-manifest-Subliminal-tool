import { getScene } from "../../constants";
import type { SceneKey, UserInput } from "../../types";
import { pickTheme, resolveThemeForInput } from "../fallback";
import type { SceneClassification } from "./types";

/** 节点 1：规则 + 关键词场景分类（不调用 LLM）。 */
export function classifyScene(input: UserInput): SceneClassification {
  const theme = resolveThemeForInput(input);
  const sceneLabel =
    input.scene !== "other" ? getScene(input.scene).label : theme.scene;

  return {
    themeKey: theme.key,
    soundscape: theme.soundscape,
    mood: theme.mood,
    sceneLabel,
    emotionTags: theme.emotionTags,
    strategyHints: theme.strategy,
    understandingHint: theme.understanding,
    targetStateHint: theme.targetState,
  };
}
