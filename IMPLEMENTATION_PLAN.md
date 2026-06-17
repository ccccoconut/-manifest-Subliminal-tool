# 心频 InnerTune → 心声调频 InnerTune · v2 优化计划

> 依据「黑客松评审标准对标」建议，把产品从「一次性生成器」升级为
> **可量化的情绪转化闭环**：场景 → 三段输入 → AI 理解+策略 → 肯定语+核心心声 →
> 录本人声音 → 声景配方 → 分阶段生成 → 情绪前后评分 → 隐私安全分享。

## v1 已完成
输入 → 肯定语 → 录音 → 音景 → 离线混音 → 封面 → 播放/下载/保存 + 合规 + DeepSeek(已接真实 key)。

## v2 改造项（本轮）
- [x] S1 数据契约升级（types）：UserInput(3段)+SceneKey；Affirmation 增 understanding/targetState/strategy/anchorLine；Ratings(前后评分)。
- [x] S2 声景 → **Sound Recipe**：重命名 id(confidence/calm/focus/reset/sleep) + 中英文名 + 音乐设计描述。
- [x] S3 LLM 升级：结构化 JSON（理解/策略/心声）+ 三段输入 + 强化反玄学/反绝对化/反医疗安全约束。
- [x] S4 输入页：场景选择 + 三段输入（现在状态 / 想抵达 / 不想听到）。
- [x] S5 肯定语页：AI 理解+策略卡片 + 核心心声高亮。
- [x] S6 录音页：以核心心声为主 + 本人授权勾选。
- [x] S7 生成：四阶段可视化（理解→对话→混声→封面）。
- [x] S8 结果页：**情绪前后评分闭环** + 隐私安全分享卡片。
- [x] S9 品牌：心声调频 InnerTune + 新 tagline + 封面/文案更新。
- [x] S10 构建通过（生产构建 220 kB）+ 预览逐屏验证（input/affirmation/soundscape/生成overlay/result情绪评分 delta 全部截图确认；真实 DeepSeek 文案+两档语气+音景自动匹配验证）。
- [x] S11 多智能体对抗式评审（36 agents，4 维度，确认 25 项）→ 已应用高价值修复。

**Status**: v2 完成（含评审修复）。

## S11 评审已应用的修复
- 音频(critical)：mixer 人声 `src.stop` 夹在离线时长内（长录音不再越界）。
- 音频(high)：dry/wet 增益之和归一为 1（避免叠加超 1.0 触发过度限幅）。
- 合规(high)：route 增加输出禁词扫描（医疗/绝对化/玄学命中即回退模板）。
- 正确性(high)：`handleRatingsChange` useCallback + ResultStep 依赖修正（消除陈旧闭包）。
- 数据(high)：聆听前评分即时持久化（跳过后测也不丢前测）；历史卡片展示前后变化。
- 隐私(high)：「分享声景卡片」改为只分享封面图，不再默认分享本人声音音频。
- 体验(high)：录音最短 3s 软门槛 + 过短提示。
- 体验(medium)：声景试听失败给出可见错误提示。
- 合规(medium/low)：封面页脚改为「非医疗或心理诊疗建议」；扩充危机词（跳楼/一了百了/活着没意思等，剔除易误报词）。

## v3 路演影响力优化（依据「黑客松获奖规律」guide1）
原则：产品已功能完备，获奖规律强调**别再加功能**，把力气放在 Demo 可靠性、前 30 秒 WOW、主题对齐与叙事。
- 首页「▶ 一键看一个完整演示」：一键填充面试 case 并生成，省去现场打字，加速 WOW。
- 结果页加入主题/音乐框架（「你此刻的情绪，刚刚变成了一首只属于你的音乐」）+ 收尾金句（我不行→我可以）。
- 录音失败更清晰的重试引导（评委设备麦克风被拒不至于卡死）。
- 新增 `docs/DEMO_SCRIPT.md`：3 分钟路演脚本 + 30 秒 WOW 开场 + 不翻车清单 + TME 对齐话术 + 首批用户/收尾。

## 评审中判定为「设计如此/误报」未改
- 四阶段生成的叙事性进度：策略文档明确认可，保留。
- 「coerce 总返回 deepseek」：实为误报，质量不足时已 `return fallback`(source=fallback)，标识准确。
- 返回上一步保留录音：故意保留，避免用户丢失录音。
- objectURL/WAV 兜底/localStorage 配额等低危项：暂缓。

## v2 验证记录（2026-06-17）
- 生产构建通过；tsc 通过。
- 真实 DeepSeek：输出含 understanding/strategy/anchorLine，尊重「不想听到鸡血」约束，音景自动匹配（面试→confidence，睡前→sleep）。
- 情绪前后评分闭环：紧张 4↓2 / 自信 2↑4，delta 方向着色正确。
- 注：headless 预览会冻结 rAF，导致 framer-motion 入场动画/AnimatePresence(mode=wait) 转场停滞——纯环境现象，真实浏览器正常；已把生成进度 ramp() 从 rAF 改为 setInterval 以免后台标签页卡住。
- 待真机：麦克风录音（headless 无麦克风）。
