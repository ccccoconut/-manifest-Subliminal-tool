import type {
  Affirmation,
  MoodKey,
  SoundscapeId,
  ToneKey,
  UserInput,
} from "../types";

interface Theme {
  key: string;
  keywords: string[];
  soundscape: SoundscapeId;
  mood: MoodKey;
  scene: string;
  understanding: string;
  targetState: string;
  strategy: string[];
  titles: string[];
  anchor: string;
  emotionTags: string[];
  base: string[];
  gentle: string[];
  firm: string[];
}

const THEMES: Theme[] = [
  {
    key: "interview",
    keywords: ["面试", "考试", "汇报", "答辩", "表现", "上台", "演讲", "比赛", "求职", "找工作", "offer"],
    soundscape: "confidence",
    mood: "firm",
    scene: "面试前 / 行动前 / 通勤路上",
    understanding: "你不是能力不足，而是对未知的结果感到失控。",
    targetState: "稳定、自信、可行动",
    strategy: ["降低比较感", "恢复掌控感", "强化行动感"],
    titles: ["我可以稳定表达自己", "我已经准备好了", "我正在靠近想要的机会"],
    anchor: "我可以紧张，但我依然可以稳定地表达自己。",
    emotionTags: ["紧张", "压力", "自我怀疑", "需要底气"],
    base: [
      "我不需要一次证明全部，我只需要稳定表达自己。",
      "我已经为这次机会做过准备。",
      "我的价值不由一次面试决定。",
      "我可以允许紧张存在，同时继续向前。",
      "我正在靠近适合我的机会。",
    ],
    gentle: ["就算手心出汗，我也可以慢慢把话说清楚。"],
    firm: ["我有能力应对接下来的每一个问题。"],
  },
  {
    key: "sleep",
    keywords: ["睡", "失眠", "晚上", "夜里", "想太多", "内耗", "停不下来", "脑子", "休息", "安睡"],
    soundscape: "sleep",
    mood: "gentle",
    scene: "睡前 / 夜里醒来时",
    understanding: "你不是不够努力，而是白天的紧绷还没有被允许放下。",
    targetState: "放松、安心、可入睡",
    strategy: ["卸下当日紧绷", "把思绪交给夜晚", "回到呼吸"],
    titles: ["今晚我允许自己休息", "我正在慢慢稳定下来", "夜里，我可以放下一些"],
    anchor: "今天已经过去了，我允许自己好好休息。",
    emotionTags: ["焦虑", "内耗", "疲惫", "需要安放"],
    base: [
      "现在这一刻，我可以慢慢呼吸。",
      "今天已经过去了，我允许自己休息。",
      "我不需要在夜里解决所有问题。",
      "想法来了又会走，我只是看着它们经过。",
      "明天的事，明天再说，今晚先让自己安心。",
    ],
    gentle: ["我把白天的紧绷，一点点交给夜色。"],
    firm: ["我选择放下今天，明天重新开始。"],
  },
  {
    key: "doubt",
    keywords: ["不够好", "自我怀疑", "不自信", "否定", "讨厌自己", "没用", "比不上", "配不上", "自卑", "低落", "崩溃"],
    soundscape: "reset",
    mood: "bright",
    scene: "情绪低落时 / 需要支持时",
    understanding: "你不是真的很差，而是此刻被一时的失落盖过了对自己的信任。",
    targetState: "被接住、重新出发",
    strategy: ["先接住情绪", "把焦点拉回自身", "由低到高重启"],
    titles: ["我正在学着对自己温柔", "我本来就值得被在乎", "我可以重新开始"],
    anchor: "我可以先抱抱现在这个有点累的自己。",
    emotionTags: ["自我怀疑", "低自我价值", "委屈", "需要被肯定"],
    base: [
      "我不必完美，也依然值得被在乎。",
      "我已经在用自己的方式努力生活。",
      "我可以慢一点，不和任何人比较。",
      "我正在学着像对待朋友一样对待自己。",
      "我身上有很多别人看不到的好。",
    ],
    gentle: ["就算今天状态不好，我也没有变得不值得。"],
    firm: ["我决定不再用一个错误否定整个自己。"],
  },
  {
    key: "confidence",
    keywords: ["自信", "争取", "机会", "改变", "坚持", "减脂", "健身", "目标", "更好", "成长", "勇敢", "值得"],
    soundscape: "confidence",
    mood: "bright",
    scene: "起床后 / 出门前",
    understanding: "你已经有了想前进的方向，缺的只是一点点为自己开口的底气。",
    targetState: "笃定、敢争取",
    strategy: ["确认自我价值", "把愿望变行动", "允许慢慢长出自信"],
    titles: ["我正在靠近更自信的自己", "我可以勇敢地争取", "我有自己的节奏"],
    anchor: "我可以为自己想要的东西，勇敢地开口。",
    emotionTags: ["期待", "想改变", "需要动力", "向前"],
    base: [
      "我正在一步步成为更自信的自己。",
      "我可以为自己想要的东西开口。",
      "今天的一小步，也是真正的前进。",
      "我有权利争取属于我的机会。",
      "我喜欢正在努力的这个自己。",
    ],
    gentle: ["我不急，自信是一点点长出来的。"],
    firm: ["我会主动去争取，而不是等待。"],
  },
  {
    key: "focus",
    keywords: ["专注", "学习", "拖延", "效率", "工作", "写", "项目", "deadline", "ddl", "分心", "复习"],
    soundscape: "focus",
    mood: "firm",
    scene: "学习 / 工作时",
    understanding: "你不是做不到，而是被太多同时要做的事拉扯，难以开始。",
    targetState: "稳定、可专注",
    strategy: ["缩小到眼前一件事", "先开始再说", "和自己合作"],
    titles: ["我可以稳定地专注", "我正在把事情一件件做完", "此刻，我只做这一件事"],
    anchor: "我现在只需要专注眼前这一件事。",
    emotionTags: ["压力", "分心", "拖延", "需要稳定"],
    base: [
      "我现在只需要专注这一件事。",
      "我不必一次做完所有事，做好眼前的就好。",
      "我可以先开始，状态会跟着到来。",
      "每完成一点，我都在向前。",
      "我可以安排好自己的节奏。",
    ],
    gentle: ["分心了也没关系，我可以温柔地把注意力带回来。"],
    firm: ["我决定从最重要的一步开始。"],
  },
];

const DEFAULT_THEME: Theme = {
  key: "calm",
  keywords: [],
  soundscape: "calm",
  mood: "gentle",
  scene: "需要喘口气时",
  understanding: "你已经很努力地撑着了，此刻只是需要被允许慢下来。",
  targetState: "放松、稳定",
  strategy: ["允许情绪", "回到当下", "先照顾自己"],
  titles: ["我正在慢慢稳定下来", "此刻，我可以对自己好一点", "我允许自己慢下来"],
  anchor: "现在这一刻，我可以慢慢呼吸，慢慢稳定下来。",
  emotionTags: ["焦虑", "压力", "需要支持"],
  base: [
    "现在这一刻，我可以慢慢呼吸。",
    "我允许自己有情绪，也允许自己慢下来。",
    "我已经在尽力地生活了。",
    "我不必把所有事都扛在今天。",
    "我值得被好好对待，包括被我自己。",
  ],
  gentle: ["我可以先照顾好现在的自己。"],
  firm: ["我有能力面对接下来的事。"],
};

function pickTheme(text: string): Theme {
  let best: Theme | null = null;
  let bestScore = 0;
  for (const t of THEMES) {
    const score = t.keywords.reduce(
      (acc, k) => acc + (text.includes(k) ? 1 : 0),
      0
    );
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }
  return best ?? DEFAULT_THEME;
}

const SCENE_HINT: Record<string, string> = {
  interview: "interview",
  exam: "interview",
  sleep: "sleep",
  study: "focus",
};

/** 基于关键词的本地肯定语生成（无 API key 时兜底，离线可用） */
export function generateFallback(input: UserInput, tone: ToneKey): Affirmation {
  const text = `${input.state} ${input.target}`.trim();
  // 优先用显式场景，其次用关键词
  let theme = pickTheme(text || "");
  const sceneKey = SCENE_HINT[input.scene];
  if (sceneKey && theme.key === DEFAULT_THEME.key) {
    theme = THEMES.find((t) => t.key === sceneKey) ?? theme;
  }

  const titleIdx = (input.state.length + tone.length) % theme.titles.length;

  let lines: string[];
  if (tone === "gentle") {
    lines = [...theme.gentle, ...theme.base].slice(0, 5);
  } else if (tone === "firm") {
    lines = [...theme.firm, ...theme.base].slice(0, 5);
  } else {
    lines = theme.base.slice(0, 5);
  }

  return {
    title: theme.titles[titleIdx],
    scene: theme.scene,
    emotionTags: theme.emotionTags,
    understanding: theme.understanding,
    targetState: theme.targetState,
    strategy: theme.strategy,
    lines,
    anchorLine: theme.anchor,
    suggestedSoundscape: theme.soundscape,
    mood: theme.mood,
    source: "fallback",
  };
}
