import { getSoundscape } from "../constants";
import type { SoundscapeId } from "../types";

export interface CoverInput {
  title: string;
  scene: string;
  emotionTags: string[];
  soundscape: SoundscapeId;
  anchorLine?: string;
}

const SIZE = 880;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapTitle(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  let cur = "";
  for (const ch of text) {
    if (ctx.measureText(cur + ch).width > maxWidth && cur) {
      lines.push(cur);
      cur = ch;
    } else {
      cur += ch;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

/** 生成专属封面 PNG（dataURL）。纯前端 Canvas 绘制。 */
export function generateCover(input: CoverInput): string {
  const meta = getSoundscape(input.soundscape);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // base gradient
  const grad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  grad.addColorStop(0, meta.palette[0]);
  grad.addColorStop(0.55, meta.palette[1]);
  grad.addColorStop(1, meta.palette[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // soft glow blobs
  const blobs: [number, number, number, string][] = [
    [SIZE * 0.2, SIZE * 0.22, SIZE * 0.4, meta.accent],
    [SIZE * 0.82, SIZE * 0.3, SIZE * 0.34, "#ffffff"],
    [SIZE * 0.7, SIZE * 0.85, SIZE * 0.45, meta.palette[2]],
  ];
  for (const [x, y, r, color] of blobs) {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, hexA(color, 0.45));
    rg.addColorStop(1, hexA(color, 0));
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, SIZE, SIZE);
  }

  // concentric sound ripples (lower right)
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = hexA("#ffffff", 0.5);
  const cx = SIZE * 0.5;
  const cy = SIZE * 0.62;
  for (let i = 1; i <= 7; i++) {
    ctx.beginPath();
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.06 + (7 - i) * 0.02;
    ctx.arc(cx, cy, i * 46, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // dark vignette for text legibility
  const vg = ctx.createLinearGradient(0, SIZE * 0.35, 0, SIZE);
  vg.addColorStop(0, hexA("#05050c", 0));
  vg.addColorStop(1, hexA("#05050c", 0.62));
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // brand top
  ctx.fillStyle = meta.accent;
  ctx.beginPath();
  ctx.arc(64, 70, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hexA("#ffffff", 0.92);
  ctx.font = "600 30px " + FONT;
  ctx.textBaseline = "middle";
  ctx.fillText("心声调频 InnerTune", 86, 72);

  // title (wrapped)
  const clean = input.title.replace(/[《》]/g, "");
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 70px " + FONT;
  const titleLines = wrapTitle(ctx, clean, SIZE - 130);
  let ty = SIZE * 0.5 - (titleLines.length - 1) * 44;
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 24;
  for (const line of titleLines) {
    ctx.fillText(line, 64, ty);
    ty += 88;
  }
  ctx.shadowBlur = 0;

  // scene
  ctx.fillStyle = hexA(meta.accent, 0.95);
  ctx.font = "500 30px " + FONT;
  ctx.fillText(input.scene, 64, ty + 4);

  // anchor line（核心心声，可公开）
  if (input.anchorLine) {
    ctx.fillStyle = hexA("#ffffff", 0.88);
    ctx.font = "italic 500 30px " + FONT;
    let anchor = `“${input.anchorLine.replace(/[「」“”]/g, "")}”`;
    while (ctx.measureText(anchor).width > SIZE - 128 && anchor.length > 8) {
      anchor = anchor.slice(0, -2) + "…”";
    }
    ctx.fillText(anchor, 64, SIZE - 200);
  }

  // emotion tag pills
  let px = 64;
  const py = SIZE - 150;
  ctx.font = "500 26px " + FONT;
  for (const tag of input.emotionTags.slice(0, 4)) {
    const w = ctx.measureText(tag).width + 40;
    if (px + w > SIZE - 64) break;
    ctx.fillStyle = hexA("#ffffff", 0.14);
    roundRect(ctx, px, py, w, 50, 25);
    ctx.fill();
    ctx.fillStyle = hexA("#ffffff", 0.92);
    ctx.fillText(tag, px + 20, py + 26);
    px += w + 14;
  }

  // footer
  ctx.fillStyle = hexA("#ffffff", 0.6);
  ctx.font = "400 24px " + FONT;
  ctx.fillText("AI 辅助生成 · 个人放松，非医疗或心理诊疗建议", 64, SIZE - 60);

  return canvas.toDataURL("image/png");
}

/** 把封面缩成小尺寸 JPEG（用于历史记录持久化，避免 localStorage 配额溢出）。 */
export function makeThumb(dataUrl: string, size = 320): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = size;
      c.height = size;
      const cx = c.getContext("2d");
      if (!cx) return resolve(dataUrl);
      cx.drawImage(img, 0, 0, size, size);
      resolve(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

const FONT =
  '"PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif';

function hexA(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
