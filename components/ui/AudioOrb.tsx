"use client";

import { useEffect, useRef } from "react";

type OrbState = "idle" | "recording" | "recorded";

/** 平滑闭合曲线：用相邻点中点作为锚，控制点取原始点，画出柔软的 blob 轮廓。 */
function tracePath(ctx: CanvasRenderingContext2D, pts: number[][]) {
  const n = pts.length;
  if (n < 2) return;
  const mid = (a: number[], b: number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = mid(pts[n - 1], pts[0]);
  ctx.moveTo(start[0], start[1]);
  for (let i = 0; i < n; i++) {
    const cur = pts[i];
    const nxt = pts[(i + 1) % n];
    const m = mid(cur, nxt);
    ctx.quadraticCurveTo(cur[0], cur[1], m[0], m[1]);
  }
  ctx.closePath();
}

/**
 * 随声波跳动的球状体（类似语音助手「电话模式」的发光球）。
 * 纯 Canvas 程序化绘制：振幅驱动半径/辉光/涟漪，叠加正弦噪声形成有机形变。
 */
export default function AudioOrb({
  level,
  state,
}: {
  level: number;
  state: OrbState;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const levelRef = useRef(0);
  const stateRef = useRef<OrbState>(state);

  // 每次渲染同步最新值到 ref，供独立的 rAF 循环采样（避免依赖 React 重渲染节奏）。
  levelRef.current = level;
  stateRef.current = state;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

    let raf = 0;
    let t = 0;
    let smooth = 0; // 平滑后的能量 → 半径/辉光
    let peak = 0; // 快起慢落 → 涟漪强度
    let W = 0;
    let H = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const N = 90;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (W === 0 || H === 0) return;

      t += reduce ? 0.004 : 0.011;
      const lvl = levelRef.current;
      const st = stateRef.current;

      // 各状态的基础能量：录音时跟随真实音量，其余为轻微「呼吸」。
      const idleEnergy = st === "recorded" ? 0.05 : 0.02;
      const target = st === "recording" ? Math.max(idleEnergy, lvl) : idleEnergy;
      smooth += (target - smooth) * 0.12;
      peak += (target - peak) * (target > peak ? 0.5 : 0.05);

      ctx.clearRect(0, 0, W, H);
      const cx = W / 2;
      const cy = H / 2;
      const baseR = Math.min(W, H) * 0.26;

      // —— 外层辉光 ——
      const bloomR = baseR * (1.9 + smooth * 0.8);
      const bloom = ctx.createRadialGradient(cx, cy, baseR * 0.4, cx, cy, bloomR);
      bloom.addColorStop(0, `rgba(168,139,250,${0.26 + smooth * 0.3})`);
      bloom.addColorStop(0.5, `rgba(192,132,252,${0.1 + smooth * 0.14})`);
      bloom.addColorStop(1, "rgba(168,139,250,0)");
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.arc(cx, cy, bloomR, 0, Math.PI * 2);
      ctx.fill();

      // —— 涟漪环（持续向外扩散，强度随音量）——
      const ringEnergy = Math.min(1, peak * 3 + (st === "recorded" ? 0.25 : 0));
      if (ringEnergy > 0.04) {
        for (let k = 0; k < 2; k++) {
          const ph = (t * 0.22 + k * 0.5) % 1;
          const rr = baseR * (1.05 + ph * 1.3);
          ctx.beginPath();
          ctx.arc(cx, cy, rr, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(192,132,252,${(1 - ph) * 0.28 * ringEnergy})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // —— blob 轮廓点 ——
      const wobble = (reduce ? 0.02 : 0.05) + smooth * (reduce ? 0.05 : 0.2);
      const pts: number[][] = [];
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        const noise =
          Math.sin(a * 3 + t * 1.3) * 0.5 +
          Math.sin(a * 5 - t * 1.9) * 0.3 +
          Math.sin(a * 2 + t * 0.7) * 0.4 +
          Math.sin(a * 7 + t * 2.3) * 0.15;
        const r = baseR * (1 + wobble * noise + smooth * 0.12);
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }

      // —— 球体填充（偏移高光，营造 3D 立体感）——
      const sphere = ctx.createRadialGradient(
        cx - baseR * 0.35,
        cy - baseR * 0.4,
        baseR * 0.1,
        cx,
        cy,
        baseR * 1.3
      );
      sphere.addColorStop(0, "rgba(253,244,255,0.98)");
      sphere.addColorStop(0.28, "rgba(216,180,254,0.96)");
      sphere.addColorStop(0.62, "rgba(139,92,246,0.96)");
      sphere.addColorStop(1, "rgba(91,33,182,0.94)");

      ctx.beginPath();
      tracePath(ctx, pts);
      ctx.fillStyle = sphere;
      ctx.shadowColor = "rgba(139,92,246,0.45)";
      ctx.shadowBlur = 26 + smooth * 40;
      ctx.fill();
      ctx.shadowBlur = 0;

      // —— 底部绿色渐染（呼应主题色，裁剪进 blob 内）——
      ctx.save();
      ctx.beginPath();
      tracePath(ctx, pts);
      ctx.clip();
      const green = ctx.createLinearGradient(cx, cy - baseR, cx, cy + baseR);
      green.addColorStop(0, "rgba(5,150,105,0)");
      green.addColorStop(1, "rgba(5,150,105,0.32)");
      ctx.fillStyle = green;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      // —— 边缘微光描边 ——
      ctx.beginPath();
      tracePath(ctx, pts);
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = "rgba(255,255,255,0.32)";
      ctx.stroke();

      // —— 高光斑 ——
      const hlx = cx - baseR * 0.32;
      const hly = cy - baseR * 0.38;
      const hl = ctx.createRadialGradient(hlx, hly, 0, hlx, hly, baseR * 0.6);
      hl.addColorStop(0, "rgba(255,255,255,0.55)");
      hl.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = hl;
      ctx.beginPath();
      ctx.arc(hlx, hly, baseR * 0.5, 0, Math.PI * 2);
      ctx.fill();
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}
