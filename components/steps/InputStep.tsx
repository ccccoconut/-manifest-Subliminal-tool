"use client";

import { useState } from "react";
import { APP_NAME, DEMO_CASES, SCENES } from "@/lib/constants";
import { SceneIcon } from "@/components/ui/icons";
import type { SceneKey, UserInput } from "@/lib/types";

export default function InputStep({
  onGenerate,
  loading,
  initial,
}: {
  onGenerate: (input: UserInput) => void;
  loading: boolean;
  initial?: UserInput | null;
}) {
  const [scene, setScene] = useState<SceneKey>(initial?.scene ?? "interview");
  const [state, setState] = useState(initial?.state ?? "");
  const [target, setTarget] = useState(initial?.target ?? "");
  const [avoid, setAvoid] = useState(initial?.avoid ?? "");

  const canGo = state.trim().length >= 2 && !loading;

  const fillDemo = (d: (typeof DEMO_CASES)[number]) => {
    setScene(d.scene);
    setState(d.state);
    setTarget(d.target);
    setAvoid(d.avoid);
  };

  return (
    <div className="mx-auto w-full max-w-2xl text-center">
      <p className="mb-3 text-sm tracking-wide text-[var(--color-aura)]">
        {APP_NAME} · 把「我不行」变成你声音里的「我可以」
      </p>
      <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
        今天想从什么状态
        <br className="sm:hidden" />
        <span className="text-gradient">出发？</span>
      </h1>

      {/* scene chips */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {SCENES.map((s) => (
          <button
            key={s.key}
            onClick={() => setScene(s.key)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-all ${
              scene === s.key
                ? "bg-[var(--color-aura)]/25 text-[var(--color-mist)] ring-1 ring-[var(--color-aura)]/60"
                : "bg-black/[0.05] text-[var(--color-mist-soft)] hover:bg-black/[0.07]"
            }`}
          >
            <SceneIcon scene={s.key} className="h-4 w-4 opacity-80" />
            {s.label}
          </button>
        ))}
      </div>

      <div className="glass mt-5 space-y-3 rounded-[var(--radius-2xl)] p-4 text-left">
        <div>
          <label className="mb-1.5 block text-xs text-[var(--color-haze)]">
            我现在的状态 <span className="text-[var(--color-glow)]">*</span>
          </label>
          <textarea
            value={state}
            onChange={(e) => setState(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder="例如：我明天面试，很怕自己答不好，看到别人都有 offer，觉得自己很差。"
            className="w-full resize-none rounded-2xl bg-black/[0.05] p-3.5 text-base text-[var(--color-mist)] outline-none placeholder:text-[var(--color-haze)] focus:bg-black/[0.07]"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs text-[var(--color-haze)]">
              我希望听完后变成…
            </label>
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              maxLength={120}
              placeholder="更稳定、更相信自己"
              className="w-full rounded-xl bg-black/[0.05] px-3.5 py-2.5 text-sm text-[var(--color-mist)] outline-none placeholder:text-[var(--color-haze)] focus:bg-black/[0.07]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-[var(--color-haze)]">
              我不想听到…
            </label>
            <input
              value={avoid}
              onChange={(e) => setAvoid(e.target.value)}
              maxLength={120}
              placeholder="不要太鸡血、不要空话"
              className="w-full rounded-xl bg-black/[0.05] px-3.5 py-2.5 text-sm text-[var(--color-mist)] outline-none placeholder:text-[var(--color-haze)] focus:bg-black/[0.07]"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-[var(--color-haze)]">试试：</span>
        {DEMO_CASES.map((c) => (
          <button
            key={c.label}
            onClick={() => fillDemo(c)}
            className="rounded-full border border-black/[0.07] px-3 py-1.5 text-xs text-[var(--color-mist-soft)] transition-colors hover:border-[var(--color-aura)]/60 hover:text-[var(--color-mist)]"
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-7 flex flex-col items-center gap-3">
        <button
          onClick={() =>
            canGo && onGenerate({ scene, state: state.trim(), target, avoid })
          }
          disabled={!canGo}
          className="btn-primary rounded-full px-8 py-3.5 text-base"
        >
          {loading ? "正在理解你的状态…" : "生成我的心声调频"}
        </button>
        <button
          onClick={() => {
            if (loading) return;
            fillDemo(DEMO_CASES[0]);
            onGenerate(DEMO_CASES[0]);
          }}
          disabled={loading}
          className="text-sm text-[var(--color-haze)] transition-colors hover:text-[var(--color-mist)] disabled:opacity-50"
        >
          ▶ 没想好？一键看一个完整演示
        </button>
      </div>
    </div>
  );
}
