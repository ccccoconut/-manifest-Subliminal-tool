/** 危机/自伤关键词检测。命中时产品应弹出安全提示与求助资源，而非直接生成。 */
const CRISIS_PATTERNS = [
  "自杀",
  "自残",
  "自伤",
  "想死",
  "不想活",
  "活不下去",
  "活不下来",
  "结束生命",
  "结束自己",
  "轻生",
  "了结自己",
  "不想活了",
  "没有意义活着",
  "活着没意思",
  "活着没意义",
  "跳楼",
  "一了百了",
  "杀了",
  "伤害别人",
  "报复社会",
];

export interface SafetyResult {
  triggered: boolean;
  matched: string[];
}

export function checkSafety(text: string): SafetyResult {
  const lower = text.toLowerCase();
  const matched = CRISIS_PATTERNS.filter((p) => lower.includes(p));
  return { triggered: matched.length > 0, matched };
}

export const CRISIS_RESOURCES = [
  { name: "全国 24 小时心理援助热线", phone: "400-161-9995" },
  { name: "北京心理危机研究与干预中心", phone: "010-82951332" },
  { name: "希望 24 热线", phone: "400-161-9995" },
];
