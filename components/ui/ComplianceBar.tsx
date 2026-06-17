import { DISCLAIMER_AUDIO, DISCLAIMER_VOICE } from "@/lib/constants";

export default function ComplianceBar({ compact = false }: { compact?: boolean }) {
  return (
    <div className="mx-auto max-w-2xl px-4 text-center text-[11px] leading-relaxed text-[var(--color-haze)]">
      <p>
        <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] tracking-wide text-[var(--color-mist-soft)]">
          AI 辅助生成
        </span>{" "}
        {DISCLAIMER_AUDIO}
      </p>
      {!compact && <p className="mt-1">{DISCLAIMER_VOICE}</p>}
    </div>
  );
}
