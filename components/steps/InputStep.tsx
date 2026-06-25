"use client";

import { useEffect, useState } from "react";
import type { UserInput } from "@/lib/types";

export default function InputStep({
  onGenerate,
  loading,
  initial,
}: {
  onGenerate: (input: UserInput) => void;
  loading: boolean;
  initial?: UserInput | null;
}) {
  const [message, setMessage] = useState(initial?.state ?? "");

  useEffect(() => {
    setMessage(initial?.state ?? "");
  }, [initial?.state]);

  const canGo = message.trim().length >= 2 && !loading;

  return (
    <div className="mx-auto w-full max-w-3xl text-center">
      <h1 className="text-3xl font-bold leading-tight text-[var(--color-mist)] sm:text-5xl">
        在想什么呢？
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[var(--color-mist-soft)] sm:text-base">
        可以说说你的现状、担心或者期许~酥饼会自动生成适合你的肯定语。
      </p>

      <div className="glass mt-7 rounded-[var(--radius-2xl)] p-4 text-left sm:p-5">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={200}
          rows={7}
          placeholder="例如：我想拿到这个 offer，但我总担心自己表达不好，也会忍不住和别人比较。"
          className="w-full resize-none rounded-3xl bg-black/[0.05] p-5 text-lg leading-relaxed text-[var(--color-mist)] outline-none placeholder:text-[var(--color-haze)] focus:bg-black/[0.07] sm:text-xl"
        />
        <div className="mt-2 flex items-start justify-end gap-3 px-1 text-[11px] leading-relaxed text-[var(--color-haze)]">
          <span className="shrink-0 tabular-nums">{message.length}/200</span>
        </div>
      </div>

      <div className="mt-7">
        <button
          onClick={() =>
            canGo &&
            onGenerate({
              scene: "other",
              state: message.trim(),
              target: "",
              avoid: "",
            })
          }
          disabled={!canGo}
          className="btn-primary rounded-full px-8 py-3.5 text-base disabled:opacity-50"
        >
          {loading ? "正在生成肯定语…" : "生成肯定语"}
        </button>
      </div>
    </div>
  );
}
