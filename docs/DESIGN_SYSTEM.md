# 酥饼 — 设计系统

> 面向当前 **移动端 WebView / H5** 形态的设计限定。实现见 `app/globals.css`、`app/layout.tsx`、`components/HomeDashboard.tsx`。

## 一、产品形态（设计前提）

| 维度 | 当前限定 |
| --- | --- |
| 载体 | **移动端优先**：整 App 约束在 `.app-frame`（`max-width: 480px`）内；真机 WebView 全屏，桌面浏览器居中呈现「手机画框」 |
| 信息架构 | **首页工作台** → **创作向导**（输入 → 肯定语 → 录音 → 背景音 → 调参 → 结果）→ 回到首页「我的作品」 |
| 品牌 | **酥饼** · Tagline：「用你的声音，生成专属于你的显化 sub。」 |
| 默认主题 | **浅色玻璃拟态**；设置面板可切换夜间模式 |

## 二、品牌色与语义 token

### 三色主色（用户可见、装饰与 CTA 渐变）

| Token | 色值 | 用途 |
| --- | --- | --- |
| `--color-lime` | `#CEF595` | 青柠 · CTA 渐变、背景光斑、激活态 |
| `--color-mint` | `#B1FFEC` | 薄荷 · 玻璃 tint、Liquid 背景、选中 hover |
| `--color-cream` | `#FFE588` | 奶油 · CTA 渐变末端、暖色光斑 |

### 界面语义色（`globals.css` @theme）

| Token | 浅色默认值 | 说明 |
| --- | --- | --- |
| `--color-ink` / `--color-ink-soft` | 浅绿白底 | 页面画布 |
| `--color-mist` / `--color-mist-soft` | 深墨绿字 | 主文案 / 次级文案 |
| `--color-haze` | 灰绿 | 辅助说明、占位 |
| `--color-aura` / `--color-aura-deep` | `#4f9d2e` / `#357018` | 可读强调色（图标、focus、滑块 accent）——**不是**直接用 pastel 作实心按钮底 |
| `--color-glow` | `#B1FFEC` | 高亮、录音状态提示 |
| `--color-border` | 半透明墨绿 | 玻璃边框 |

**禁止**：回到薰衣草紫 `#8B5CF6`、旧 teal `#0d9488` 实心主按钮、暗色科幻作为默认皮肤。

## 三、视觉风格：玻璃拟态（Glassmorphism）

- **背景层**：`.aurora` 三色 radial 光斑 + `LiquidBackground`（LiquidEther，颜色 `#B1FFEC` / `#CEF595` / `#FFE588`）
- **卡片**：`.glass` — 白 + 薄荷/青柠渐变、高 blur/saturate、内高光
- **芯片 / 次级面板**：`.glass-chip`、`.soft-panel`
- **主按钮**：`.btn-primary` — 三色渐变 + **深墨绿字** `#123f2a`
- **激活药丸**：`.pill-active` — 与主按钮同渐变；用于 Tab 选中、步骤条当前步、设置切换等（**禁止** pastel 底 + 白字，对比度不够）
- **幽灵按钮**：`.btn-ghost` — 半透明白 + 细边框，hover 薄荷 tint

圆角：`--radius-xl: 1.5rem`，`--radius-2xl: 2rem`。

## 四、字体

| 用途 | 字体 |
| --- | --- |
| 正文 / 标题 | **Noto Sans SC**（思源黑体，`next/font/google` 自托管）+ PingFang / 系统 sans 回退 |

大标题在移动端仍可用 `text-3xl`，避免在 480px 画框内使用过大桌面字号（`text-5xl` 仅作 sm 断点增强，画框内 rarely 触发）。

## 五、布局与组件约定

### 首页（HomeDashboard）

- 顶栏：Logo + 品牌 + **「新建」**（非「新建作品」长文案）
- Tab：**我的作品** / **社群**（社群为占位）
- 作品区：空状态 / **2 列**封面网格
- 左下 **设置 FAB**：头像、昵称、日/夜切换；`fixed` 锚定 `--frame-left`，不贴 viewport 左下角

### 创作向导

- 各 Step 容器 `max-w-2xl` / `max-w-3xl`，在画框内自然单列
- 录音页可视化：**仅 1 条居中 Strands 丝带**（`count=1`，低 `waviness`）；idle 静态、recording 随 mic level 起伏
- 结果页：封面 + 内嵌播放器 + 肯定语列表；进入时 **自动保存** 到「我的作品」

### 固定 UI 规则（沿用）

- 图标：**SVG 描边**，不用 emoji 当功能图标
- **cursor-pointer** 于所有可点击控件
- **:focus-visible** 墨绿 outline
- **prefers-reduced-motion**：aurora 动画可关闭；音频/生成进度不依赖 rAF 单线程
- 动效：150–300ms 为主（Framer 步骤切换 ~320ms）

## 六、已废弃 / 不再作为设计前提

| 旧限定 | 现状 |
| --- | --- |
| 暗色 + 科幻 3D 默认 UI | 已改为浅色玻璃 +  pastel 流体背景 |
| 桌面宽栏 `max-w-6xl` 首页 | 已改为移动端画框 |
| Neumorphism 柔性阴影方案 | 未采用；以 glass 为准 |
| 紫色 focus / 紫色 Tab 阴影 | 已统一为绿/薄荷系 |
| 录音页多竖条 / 多条 Strands | 已改为单条居中丝带 |
| 首页示例画廊、一键演示 Banner | 当前版本未上线 |
| 步骤条在 Studio 顶栏常驻 | Stepper 组件存在，主流程未强制展示 |

## 七、交付前检查

- [x] 三色主色与 glass 组件一致
- [x] 移动端画框 375–480px 可读
- [x] 激活态用 `pill-active`（深字）而非 pastel 实心 + 白字
- [x] SVG 图标、focus、cursor、reduced-motion
- [ ] 次要灰字（`--color-haze`）全站 4.5:1 对比度复核
- [x] WebView：`viewportFit: cover`，`maximumScale: 1`

## 八、扩展换肤（若未来需要）

夜间模式已通过 `:root[data-theme="dark"]` 覆盖 token；**不要**再引入第三套紫色养护主题，除非产品方向变更。
