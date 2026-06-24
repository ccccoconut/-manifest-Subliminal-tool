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

// 注意：titles / anchor / base / gentle / firm 全部为「现在时 + 第一人称 + 纯正面、无否定词」。
// understanding / targetState / strategy 是 AI 分析（展示用），不参与「无否定词」约束。
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
    titles: ["适合我的岗位正在靠近", "我的价值被清晰看见", "我正在进入新的阶段"],
    anchor: "适合我的岗位正在向我靠近。",
    emotionTags: ["紧张", "压力", "自我怀疑", "需要底气"],
    base: [
      "适合我的岗位正在向我靠近。",
      "我的价值被清晰看见，机会自然回应我。",
      "获得理想结果的我，正在稳定进入新的阶段。",
      "面试官看见我的真实能力，我安心迎接好结果。",
      "我拥有匹配岗位的能力，也拥有被选择的价值。",
    ],
    gentle: ["获得理想机会的我，正在安心展开新的生活。"],
    firm: ["我的表达被清晰接收，机会正在稳定靠近我。"],
  },
  {
    key: "relationship",
    keywords: ["复合", "联系", "主动", "他", "她", "关系", "后续", "前任", "回应", "靠近", "选择", "喜欢我", "爱我"],
    soundscape: "calm",
    mood: "gentle",
    scene: "关系牵挂时 / 想被回应时",
    understanding: "你真正想要的不是追逐，而是确认这段连接仍然拥有温度与后续。",
    targetState: "被回应、被选择、稳定连接",
    strategy: ["稳住被选择感", "恢复关系确定感", "把焦点放回自身价值"],
    titles: ["我值得被主动靠近", "我们的连接正在稳定恢复", "这段关系拥有温暖后续"],
    anchor: "我值得被主动靠近，也值得被坚定选择。",
    emotionTags: ["关系牵挂", "需要回应", "被选择感", "连接感"],
    base: [
      "我值得被主动靠近，也值得被坚定选择。",
      "我们的连接正在自然稳定地恢复。",
      "这段关系拥有清晰而温暖的后续。",
      "被真诚回应的我，正在安心享受关系里的靠近。",
      "我被珍惜、被看见，也被认真放在心上。",
    ],
    gentle: ["被温柔回应的我，正在感受稳定而真诚的连接。"],
    firm: ["我被坚定选择，也被真诚回应。"],
  },
  {
    key: "business",
    keywords: ["客户", "买单", "付费", "事业", "赚钱", "收入", "订单", "合作", "成交", "内容", "咨询", "流量", "变现", "报价"],
    soundscape: "confidence",
    mood: "bright",
    scene: "事业发展时 / 接客户前",
    understanding: "你在意自己的价值能否被市场看见，也期待合适的人主动为你的能力付费。",
    targetState: "被看见、被选择、稳定变现",
    strategy: ["确认价值感", "连接精准客户", "弱化用力感"],
    titles: ["我的价值正在稳定变现", "适合我的客户正在靠近", "我的内容吸引真正需要的人"],
    anchor: "我的内容吸引真正需要我的人。",
    emotionTags: ["事业期待", "价值感", "客户连接", "收入增长"],
    base: [
      "我的内容吸引真正需要我的人。",
      "我的价值值得被看见，也值得被付费。",
      "适合我的客户正在主动向我靠近。",
      "拥有稳定收入的我，正在轻松承接更多合作。",
      "我的专业能力被清晰看见，合作自然发生。",
    ],
    gentle: ["我的价值温柔而清晰地被真正需要的人看见。"],
    firm: ["适合我的客户主动合作，我的价值稳定变现。"],
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
    titles: ["今晚我安心地休息", "我正在慢慢沉静下来", "夜里，我把自己交给安宁"],
    anchor: "今天圆满了，我此刻安心地休息。",
    emotionTags: ["焦虑", "内耗", "疲惫", "需要安放"],
    base: [
      "此刻我慢慢呼吸，我的身体渐渐松软。",
      "今天已经圆满，我安心地放松下来。",
      "我把白天轻轻放下，我享受此刻的宁静。",
      "想法静静飘过，我安住在平静里。",
      "明天的事交给明天，今晚我安然入睡。",
    ],
    gentle: ["我让全身慢慢松软，安然沉入夜色。"],
    firm: ["我安心地放下今天，明天我重新出发。"],
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
    titles: ["我正在温柔地拥抱自己", "我本来就值得被珍惜", "我可以重新出发"],
    anchor: "我此刻温柔地拥抱自己，我值得被珍惜。",
    emotionTags: ["自我怀疑", "低自我价值", "委屈", "需要被肯定"],
    base: [
      "我此刻温柔地对待自己，我值得被珍惜。",
      "我用自己的方式认真生活，我为此自豪。",
      "我按自己的节奏前行，我安心做我自己。",
      "我像对待好朋友一样善待自己。",
      "我身上有许多闪光的地方，我看见它们。",
    ],
    gentle: ["我先好好抱抱现在的自己，我值得温柔。"],
    firm: ["我重新站起来，我相信自己越来越好。"],
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
    titles: ["我正在成为更自信的自己", "我勇敢地为自己争取", "我拥有自己的节奏"],
    anchor: "我现在充满底气，我勇敢地为自己争取。",
    emotionTags: ["期待", "想改变", "需要动力", "向前"],
    base: [
      "我正在一步步成为更自信的自己。",
      "我勇敢地为自己想要的开口。",
      "我珍惜每一个小小的前进。",
      "我有权利争取属于我的机会。",
      "我喜欢正在努力的这个自己。",
    ],
    gentle: ["我从容生长，自信在我心里一点点长大。"],
    firm: ["我主动出击，我把想法变成行动。"],
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
    titles: ["我现在稳稳地专注", "我正在一件件完成", "此刻，我只做这一件事"],
    anchor: "我现在全神贯注，我专注地完成眼前这件事。",
    emotionTags: ["压力", "分心", "拖延", "需要稳定"],
    base: [
      "我现在专注于眼前这一件事。",
      "我把事情一件件做好，我享受完成的踏实。",
      "我现在就开始，状态随之而来。",
      "我每完成一点，我都在向前。",
      "我安排好自己的节奏，我从容高效。",
    ],
    gentle: ["我温柔地把注意力带回当下，我很稳。"],
    firm: ["我从最重要的一步开始，我掌控我的时间。"],
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
  titles: ["我正在慢慢稳定下来", "此刻，我对自己温柔", "我允许自己慢慢来"],
  anchor: "此刻我慢慢呼吸，我安然稳定下来。",
  emotionTags: ["焦虑", "压力", "需要支持"],
  base: [
    "此刻我慢慢呼吸，我渐渐安定。",
    "我允许自己有情绪，我温柔地接住自己。",
    "我已经在认真生活，我为自己骄傲。",
    "我一次照顾好一件事，我从容自在。",
    "我值得被好好对待，我先善待我自己。",
  ],
  gentle: ["我先照顾好现在的自己，我值得安心。"],
  firm: ["我有力量面对接下来的事，我稳稳的。"],
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

/** 基于关键词的本地肯定语生成（无 API key 时兜底，离线可用）。全部正面现在时。 */
export function generateFallback(input: UserInput, tone: ToneKey): Affirmation {
  const text = `${input.state} ${input.target}`.trim();
  let theme = pickTheme(text || "");
  const sceneKey = SCENE_HINT[input.scene];
  if (sceneKey && theme.key === DEFAULT_THEME.key) {
    theme = THEMES.find((t) => t.key === sceneKey) ?? theme;
  }

  const titleIdx = (input.state.length + tone.length) % theme.titles.length;

  let lines: string[];
  if (tone === "gentle") {
    lines = [...theme.gentle, ...theme.base].slice(0, 3);
  } else if (tone === "firm") {
    lines = [...theme.firm, ...theme.base].slice(0, 3);
  } else {
    lines = theme.base.slice(0, 3);
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
