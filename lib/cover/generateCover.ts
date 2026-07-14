import type { SoundscapeId } from "../types";

/** 封面专用色板（与配乐配方独立，供用户左右滑动选择） */
export type CoverPaletteId =
  | "mint"
  | "sunrise"
  | "lavender"
  | "rose"
  | "ocean"
  | "sand"
  | "dusk"
  | "forest";

export interface CoverPalette {
  id: CoverPaletteId;
  name: string;
  palette: [string, string, string];
  accent: string;
  textColor: string;
}

export const COVER_PALETTES: CoverPalette[] = [
  {
    id: "mint",
    name: "薄荷青",
    palette: ["#e8fff9", "#b1ffec", "#cef595"],
    accent: "#2a9d8f",
    textColor: "#123f2a",
  },
  {
    id: "sunrise",
    name: "晨曦暖",
    palette: ["#fff4e0", "#ffe588", "#ffd4a8"],
    accent: "#e8a020",
    textColor: "#4a3520",
  },
  {
    id: "lavender",
    name: "薰衣草",
    palette: ["#f3eeff", "#e4d4ff", "#d8c4f8"],
    accent: "#8b6fc0",
    textColor: "#3d2a5c",
  },
  {
    id: "rose",
    name: "玫瑰雾",
    palette: ["#fff0f3", "#ffd6e0", "#ffc9d6"],
    accent: "#d45d7a",
    textColor: "#5c2438",
  },
  {
    id: "ocean",
    name: "海雾蓝",
    palette: ["#e8f4ff", "#b8d9f5", "#8ec5e8"],
    accent: "#3d7ab8",
    textColor: "#1a3d5c",
  },
  {
    id: "sand",
    name: "暖沙米",
    palette: ["#faf6ef", "#f0e6d6", "#e8dcc8"],
    accent: "#b8956a",
    textColor: "#4a3d2e",
  },
  {
    id: "dusk",
    name: "暮色紫",
    palette: ["#f5e8ff", "#e8c4e8", "#d4a8d4"],
    accent: "#9b5a9b",
    textColor: "#3d2848",
  },
  {
    id: "forest",
    name: "森林绿",
    palette: ["#e8f5e8", "#c8e6c8", "#a8d4a8"],
    accent: "#4f9d2e",
    textColor: "#1a3d1a",
  },
];

export interface CoverInput {
  affirmation: string;
  palette: CoverPaletteId;
}

export interface CoverTemplate {
  id: CoverPaletteId;
  name: string;
  palette: [string, string, string];
  accent: string;
}

export function listCoverTemplates(): CoverTemplate[] {
  return COVER_PALETTES.map((p) => ({
    id: p.id,
    name: p.name,
    palette: p.palette,
    accent: p.accent,
  }));
}

export function getCoverPalette(id: CoverPaletteId): CoverPalette {
  return COVER_PALETTES.find((p) => p.id === id) ?? COVER_PALETTES[0];
}

/** 首次生成时，按配乐配方匹配默认封面色 */
export function defaultCoverPaletteForSoundscape(
  soundscape: SoundscapeId
): CoverPaletteId {
  const map: Record<SoundscapeId, CoverPaletteId> = {
    confidence: "sunrise",
    calm: "mint",
    focus: "sand",
    reset: "dusk",
    sleep: "lavender",
  };
  return map[soundscape] ?? "mint";
}

const SIZE = 880;

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
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
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  const last = kept[maxLines - 1];
  kept[maxLines - 1] =
    last.length > 1 ? `${last.slice(0, Math.max(1, last.length - 1))}…` : "…";
  return kept;
}

export function generateCover(input: CoverInput): string {
  const meta = getCoverPalette(input.palette);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const grad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  grad.addColorStop(0, meta.palette[0]);
  grad.addColorStop(0.5, meta.palette[1]);
  grad.addColorStop(1, meta.palette[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  const blobs: [number, number, number, string][] = [
    [SIZE * 0.18, SIZE * 0.2, SIZE * 0.42, meta.accent],
    [SIZE * 0.85, SIZE * 0.28, SIZE * 0.36, "#ffffff"],
    [SIZE * 0.55, SIZE * 0.88, SIZE * 0.5, meta.palette[2]],
  ];
  for (const [x, y, r, color] of blobs) {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, hexA(color, 0.4));
    rg.addColorStop(1, hexA(color, 0));
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, SIZE, SIZE);
  }

  ctx.save();
  ctx.strokeStyle = hexA("#ffffff", 0.45);
  const cx = SIZE * 0.5;
  const cy = SIZE * 0.42;
  for (let i = 1; i <= 5; i++) {
    ctx.beginPath();
    ctx.lineWidth = 1.4;
    ctx.globalAlpha = 0.05 + (5 - i) * 0.025;
    ctx.arc(cx, cy, i * 52, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  const raw = (input.affirmation || "").replace(/[「」“”《》]/g, "").trim();
  const quote = `"${raw || "我此刻安稳地与自己同在"}"`;

  const padX = 64;
  const padBottom = 72;
  const maxW = SIZE - padX * 2;

  ctx.fillStyle = meta.textColor;
  ctx.font = `600 40px ${FONT}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";

  const lines = wrapLines(ctx, quote, maxW, 4);
  const lineH = 52;
  let ty = SIZE - padBottom;
  for (let i = lines.length - 1; i >= 0; i--) {
    ctx.shadowColor = "rgba(255,255,255,0.45)";
    ctx.shadowBlur = 10;
    ctx.fillText(lines[i], padX, ty);
    ctx.shadowBlur = 0;
    ty -= lineH;
  }

  return canvas.toDataURL("image/png");
}

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

export function coverFromImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas unavailable"));
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("image decode failed"));
      img.src = String(reader.result || "");
    };
    reader.onerror = () => reject(new Error("file read failed"));
    reader.readAsDataURL(file);
  });
}

const FONT =
  '"Microsoft YaHei","PingFang SC","Hiragino Sans GB",system-ui,sans-serif';

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
