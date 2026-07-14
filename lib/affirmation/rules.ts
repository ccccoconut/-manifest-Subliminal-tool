import type { Affirmation } from "../types";

/** 合规禁词：医疗化 / 绝对化 / 玄学 */
export const BANNED: { re: RegExp; reason: string }[] = [
  { re: /(治愈|治疗|根治|治好)[^，。；\s]{0,4}(焦虑|抑郁|失眠|强迫|恐慌|病)/, reason: "出现医疗化承诺（治愈/治疗某症状）" },
  { re: /不需要(看医生|就医|心理咨询|吃药)/, reason: "劝阻就医（不需要看医生/吃药）" },
  { re: /替代[^，。；\s]{0,3}(治疗|药物|医生|咨询)/, reason: "宣称替代医疗（替代治疗/药物/医生）" },
  { re: /(一定会|必将|包你|保证你|绝对会|百分百|必然)/, reason: "使用绝对化承诺（一定/必然/保证/百分百）" },
  { re: /(显化|招财|转运|改运|风水|能量场|磁场|宇宙能量|潜意识植入|开运|改变命运)/, reason: "出现玄学词（显化/招财/能量场/改变命运等）" },
  { re: /频率[^，。；\s]{0,2}(改变|命运|显化)/, reason: "出现神秘频率说法" },
];

export const NEGATION = /[不没别甭莫勿]|摆脱|拒绝|逃避|逃离|避免/;
export const FUTURE_TENSE = /我(会|将|将会|即将|终将)/;
export const FEAR_WORDS =
  /焦虑|抑郁|拖延|失败|紧张|怀疑|内耗|恐惧|害怕|担心|痛苦|孤独|无助|没人买单|没有后续/;

export const SPOKEN_MIN_LEN = 6;
export const SPOKEN_MAX_LEN = 30;
export const MAX_LINES = 10;
export const MIN_LINES = 3;
export const MAX_LINES_DEFAULT = 6;

/** 返回所有违规原因（空数组 = 通过）。对应 docs/AFFIRMATION_GUIDELINES.md */
export function validateAffirmation(a: Affirmation): string[] {
  const reasons: string[] = [];

  const allText = [
    a.title,
    a.understanding,
    a.targetState,
    a.anchorLine,
    ...a.lines,
    ...a.strategy,
  ].join(" ");
  for (const { re, reason } of BANNED) {
    if (re.test(allText)) reasons.push(reason);
  }

  const spoken = [a.title, a.anchorLine, ...a.lines];
  const spokenText = spoken.join(" ");
  if (NEGATION.test(spokenText)) reasons.push("朗读句中含否定词（不/没/别/避免/摆脱等）");
  if (FUTURE_TENSE.test(spokenText)) reasons.push("朗读句使用了未来时（我会/我将）");
  if (FEAR_WORDS.test(spokenText)) reasons.push("朗读句写进了恐惧/负面概念词（焦虑/拖延/失败/担心等）");

  if (a.lines.length < 1) {
    reasons.push("至少需要 1 句肯定语");
  } else if (a.lines.length > MAX_LINES) {
    reasons.push(`肯定语最多 ${MAX_LINES} 句，当前 ${a.lines.length} 句`);
  }
  const badLen = a.lines.filter(
    (l) => l.length < SPOKEN_MIN_LEN || l.length > SPOKEN_MAX_LEN
  );
  if (badLen.length > 0) {
    reasons.push(`有 ${badLen.length} 句长度不在 ${SPOKEN_MIN_LEN}-${SPOKEN_MAX_LEN} 字之间`);
  }

  return reasons;
}
