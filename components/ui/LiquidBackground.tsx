"use client";

import { Component, useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";

const LiquidEther = dynamic(() => import("./LiquidEther"), { ssr: false });

class EtherErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

/** 手机端跳过 Three/WebGL 背景，避免低内存或加载 chunk 失败拖垮整页。 */
function shouldEnableEther(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.matchMedia("(max-width: 768px), (pointer: coarse)").matches) {
      return false;
    }
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl", { failIfMajorPerformanceCaveat: true }) ||
      canvas.getContext("experimental-webgl");
    return Boolean(gl);
  } catch {
    return false;
  }
}

/**
 * 全屏液态流光背景（React Bits LiquidEther）。
 * 仅桌面且 WebGL 可用时加载；失败时静默降级为纯 CSS aurora。
 */
export default function LiquidBackground() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(shouldEnableEther());
  }, []);

  if (!enabled) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 0 }}
    >
      <EtherErrorBoundary>
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
      </EtherErrorBoundary>
    </div>
  );
}
