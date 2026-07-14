import type { MoodKey, SoundscapeId } from "../../types";

/** 规则引擎识别的场景分类结果（节点 1）。 */
export interface SceneClassification {
  themeKey: string;
  soundscape: SoundscapeId;
  mood: MoodKey;
  sceneLabel: string;
  emotionTags: string[];
  strategyHints: string[];
  understandingHint: string;
  targetStateHint: string;
}

/** 心理拆解结果（节点 2）。 */
export interface PsychDecomposition {
  surfaceEvent: string;
  realGoal: string;
  reverseThought: string;
  coreGap: string;
  newIdentity: string;
  understanding: string;
  targetState: string;
  strategy: string[];
}

/** 写作节点输出（节点 3，尚未与拆解合并）。 */
export interface WriteOutput {
  title: string;
  scene: string;
  emotionTags: string[];
  affirmations: string[];
  anchorLine: string;
  suggestedSoundscape: SoundscapeId;
  mood: MoodKey;
}

export interface AgentMeta {
  themeKey: string;
  attempts: number;
}
