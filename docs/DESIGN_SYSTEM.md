# 心声调频 InnerTune — 设计系统

> 由 `ui-ux-pro-max` skill 的设计系统生成器产出（query: `wellness mental-health emotional companion self-affirmation meditation calm audio`），
> 再结合本项目「暗色 + 科幻」的既定方向人工取舍。
> 重新生成：`python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system -p "InnerTune"`

## 一、skill 对「情绪陪伴 / 健康养护」品类的原始推荐
| 维度 | 推荐 |
| --- | --- |
| 模式 | Storytelling-Driven + Social Proof（CTA 在首屏；Hero → Features → CTA）|
| 风格 | Neumorphism 柔性 UI（适合冥想/健康类；注意对比度偏低）|
| 主色 | 薰衣草紫 `#8B5CF6` |
| CTA 强调色 | 健康绿 `#059669`（已为 WCAG 3:1 调整）|
| 背景 / 前景 | 浅色 `#FAF5FF` / 深紫 `#4C1D95`（**浅色主题**）|
| 字体 | 标题 Lora（衬线）+ 正文 Raleway |
| 反模式 | 风格不一致、对比度不足 |

## 二、本项目的取舍（暗色科幻 ≠ 浅色养护，二者都成立）
项目已确立**暗色玻璃拟态 + 科幻 3D 背景**方向。因此**不照搬**浅色 Neumorphism 主题，
而是采纳 skill 中**与主题无关、普适提升质量**的规则；浅色养护方案作为「可选整套换肤」备选。

### 已采纳并落地（与主题无关的硬规则）
- **无 emoji 当图标**：场景选择、背景音来源的 emoji → Lucide 风格描边 SVG（`components/ui/icons.tsx`）。
- **可见 focus 态**：全局 `:focus-visible` 紫色 ring（键盘可达性）。
- **cursor-pointer**：所有可点击元素（按钮/滑块/勾选）显示手型。
- **动效时长**：交互动画维持 150–300ms（既有）。
- **reduced-motion**：尊重系统设置（音频管线已支持；科幻背景在该设置下放慢而非冻结）。

### 暂未采纳（与当前方向冲突，列为可选项）
- 浅色主题 + Neumorphism（与暗色科幻冲突）。
- 衬线标题 Lora（与科幻气质冲突；如需「更养护」气质可启用）。
- 健康绿 CTA（当前 CTA 用品牌紫渐变；如需更强区分可引入绿色 accent）。

## 三、若要切换为 skill 的「浅色养护」整套方案
1. `globals.css` 用浅色 token：bg `#FAF5FF`、前景 `#4C1D95`、primary `#8B5CF6`、accent `#059669`。
2. 引入字体：
   ```css
   @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Raleway:wght@300;400;500;600;700&display=swap');
   ```
   标题 Lora、正文 Raleway。
3. 玻璃卡 → Neumorphism 柔性阴影（`-5px -5px 15px, 5px 5px 15px`）。
4. 关闭/弱化科幻 3D 背景（浅色下改为柔和光斑）。

## 四、交付前检查（skill checklist，已对照）
- [x] 图标用 SVG（非 emoji）
- [x] 可点击元素 cursor-pointer
- [x] hover/press 过渡 150–300ms
- [x] 可见 focus 态
- [x] 尊重 prefers-reduced-motion
- [ ] 全量对比度 4.5:1 复核（暗色下部分次要灰字偏低，后续可再提）
- [x] 响应式 375 / 768 / 1024 / 1440
