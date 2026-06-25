"use client";

import dynamic from "next/dynamic";

// 纯客户端加载（依赖 WebGL / window），避免 SSR。
const LiquidEther = dynamic(() => import("./LiquidEther"), { ssr: false });

/**
 * 全屏液态流光背景（React Bits LiquidEther）。
 * 固定全屏、z-index:0：在页面深色底之上、定位内容（Studio，relative 且 DOM 在后）之下。
 * 必须用 0 而非负值——负 z-index 会被不透明的 body 深色底盖住而完全看不见。
 * 流体透明处透出深色底，高速处显薰衣草→白→粉的流光；
 * pointer-events:none 让 UI 仍可点击，同时流体仍随光标反应。
 */
export default function LiquidBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 0 }}
    >
      <LiquidEther
        colors={["#B1FFEC", "#CEF595", "#FFE588"]}
        mouseForce={24}
        cursorSize={110}
        isViscous={false}
        viscous={30}
        iterationsViscous={32}
        iterationsPoisson={32}
        resolution={0.5}
        isBounce={false}
        autoDemo
        autoSpeed={0.7}
        autoIntensity={3.4}
        takeoverDuration={0.25}
        autoResumeDelay={1200}
        autoRampDuration={0.6}
        style={{ width: "100%", height: "100%", opacity: 0.7 }}
      />
    </div>
  );
}
