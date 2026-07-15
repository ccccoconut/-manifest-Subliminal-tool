# 心声调频 InnerTune

> **用自己的声音，生成一段把自己带回来的音乐。**
> AI 个性化自我对话声景工具 · Build For Music+ 腾讯音乐 AI Hackathon 2026

不是让 AI 替你写一首歌，而是帮你把一句「我不行」，变成一段用自己声音说出的「我可以」。

输入当下状态 → AI **理解情绪并给出生成策略** → 生成第一人称肯定语与一句**核心心声** →
用你自己的声音录下它 → 选一段**声景配方**、调声音参数 → 浏览器内分阶段合成 30–90 秒专属音频 + 封面 →
**记录聆听前后的情绪变化** → 保存 / 隐私安全分享。

整条链路（录音、声景合成、混音、MP3 导出、封面）都在浏览器内完成，**零版权风险、无需重后端**，
唯一的服务端是一次 DeepSeek 文案生成调用。

---

## 情绪转化闭环

```
选场景 → 三段输入 → AI 理解+策略 → 肯定语+核心心声 → 录自己的声音
   → 选背景音 → 逐轨调参 → 分阶段生成 → 情绪前后评分 → 保存/分享
 input   affirmation   record   background   mixconsole   result
```

> 录音后也可点「⚡ 用推荐配乐直接生成」跳过背景音/调参两步，现场 demo 更快。

这条闭环对应黑客松评审最看重的三件事：**可运行**（完整 demo）、**有 WOW**（听到自己的声音说出相关的话）、
**可量化**（聆听前后的情绪评分变化）。

## 快速开始

```bash
cd inner-tune
npm install
npm run dev          # http://localhost:3000
```

> 需要 Node 18+。录音与音频合成需在 `localhost` 或 **HTTPS** 下运行（浏览器麦克风要求安全上下文）。
> 局域网用 `http://内网IP:3000` 访问会被禁用麦克风；分享给他人请用 HTTPS 隧道（如 `cloudflared tunnel --url http://localhost:3000`）。

### 接入 DeepSeek

**不填 key 也能完整跑通**——文案走内置的关键词模板兜底（离线可用、现场 demo 不怕断网）。
填入 key 后自动切换为真实 AI 生成。编辑 `.env.local`：

```bash
DEEPSEEK_API_KEY=sk-xxxxxxxx
DEEPSEEK_BASE_URL=https://api.deepseek.com   # 可选，默认值
DEEPSEEK_MODEL=deepseek-chat                 # 可选，默认值
```

OpenAI 兼容：`POST {BASE_URL}/chat/completions` + `Authorization: Bearer` + `response_format:{type:"json_object"}`。
实现见 [`app/api/generate/route.ts`](app/api/generate/route.ts)、提示词见 [`lib/affirmation/prompt.ts`](lib/affirmation/prompt.ts)。

## 结构化 AI 输出

LLM 返回结构化 JSON，而非一段自然语言——让产品看起来像一个「情绪到音频的生成系统」。
**肯定语规则**：affirmations / anchorLine 必须「现在时 · 第一人称 · 纯正面 · 无任何否定词」
（潜意识只会捕捉被否定的那个词，例 ✗"我不会再拖延" → ✓"我现在充满行动力"）。
提示词强约束 + route 否定词护栏（命中即回退本地正面模板）+ 本地模板本身全正面。

```jsonc
{
  "title": "《我现在稳稳地表达自己》",
  "scene": "面试前",
  "emotionTags": ["紧张", "压力", "自我怀疑"],
  "understanding": "你不是能力不足，而是对未知结果感到失控。",   // AI 理解（分析，可含否定）
  "targetState": "稳定、自信、可行动",
  "strategy": ["降低比较感", "恢复掌控感", "强化行动感"],        // 生成策略
  "affirmations": ["我现在沉稳而清晰，我从容地表达自己。", "…"], // 全正面现在时
  "anchorLine": "我此刻沉稳、清晰，我自信地表达自己。",          // 核心心声
  "suggestedSoundscape": "confidence",
  "mood": "firm"
}
```

## 声景配方 Sound Recipe（程序化、零版权）

| id | 名称 | 适用场景 | 音乐设计 |
| --- | --- | --- | --- |
| `confidence` | 自信 Confidence | 面试 / 考试 / 汇报前 | 稳定节奏 · 温暖和声 · 人声更清晰 |
| `calm` | 放松 Calm | 焦虑后 / 需要喘口气 | 慢速氛围 · 轻柔和声 · 人声更柔和 |
| `focus` | 专注 Focus | 学习 / 工作前 | 低干扰节拍 · 简洁旋律 · 减少歌词感 |
| `reset` | 重启 Reset | 情绪低落 / 内耗后 | 由低到高的情绪递进 · 呼吸般的起伏 |
| `sleep` | 安睡 Sleep | 睡前放松 | 低沉暖垫 · 极轻气声 · 慢呼吸 |

## 背景音 + 混音台（STEP 4 / STEP 5）

**STEP 4 选择背景音**：AI 定制配乐（程序化配方）/ 上传本地音频 / 从 QQ 音乐选择（演示占位壳）/ 不添加。
- 配方可调音乐设计：氛围（温柔/空灵/坚定/明亮）、节奏感（无/轻微/明显）。
- **赫兹基准频率**（AI 定制纯音乐）：标准 440 / 432 / 528 / 639 / 741 / 852Hz，选中后在背景音叠一层对应频率的柔和正弦音。

**STEP 5 调参 · 混音台**（潜听模式：人声以极低音量循环铺在背景音之下）：

| 分区 | 参数 |
| --- | --- |
| 背景音素材 | 音量 |
| 人声素材 | 速度（1.0–2.0x）、音量（潜听，被背景音覆盖）、叠加音轨（0–3 条）、音轨交错（0–2s，叠加≥1 才可调）；人声自动循环铺满全长 |
| 合成效果 | 总时长（默认=背景音时长，<原长自动截断 / >原长循环铺满，上限 30min）、双耳节拍、8D 环绕 |

节奏/声像/环境音作为声音设计参数；赫兹描述为产品文案表达。

## 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | Next.js 15（App Router）+ TypeScript |
| 样式/动效 | Tailwind CSS v4 + Framer Motion |
| 文案生成 | DeepSeek（结构化 JSON）+ 本地模板兜底 |
| 录音 | `MediaRecorder` + `AnalyserNode`（实时波形） |
| 声景 | Web Audio API **程序化合成**（振荡器/噪声/卷积混响），零版权采样 |
| 混音 | `OfflineAudioContext`：ducking、卷积混响、淡入淡出、限幅、峰值归一化 |
| 导出 | `@breezystack/lamejs` 编码 MP3（兜底 WAV） |
| 封面 | Canvas 程序化生成 PNG（含核心心声、AI 标识） |
| 存储 | `localStorage`（仅本地，封面压缩为缩略图） |

## 目录结构

```
app/
  api/generate/route.ts   DeepSeek 调用 + 模板兜底 + 三段输入安全检测
components/
  Studio.tsx              向导状态机（编排全流程 + 四阶段生成）
  steps/                  Input(场景+三段输入) / Affirmation(理解+策略+心声) / Record(核心心声+授权+⚡快捷生成) /
                          SoundscapeStep(STEP4 背景音·4来源) / MixConsoleStep(STEP5 逐轨调参) / Result(情绪前后评分)
  ui/                     Stepper · AudioPlayer · EmotionRating · GenerationOverlay · SafetyModal · HistoryGallery · ComplianceBar
lib/
  audio/                  soundscapes · recorder · mixer · encode · noise
  affirmation/            prompt（DeepSeek，反玄学/反绝对化/反医疗）· fallback（本地模板）
  cover/generateCover.ts  Canvas 封面 + 缩略图
  safety.ts · history.ts · constants.ts · types.ts
docs/
  PROJECT_BRIEF.md · STRATEGY_JUDGING.md · PRD.md
```

## 三个固定 Demo Case

1. **面试焦虑** —「我明天面试，很怕自己答不好，看到别人都有 offer，觉得自己很差。」/「想更稳定、更相信自己」/「不要太鸡血」→《我可以稳定表达自己》/ 自信 Confidence
2. **睡前内耗** —「我晚上总是想很多，觉得自己不够好，停不下来。」→《今晚我允许自己休息》/ 安睡 Sleep
3. **想更自信** —「我想变得更自信，更敢争取机会。」→《我正在靠近更自信的自己》/ 自信 Confidence

## 合规设计

- **非医疗**：全程标注「自我对话 / 情绪陪伴 / 放松练习」，不诊断、不承诺疗效。
- **反玄学/反绝对化**：系统提示词显式禁止玄学、显化、招财、「一定上岸/暴富/复合/改变命运/听完就好」等。
- **安全提示**：三段输入合并检测自伤/他伤等危机词，命中即弹出支持与求助热线，不直接生成。
- **本人声音**：核心心声由本人录制，录音页含「本人授权」勾选，可随时删除。
- **AI 标识**：音频、封面、文案均标注「AI 辅助生成」。
- **隐私分享**：只分享声景卡片（封面 / 标题 / 标签 / 核心心声），绝不含用户原始倾诉。

## 脚本

```bash
npm run dev      # 开发
npm run build    # 生产构建
npm run start    # 生产运行
```

## 部署与版本回滚

线上环境：**https://ciery0003.cn**（腾讯轻量服务器，PM2 进程名 `yxr`）。

### 版本标签

每次确认可上线后，在对应提交打 tag 并推送：

```bash
git tag -a v0.2 <commit-hash> -m "v0.2: 简要说明"
git push subliminal v0.2
```

| 标签 | 说明 |
| --- | --- |
| `v0.1` | 首页/录音页布局优化、语音球 |
| `v0.2` | 反馈系统、说明 Tab、曲库、导航与音频优化 |

### 上线（服务器 OrcaTerm）

```bash
cd /path/to/yxr          # 换成你的项目目录
git fetch --tags
git checkout main        # 或 git checkout v0.2
git pull
npm install
npm run build
pm2 restart yxr
```

合并到 `main` 后部署，或 `git checkout v0.2` 部署指定版本。

服务器 `.env.local` 需单独配置（不提交 Git），例如：

```env
FEEDBACK_ADMIN_PASSWORD=你的管理密码
SITE_URL=https://ciery0003.cn
LARK_FEEDBACK_WEBHOOK_URL=   # 可选，飞书新反馈通知
```

反馈管理页：`https://ciery0003.cn/admin/feedback`

### 紧急回滚到旧版本

```bash
cd /path/to/yxr
git fetch --tags
git checkout v0.1          # 换成目标版本
npm install
npm run build
pm2 restart yxr
```

回滚后服务器处于「按标签检出」状态；恢复跟进最新版：

```bash
git checkout main
git pull
npm run build
pm2 restart yxr
```

### 在 Git 上正式撤销（可选）

已合并到 `main` 但新版本有问题，可用 revert 保留历史：

```bash
git revert <问题提交的 hash>
git push subliminal main
```

再在服务器 `git pull` + `npm run build` + `pm2 restart yxr`。

## Roadmap

- **P0（已完成）**：完整情绪转化闭环 + 结构化 AI + 情绪前后评分 + 合规/安全 + 历史回顾。
- **P1**：分享卡片优化、波形可视化、TTS 兜底、更多声景配方与参数解释。
- **P2**：情绪声景日记、每日打卡、私人心声歌单、与 K 歌/歌单/睡眠音频场景联动、合规的本人音色定制。
