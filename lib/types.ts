export type ToneKey = "default" | "gentle" | "firm";

/** Sound Recipe id（声景配方） */
export type SoundscapeId = "confidence" | "calm" | "focus" | "reset" | "sleep";

export type MoodKey = "gentle" | "ethereal" | "firm" | "bright";
export type DistanceKey = "near" | "mid" | "far";
export type RhythmKey = "none" | "light" | "strong";

/** 背景音来源（STEP 4） */
export type BgSource = "recipe" | "upload" | "qqmusic" | "none";

/** AI 定制纯音乐的基准频率（0 = 标准 440Hz） */
export type BaseHz = 0 | 432 | 528 | 639 | 741 | 852;

/** 用户选择的使用场景 */
export type SceneKey = "interview" | "exam" | "sleep" | "study" | "other";

/** 三段式输入：当下状态 / 想抵达的状态 / 不想听到的内容 */
export interface UserInput {
  scene: SceneKey;
  state: string;
  target: string;
  avoid: string;
}

/** AI（或模板兜底）生成的肯定语脚本 */
export interface Affirmation {
  title: string; // 《我正在慢慢稳定下来》
  scene: string; // 适合场景：睡前 / 面试前 / 通勤路上
  emotionTags: string[]; // 焦虑、压力、自我怀疑
  understanding: string; // AI 对状态本质的理解（如：你不是能力不足，而是对未知结果感到失控）
  targetState: string; // 目标状态（如：稳定、自信、可行动）
  strategy: string[]; // 生成策略（如：降低比较感、恢复掌控感、强化行动感）
  lines: string[]; // 5-6 句肯定语
  anchorLine: string; // 核心心声：最适合朗读、最打动人的一句
  suggestedSoundscape: SoundscapeId;
  mood: MoodKey;
  source: "deepseek" | "fallback";
}

/** 音轨混音参数（STEP 4 背景音 + STEP 5 调参台） */
export interface MixParams {
  // 背景音来源
  bgSource: BgSource;
  // 程序化定制配乐（bgSource==="recipe"）
  soundscape: SoundscapeId;
  mood: MoodKey;
  rhythm: RhythmKey;
  baseHz: BaseHz; // AI 定制纯音乐的基准频率
  // 背景音素材
  bgVolume: number; // 0..1
  // 人声素材
  voiceVolume: number; // 0..1（潜听，被背景音覆盖）
  voiceSpeed: number; // 速度 1.0..2.0（playbackRate）
  overlayTracks: number; // 叠加音轨 0..3
  stagger: number; // 音轨交错 0..2 秒
  // 合成效果
  totalDuration: number; // 总时长（秒），默认背景音时长，上限 30min
  binaural: boolean; // 双耳节拍
  binauralHz: number; // 节拍频率 2..14
  effect8d: boolean; // 8D 声像旋转
  distance: DistanceKey; // 混响空间感（内部，默认 mid）
}

/** 上传 / QQ音乐 提供的背景音素材（二进制，单独于 MixParams 携带） */
export interface BgAudio {
  blob: Blob;
  name: string;
  url: string;
  source: "upload" | "qqmusic";
  durationSec: number; // 解码得到的时长，用于默认总时长与截断/铺满提示
}

/** 录音结果 */
export interface VoiceTake {
  blob: Blob;
  url: string;
  durationSec: number;
  mimeType: string;
}

/** 情绪评分（1-5）：紧张程度 + 自信程度 */
export interface EmotionScore {
  tension: number;
  confidence: number;
}

export interface Ratings {
  before: EmotionScore;
  after: EmotionScore;
}

/** 最终生成的音轨 */
export interface Track {
  id: string;
  title: string;
  scene: string;
  emotionTags: string[];
  understanding: string;
  lines: string[];
  anchorLine: string;
  params: MixParams;
  audioBlobUrl: string; // 混音后 mp3 object URL（仅本会话）
  coverDataUrl: string; // 封面 png dataURL
  durationSec: number;
  ratings?: Ratings;
  createdAt: number;
}

export type WizardStep =
  | "input"
  | "affirmation"
  | "record"
  | "background"
  | "mixconsole"
  | "result";
