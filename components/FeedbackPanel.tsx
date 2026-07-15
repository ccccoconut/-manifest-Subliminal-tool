"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { quotaHeaders } from "@/lib/quota/client";
import { formatFeedbackTime } from "@/lib/feedback/format";
import type { FeedbackPublic } from "@/lib/feedback/types";

const MAX_LEN = 200;

interface FeedbackPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FeedbackPanel({ open, onOpenChange }: FeedbackPanelProps) {
  const [items, setItems] = useState<FeedbackPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadItems = useCallback(async () => {
    try {
      const res = await fetch("/api/feedback", {
        headers: quotaHeaders(),
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { items?: FeedbackPublic[] };
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const close = () => {
    if (submitting) return;
    onOpenChange(false);
    setError("");
  };

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError("请先写下你想反馈的内容。");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: quotaHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ text: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          typeof data.error === "string" ? data.error : "提交失败，请稍后再试。"
        );
      }
      const data = (await res.json()) as { item?: FeedbackPublic };
      setText("");
      onOpenChange(false);
      if (data.item) {
        setItems((prev) => [data.item!, ...prev.filter((row) => row.id !== data.item!.id)]);
      } else {
        await loadItems();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败，请稍后再试。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="glass flex min-h-0 flex-1 flex-col rounded-[var(--radius-2xl)] px-4 py-4">
        {items.length === 0 && !loading ? (
          <div className="flex flex-1 flex-col items-center justify-center px-2 text-center">
            <p className="text-sm font-semibold text-[var(--color-mist)]">遇到问题或有好主意？</p>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-[var(--color-haze)]">
              个人开发的自用小工具，很希望听到您的反馈和建议，我会认真读取回复，请友善发言哦~
            </p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {items.length > 0 && (
              <p className="mb-3 px-1 text-center text-xs leading-relaxed text-[var(--color-haze)]">
                个人开发的自用小工具，很希望听到您的反馈和建议，我会认真读取回复，请友善发言哦~
              </p>
            )}
            <div className="flex flex-col gap-3 pb-1">
              {loading && items.length === 0 ? (
                <p className="py-8 text-center text-xs text-[var(--color-haze)]">加载中…</p>
              ) : (
                items.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl bg-black/[0.04] px-3.5 py-3 ring-1 ring-black/[0.05]"
                  >
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--color-mist)]">
                      {item.text}
                    </p>
                    <p className="mt-3 text-right text-[11px] tabular-nums text-[var(--color-haze)]">
                      {formatFeedbackTime(item.createdAt)}
                    </p>
                    {item.reply ? (
                      <div className="mt-3 rounded-xl bg-[var(--color-aura)]/10 px-3 py-2.5">
                        <p className="text-[11px] font-semibold text-[var(--color-aura)]">开发者回复</p>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--color-mist-soft)]">
                          {item.reply}
                        </p>
                        {item.repliedAt ? (
                          <p className="mt-2 text-right text-[11px] tabular-nums text-[var(--color-haze)]">
                            {formatFeedbackTime(item.repliedAt)}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.button
              type="button"
              aria-label="关闭"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={close}
            />
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="glass relative w-full max-w-md rounded-t-[1.75rem] p-5 sm:rounded-[var(--radius-2xl)]"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-semibold text-[var(--color-mist)]">写下你的反馈</h3>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
                placeholder=""
                rows={5}
                className="mt-4 w-full resize-none rounded-2xl bg-black/[0.05] px-3.5 py-3 text-sm leading-relaxed text-[var(--color-mist)] outline-none ring-1 ring-black/[0.06] placeholder:text-[var(--color-haze)] focus:ring-[var(--color-aura)]/60"
                autoFocus
              />
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-rose-600">{error}</span>
                <span className="tabular-nums text-[var(--color-haze)]">
                  {text.length}/{MAX_LEN}
                </span>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={close}
                  disabled={submitting}
                  className="btn-ghost rounded-full px-5 py-2.5 text-sm disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={submitting || !text.trim()}
                  className="btn-primary rounded-full px-6 py-2.5 text-sm disabled:opacity-50"
                >
                  {submitting ? "提交中…" : "发送"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
