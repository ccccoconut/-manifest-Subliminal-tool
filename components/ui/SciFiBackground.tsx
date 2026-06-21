"use client";

import { useEffect, useRef } from "react";

/**
 * 科幻 3D 动效背景：透视星空 warp + 旋转 3D 点阵球体（全息）+ 倾斜轨道环。
 * 纯 Canvas，无依赖。尊重 prefers-reduced-motion；标签页隐藏时暂停。
 */
export default function SciFiBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce =
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0,
      h = 0,
      cx = 0,
      cy = 0,
      dpr = 1;

    // ---- 星空（warp 景深） ----
    interface Star {
      x: number;
      y: number;
      z: number;
      pz: number;
    }
    let stars: Star[] = [];
    let maxZ = 1000;

    // ---- 3D 点阵球体（fibonacci 球） ----
    interface P3 {
      x: number;
      y: number;
      z: number;
    }
    let sphere: P3[] = [];
    let R = 200;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      // 用视口尺寸；canvas 是替换元素，fixed inset-0 不会自动拉伸，必须显式按视口设尺寸
      w = window.innerWidth || document.documentElement.clientWidth || 0;
      h = window.innerHeight || document.documentElement.clientHeight || 0;
      if (!w || !h) return; // 布局尚未就绪，等下一帧自愈
      cx = w / 2;
      cy = h * 0.46;
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      canvas!.style.width = w + "px";
      canvas!.style.height = h + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      maxZ = Math.max(w, h) * 0.78;
      const count = Math.min(650, Math.floor((w * h) / 3200));
      stars = Array.from({ length: count }, () => {
        const z = Math.random() * maxZ;
        return {
          x: (Math.random() - 0.5) * w,
          y: (Math.random() - 0.5) * h,
          z,
          pz: z,
        };
      });

      R = Math.min(w, h) * 0.3;
      const N = w < 640 ? 300 : 460;
      sphere = Array.from({ length: N }, (_, i) => {
        const phi = Math.acos(1 - (2 * (i + 0.5)) / N);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        return {
          x: R * Math.sin(phi) * Math.cos(theta),
          y: R * Math.sin(phi) * Math.sin(theta),
          z: R * Math.cos(phi),
        };
      });
    }

    const camDist = () => R * 3.2;
    const focal = () => R * 3.2;

    function rot(p: P3, ay: number, ax: number): P3 {
      // around Y
      const cosy = Math.cos(ay),
        siny = Math.sin(ay);
      let x = p.x * cosy + p.z * siny;
      let z = -p.x * siny + p.z * cosy;
      let y = p.y;
      // around X
      const cosx = Math.cos(ax),
        sinx = Math.sin(ax);
      const y2 = y * cosx - z * sinx;
      const z2 = y * sinx + z * cosx;
      y = y2;
      z = z2;
      return { x, y, z };
    }

    function drawStars(speed: number) {
      for (const s of stars) {
        s.z -= speed;
        if (s.z < 1) {
          s.z = maxZ;
          s.x = (Math.random() - 0.5) * w;
          s.y = (Math.random() - 0.5) * h;
          s.pz = s.z;
        }
        const k = 160 / s.z;
        const sx = cx + s.x * k;
        const sy = cy + s.y * k;
        const pk = 160 / s.pz;
        const px = cx + s.x * pk;
        const py = cy + s.y * pk;
        s.pz = s.z;
        if (sx < 0 || sx > w || sy < 0 || sy > h) continue;
        const depth = 1 - s.z / maxZ;
        const a = 0.35 + depth * 0.65;
        ctx!.strokeStyle = `rgba(${195 + depth * 55},${225},255,${a})`;
        ctx!.lineWidth = 0.6 + depth * 2.4;
        ctx!.beginPath();
        ctx!.moveTo(px, py);
        ctx!.lineTo(sx, sy);
        ctx!.stroke();
        // 近处星点加亮头，让整屏更明显
        if (depth > 0.35) {
          ctx!.fillStyle = `rgba(225,238,255,${a})`;
          ctx!.beginPath();
          ctx!.arc(sx, sy, 0.5 + depth * 1.6, 0, Math.PI * 2);
          ctx!.fill();
        }
      }
    }

    function coreGlow(t: number) {
      const pulse = 0.85 + Math.sin(t * 0.0012) * 0.15;
      const g1 = ctx!.createRadialGradient(cx, cy, 0, cx, cy, R * 2.4);
      g1.addColorStop(0, `rgba(124,109,240,${0.22 * pulse})`);
      g1.addColorStop(0.5, `rgba(124,109,240,${0.07 * pulse})`);
      g1.addColorStop(1, "rgba(124,109,240,0)");
      ctx!.fillStyle = g1;
      ctx!.fillRect(0, 0, w, h);
      const g2 = ctx!.createRadialGradient(cx, cy, 0, cx, cy, R * 0.9);
      g2.addColorStop(0, `rgba(103,232,249,${0.18 * pulse})`);
      g2.addColorStop(1, "rgba(103,232,249,0)");
      ctx!.fillStyle = g2;
      ctx!.fillRect(0, 0, w, h);
    }

    function ring(ay: number, tilt: number, rad: number, color: string) {
      ctx!.beginPath();
      const cd = camDist();
      const f = focal();
      for (let i = 0; i <= 72; i++) {
        const a = (i / 72) * Math.PI * 2;
        const base: P3 = { x: Math.cos(a) * rad, y: 0, z: Math.sin(a) * rad };
        // tilt around X then spin around Y
        const tcos = Math.cos(tilt),
          tsin = Math.sin(tilt);
        const ty = base.y * tcos - base.z * tsin;
        const tz = base.y * tsin + base.z * tcos;
        const p = rot({ x: base.x, y: ty, z: tz }, ay, 0);
        const scale = f / (cd + p.z);
        const sx = cx + p.x * scale;
        const sy = cy + p.y * scale;
        if (i === 0) ctx!.moveTo(sx, sy);
        else ctx!.lineTo(sx, sy);
      }
      ctx!.strokeStyle = color;
      ctx!.lineWidth = 1.4;
      ctx!.shadowBlur = 12;
      ctx!.shadowColor = color;
      ctx!.stroke();
      ctx!.shadowBlur = 0;
    }

    function drawSphere(ay: number, ax: number) {
      const cd = camDist();
      const f = focal();
      for (const p0 of sphere) {
        const p = rot(p0, ay, ax);
        const scale = f / (cd + p.z);
        const sx = cx + p.x * scale;
        const sy = cy + p.y * scale;
        // depth 0(back)..1(front)
        const depth = (p.z + R) / (2 * R);
        const a = 0.12 + depth * 0.72;
        const size = 0.7 + depth * 2.4;
        // 青 → 紫 按深度
        const r = Math.round(103 + depth * 64);
        const g = Math.round(232 - depth * 93);
        const b = 250;
        ctx!.fillStyle = `rgba(${r},${g},${b},${a})`;
        ctx!.beginPath();
        ctx!.arc(sx, sy, size, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    // reduced-motion 时不冻结，只放慢（用户明确想要动效）
    const starSpeed = reduce ? 2.4 : 5.5;
    const spin = reduce ? 0.00028 : 0.0006;

    function render(t: number) {
      ctx!.clearRect(0, 0, w, h);
      ctx!.globalCompositeOperation = "lighter";
      coreGlow(t);
      drawStars(starSpeed);
      const ay = t * spin;
      const ax = Math.sin(t * 0.00009) * 0.35;
      ring(ay * 1.3, 1.15, R * 1.5, "rgba(167,139,250,0.5)");
      ring(-ay * 0.9 + 2, 1.45, R * 1.85, "rgba(103,232,249,0.42)");
      drawSphere(ay, ax);
      ctx!.globalCompositeOperation = "source-over";
    }

    let raf = 0;
    let running = true;
    const loop = (t: number) => {
      if (!running) return;
      // 自愈：视口尺寸变化或首帧曾为 0 时重建
      const iw = window.innerWidth || document.documentElement.clientWidth || 0;
      const ih = window.innerHeight || document.documentElement.clientHeight || 0;
      if (iw && ih && (iw !== w || ih !== h)) resize();
      if (w && h) render(t);
      raf = requestAnimationFrame(loop);
    };

    function start() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    if (w && h) render(0); // 立即画一帧，避免首帧空白
    raf = requestAnimationFrame(loop); // 首帧若尺寸为 0，loop 会自愈；reduced-motion 下也动

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: -1 }}
    />
  );
}
