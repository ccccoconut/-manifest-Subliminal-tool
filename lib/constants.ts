import type {
  BaseHz,
  BgSource,
  DistanceKey,
  MoodKey,
  RhythmKey,
  SceneKey,
  SoundscapeId,
  ToneKey,
} from "./types";

// ---------------- 品牌 ----------------
export const APP_NAME = "酥饼";
export const APP_TAGLINE = "用你的声音，生成专属于你的显化sub。";

// ---------------- 声景配方 Sound Recipe ----------------
export interface SoundscapeMeta {
  id: SoundscapeId;
  name: string; // 中文配方名：自信 / 放松 …
  en: string; // Confidence / Calm …
  scene: string; // 适用场景
  design: string; // 音乐设计（让技术可见）
  blurb: string; // 一句感性描述
  palette: [string, string, string];
  accent: string;
  audio: {
    rootFreq: number;
    chord: number[];
    brightness: number;
    tempo: number;
    noiseType: "white" | "pink" | "brown";
    noiseLevel: number;
    padLevel: number;
  };
}

export const SOUNDSCAPES: SoundscapeMeta[] = [
  {
    id: "confidence",
    name: "自信",
    en: "Confidence",
    scene: "面试 / 考试 / 汇报前",
    design: "稳定节奏 · 温暖和声 · 人声更清晰",
    blurb: "明亮坚定的挂留和弦与轻微脉冲，给你向前的底气。",
    palette: ["#e8fbc4", "#cef595", "#b1ffec"],
    accent: "#4f9d2e",
    audio: {
      rootFreq: 164.81,
      chord: [0, 5, 7, 12],
      brightness: 1950,
      tempo: 72,
      noiseType: "white",
      noiseLevel: 0.05,
      padLevel: 0.15,
    },
  },
  {
    id: "calm",
    name: "放松",
    en: "Calm",
    scene: "焦虑后 / 睡前 / 需要喘口气",
    design: "慢速氛围 · 轻柔和声 · 低沉暖垫",
    blurb: "饱满温暖的小七和弦，像被轻轻抱住。",
    palette: ["#e8fff9", "#b1ffec", "#cef595"],
    accent: "#2a9d8f",
    audio: {
      // 并入原「安睡」的低沉暖垫与粉噪气声，睡前场景也走放松
      rootFreq: 138.59,
      chord: [0, 3, 7, 10, 14],
      brightness: 880,
      tempo: 52,
      noiseType: "pink",
      noiseLevel: 0.05,
      padLevel: 0.17,
    },
  },
  {
    id: "focus",
    name: "专注",
    en: "Focus",
    scene: "学习 / 工作前",
    design: "低干扰节拍 · 简洁旋律 · 减少歌词感",
    blurb: "均匀的白噪与开放五度，帮你进入稳定的专注。",
    palette: ["#f4ffe0", "#cef595", "#ffe588"],
    accent: "#4f9d2e",
    audio: {
      rootFreq: 196.0,
      chord: [0, 7, 12],
      brightness: 1250,
      tempo: 60,
      noiseType: "white",
      noiseLevel: 0.12,
      padLevel: 0.11,
    },
  },
  {
    id: "reset",
    name: "重启",
    en: "Reset",
    scene: "情绪低落 / 内耗后",
    design: "由低到高的情绪递进 · 呼吸般的起伏",
    blurb: "通透的大调与晨雾般的空气感，带来轻盈的重新开始。",
    palette: ["#fff8e0", "#ffe588", "#cef595"],
    accent: "#c9a227",
    audio: {
      rootFreq: 174.61,
      chord: [0, 4, 7, 14],
      brightness: 1700,
      tempo: 64,
      noiseType: "white",
      noiseLevel: 0.04,
      padLevel: 0.14,
    },
  },
  {
    id: "sleep",
    name: "安睡",
    en: "Sleep",
    scene: "睡前放松",
    design: "低沉暖垫 · 极轻气声 · 慢呼吸",
    blurb: "低沉温柔的暖垫与极轻气声，帮助身体慢下来。",
    palette: ["#e6fff8", "#b1ffec", "#e8fbc4"],
    accent: "#3d8b7a",
    audio: {
      rootFreq: 130.81,
      chord: [0, 3, 7, 14],
      brightness: 760,
      tempo: 50,
      noiseType: "pink",
      noiseLevel: 0.05,
      padLevel: 0.16,
    },
  },
];

/** UI 可选配方（不含安睡；安睡模板已并入「放松」） */
export const SOUNDSCAPE_PICKER_IDS: SoundscapeId[] = [
  "confidence",
  "calm",
  "focus",
  "reset",
];

export const SOUNDSCAPE_PICKER: SoundscapeMeta[] = SOUNDSCAPE_PICKER_IDS.map(
  (id) => SOUNDSCAPES.find((s) => s.id === id)!
);

/** 将已下线的「安睡」映射到「放松」，保留其余 id */
export function resolveSoundscapeId(id: SoundscapeId): SoundscapeId {
  return id === "sleep" ? "calm" : id;
}

export function getSoundscape(id: SoundscapeId): SoundscapeMeta {
  const resolved = resolveSoundscapeId(id);
  return SOUNDSCAPES.find((s) => s.id === resolved) ?? SOUNDSCAPES[0];
}

/** 每个配方自带的氛围/节奏（UI 不再单独选择） */
export const RECIPE_VOICE: Record<
  SoundscapeId,
  { mood: MoodKey; rhythm: RhythmKey }
> = {
  confidence: { mood: "firm", rhythm: "light" },
  calm: { mood: "gentle", rhythm: "none" },
  focus: { mood: "firm", rhythm: "light" },
  reset: { mood: "bright", rhythm: "light" },
  sleep: { mood: "gentle", rhythm: "none" }, // 兼容旧数据 → 实际走 calm
};

// ---------------- 场景 ----------------
export interface SceneMeta {
  key: SceneKey;
  label: string;
  emoji: string;
  hint: string;
}

export const SCENES: SceneMeta[] = [
  { key: "interview", label: "面试 / 汇报前", emoji: "🎯", hint: "想稳定、自信地表达自己" },
  { key: "exam", label: "考试前", emoji: "📝", hint: "想专注、相信自己的准备" },
  { key: "sleep", label: "睡前", emoji: "🌙", hint: "想放下今天、安心入睡" },
  { key: "study", label: "学习 / 工作前", emoji: "📚", hint: "想进入稳定的专注" },
  { key: "other", label: "其他时刻", emoji: "🫧", hint: "只是想对自己好一点" },
];

export function getScene(key: SceneKey): SceneMeta {
  return SCENES.find((s) => s.key === key) ?? SCENES[4];
}

// ---------------- 文案标签 ----------------
export const TONE_LABELS: Record<ToneKey, string> = {
  default: "默认",
  gentle: "更温柔",
  firm: "更坚定",
};

export const MOOD_LABELS: Record<MoodKey, string> = {
  gentle: "温柔",
  ethereal: "空灵",
  firm: "坚定",
  bright: "明亮",
};

export const DISTANCE_LABELS: Record<DistanceKey, string> = {
  near: "近",
  mid: "中",
  far: "远",
};

export const DISTANCE_HINT: Record<DistanceKey, string> = {
  near: "贴耳 · 干声",
  mid: "适中 · 自然混响",
  far: "空间 · 远而朦胧",
};

export const RHYTHM_LABELS: Record<RhythmKey, string> = {
  none: "无",
  light: "轻微",
  strong: "明显",
};

// ---------------- 背景音来源（STEP 4） ----------------
export interface BgSourceMeta {
  key: BgSource;
  label: string;
  emoji: string;
  hint: string;
}

export const BG_SOURCES: BgSourceMeta[] = [
  { key: "recipe", label: "AI生成纯音乐", emoji: "🎼", hint: "4 种氛围配方，可试听" },
  { key: "upload", label: "上传本地音频", emoji: "📁", hint: "" },
  { key: "qqmusic", label: "官方音乐平台(暂未连接)", emoji: "🎵", hint: "" },
];

/** QQ 音乐接入前的曲库候选展示数据 */
export const QQ_DEMO_TRACKS = [
  { title: "晴天", artist: "周杰伦", tag: "舒缓" },
  { title: "夜空中最亮的星", artist: "逃跑计划", tag: "鼓励" },
  { title: "白噪 · 雨夜", artist: "TME 音效库", tag: "助眠" },
  { title: "Lofi 专注", artist: "TME 音效库", tag: "专注" },
];

// ---------------- AI 定制纯音乐 · 赫兹基准频率 ----------------
export interface BaseHzOption {
  hz: BaseHz;
  label: string;
  desc: string;
}

export const BASE_HZ_OPTIONS: BaseHzOption[] = [
  { hz: 432, label: "432Hz", desc: "偏低暖垫，听感更松弛" },
  { hz: 528, label: "528Hz", desc: "中频更亮，听感更展开" },
  { hz: 639, label: "639Hz", desc: "贴近人声区，听感更温和" },
  { hz: 741, label: "741Hz", desc: "高频更清晰，听感更轻盈" },
  { hz: 852, label: "852Hz", desc: "空气感更强，听感更空灵" },
];

// ---------------- 情绪评分维度 ----------------
export interface RatingDim {
  key: "tension" | "confidence";
  label: string;
  lowLabel: string;
  highLabel: string;
  /** 期望聆听后的变化方向 */
  desired: "down" | "up";
}

export const RATING_DIMS: RatingDim[] = [
  { key: "tension", label: "紧张程度", lowLabel: "平静", highLabel: "很紧张", desired: "down" },
  { key: "confidence", label: "自信程度", lowLabel: "很低", highLabel: "很高", desired: "up" },
];

// ---------------- Demo 预设 ----------------
export interface DemoCase {
  label: string;
  scene: SceneKey;
  state: string;
  target: string;
  avoid: string;
}

export const DEMO_CASES: DemoCase[] = [
  {
    label: "面试焦虑",
    scene: "interview",
    state: "我明天有面试，很怕自己答不好，看到别人都有 offer，觉得自己很差。",
    target: "我想更稳定、更相信自己。",
    avoid: "不要太鸡血，不要说空话。",
  },
  {
    label: "睡前内耗",
    scene: "sleep",
    state: "我晚上总是想很多，觉得自己不够好，停不下来。",
    target: "我想放下今天，安心睡觉。",
    avoid: "不要讲大道理。",
  },
  {
    label: "想更自信",
    scene: "other",
    state: "我想变得更自信，更敢争取机会。",
    target: "我想相信自己值得。",
    avoid: "",
  },
];

/** 合成总时长（秒） */
export const MIN_DURATION = 8; // 渲染下限
export const MAX_DURATION = 90; // 旧上限（保留兼容）
export const MIN_TOTAL_DURATION = 15;
export const MAX_TOTAL_DURATION = 1800; // 30 分钟
export const DEFAULT_RECIPE_DURATION = 180; // AI 配乐无固定长度时的默认总时长（3 分钟）

// ---------------- 合规文案 ----------------
export const DISCLAIMER_AUDIO =
  "仅用于日常情绪陪伴，不构成心理咨询、医疗诊断或治疗建议。";
export const DISCLAIMER_VOICE = "本功能仅支持使用本人声音或已获明确授权的声音素材。";
export const DISCLAIMER_RECORD = "我确认本段录音为本人声音，我允许使用生成本次音频。";
