"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

/**
 * Colorful frosted-glass voice orb — scales & glows with mic level.
 */
export default function VoiceOrb({
  level,
  active,
  compact = false,
}: {
  /** 0..1 mic loudness */
  level: number;
  active: boolean;
  compact?: boolean;
}) {
  const target = active ? Math.min(1, Math.max(0, level)) : 0;
  const smooth = useSpring(target, { stiffness: 200, damping: 20, mass: 0.3 });

  useEffect(() => {
    smooth.set(target);
  }, [smooth, target]);

  const scale = useTransform(smooth, [0, 1], [1, compact ? 1.22 : 1.32]);
  const glowOpacity = useTransform(smooth, [0, 1], [0.4, 1]);
  const ringScale = useTransform(smooth, [0, 1], [1, compact ? 1.35 : 1.5]);
  const ringOpacity = useTransform(smooth, [0, 1], [0.18, 0.6]);

  return (
    <div
      className={`relative mx-auto flex w-full items-center justify-center ${
        compact ? "h-[5.25rem]" : "h-[7.5rem]"
      }`}
    >
      <motion.div
        aria-hidden
        className={`pointer-events-none absolute rounded-full ${
          compact ? "h-20 w-20" : "h-28 w-28"
        }`}
        style={{
          scale: ringScale,
          opacity: ringOpacity,
          background:
            "radial-gradient(circle, rgba(177,255,236,0.55) 0%, rgba(206,245,149,0.25) 42%, transparent 70%)",
          filter: "blur(6px)",
        }}
      />

      <motion.div
        className={`relative ${compact ? "h-[4.25rem] w-[4.25rem]" : "h-[5.75rem] w-[5.75rem]"}`}
        animate={active ? { scale: 1 } : { scale: [0.92, 1, 0.92] }}
        transition={
          active
            ? { duration: 0.2 }
            : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <motion.div className="h-full w-full" style={{ scale }}>
          <div
            className="absolute inset-0 overflow-hidden rounded-full"
            style={{
              background:
                "linear-gradient(145deg, rgba(255,255,255,0.72) 0%, rgba(177,255,236,0.45) 28%, rgba(206,245,149,0.55) 58%, rgba(255,229,136,0.5) 100%)",
              boxShadow:
                "inset 0 1px 1px rgba(255,255,255,0.85), inset 0 -10px 22px rgba(79,157,46,0.12), 0 18px 40px -18px rgba(18,63,42,0.35)",
              border: "1px solid rgba(255,255,255,0.55)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
            }}
          >
            <motion.div
              className="absolute inset-[18%] rounded-full"
              style={{
                opacity: glowOpacity,
                background:
                  "radial-gradient(circle at 38% 32%, #fff9e6 0%, #ffe588 22%, #b1ffec 48%, #cef595 72%, #7ec8ff 100%)",
                filter: "blur(1px)",
              }}
            />

            <div
              aria-hidden
              className="absolute left-[16%] top-[12%] h-[38%] w-[42%] rounded-[50%] opacity-90"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.35) 45%, transparent 70%)",
              }}
            />

            <div
              aria-hidden
              className="absolute bottom-[16%] right-[14%] h-[28%] w-[34%] rounded-[50%] opacity-60"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(255,229,136,0.7) 0%, transparent 70%)",
              }}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
