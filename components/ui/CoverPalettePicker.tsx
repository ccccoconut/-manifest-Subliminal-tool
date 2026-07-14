"use client";

import type { CoverPaletteId } from "@/lib/cover/generateCover";
import { listCoverTemplates } from "@/lib/cover/generateCover";

export default function CoverPalettePicker({
  disabled,
  onSelect,
}: {
  disabled?: boolean;
  onSelect: (id: CoverPaletteId) => void;
}) {
  const templates = listCoverTemplates();

  return (
    <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-2 scrollbar-thin">
      {templates.map((t) => (
        <button
          key={t.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(t.id)}
          className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5 disabled:opacity-50"
          aria-label={`使用${t.name}封面`}
        >
          <span
            className="h-14 w-14 rounded-xl ring-1 ring-black/[0.08] transition hover:ring-[var(--color-aura)]/50"
            style={{
              background: `linear-gradient(145deg, ${t.palette[0]}, ${t.palette[1]}, ${t.palette[2]})`,
            }}
          />
          <span className="text-[10px] text-[var(--color-haze)]">{t.name}</span>
        </button>
      ))}
    </div>
  );
}
