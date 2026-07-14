import type { ToneKey, UserInput } from "../../types";
import { getScene } from "../../constants";
import type { SceneClassification } from "./types";

const TONE_GUIDE: Record<ToneKey, string> = {
  default: "语气自然平和，温柔但不软弱。",
  gentle: "语气更温柔、包容，像在轻声安慰一个朋友。",
  firm: "语气更坚定、有力量，像在给自己打气。",
};

export const DECOMPOSE_SYSTEM = `你是"酥饼"肯定语 Agent 的心理拆解模块。只做内部分析，不生成肯定语朗读句。

根据用户描述，完成 5 步心理拆解（对应 AFFIRMATION_GUIDELINES）：
1. 表层事件：具体场景
2. 真正目标：想得到什么结果
3. 反向念头：真正害怕什么
4. 核心缺口：价值感/确定感/被选择感/掌控感/行动感/安全感/被看见感 之一
5. 新身份认定：用户应站在哪个"已经拥有/正在成为"的位置

边界：
- 非医疗、非玄学、不绝对化承诺
- understanding 可分析反向念头，但不要用否定词堆砌
- 全部简体中文

只输出 JSON：
{
  "surfaceEvent": "string",
  "realGoal": "string",
  "reverseThought": "string",
  "coreGap": "string",
  "newIdentity": "string",
  "understanding": "一句话点出状态本质",
  "targetState": "短语，如 稳定、自信、可行动",
  "strategy": ["2-3 个生成方向"]
}`;

export function buildDecomposeUserPrompt(
  input: UserInput,
  classification: SceneClassification
): string {
  const sceneLabel = getScene(input.scene).label;
  const target = input.target?.trim() || "（未填写，请根据状态合理推断）";
  return `使用场景：${sceneLabel}
我现在的状态：「${input.state}」
我希望听完后变成的状态：「${target}」

初步场景判断：${classification.themeKey}（${classification.sceneLabel}）
参考理解方向：${classification.understandingHint}
参考目标状态：${classification.targetStateHint}

请完成心理拆解，只返回 JSON。`;
}

export const WRITE_SYSTEM = `你是"酥饼"肯定语 Agent 的写作模块。根据已完成的心理拆解，写出可被用户朗读的中文肯定语。

写作规则（违反会被系统丢弃）：
1. 现在时 + 第一人称 + 纯正面，严禁否定词：不、没、别、避免、摆脱、拒绝、逃离
2. 严禁未来时：我会、我将
3. 严禁把恐惧词写进朗读句：焦虑、拖延、失败、担心、内耗
4. 主体性前置：优先「拥有理想结果的我…」「获得新机会的我…」
5. 场景要具体，紧贴用户名词（面试/offer/客户/关系/收入等），禁止泛泛套话
6. 弱化用力感，关系类不操控对方意志
7. 默认 3-6 句肯定语，每句 10-20 字，最多 10 句
8. title 用《》包裹；anchorLine 10-22 字，是整段灵魂

只输出 JSON：
{
  "title": "《...》",
  "scene": "适合收听的场景",
  "emotionTags": ["3-4 个标签"],
  "affirmations": ["3-6 句肯定语"],
  "anchorLine": "核心心声一句",
  "suggestedSoundscape": "confidence|calm|focus|reset",
  "mood": "gentle|ethereal|firm|bright"
}`;

export function buildWriteUserPrompt(
  input: UserInput,
  tone: ToneKey,
  classification: SceneClassification,
  decompose: {
    surfaceEvent: string;
    realGoal: string;
    reverseThought: string;
    coreGap: string;
    newIdentity: string;
    understanding: string;
    targetState: string;
    strategy: string[];
  },
  priorReasons: string[] = []
): string {
  const base = `用户原话：「${input.state}」
语气：${TONE_GUIDE[tone]}

心理拆解（必须基于此写作，不要偏离）：
- 表层事件：${decompose.surfaceEvent}
- 真正目标：${decompose.realGoal}
- 反向念头：${decompose.reverseThought}
- 核心缺口：${decompose.coreGap}
- 新身份认定：${decompose.newIdentity}
- understanding：${decompose.understanding}
- targetState：${decompose.targetState}
- strategy：${decompose.strategy.join("、")}

场景提示：${classification.sceneLabel}
推荐声景：${classification.soundscape}，氛围：${classification.mood}

请写出肯定语，只返回 JSON。`;

  if (priorReasons.length === 0) return base;

  return (
    base +
    "\n\n你上一版违反了以下规范，请修正后重写，只返回 JSON：\n" +
    priorReasons.map((r, i) => `${i + 1}. ${r}`).join("\n")
  );
}
