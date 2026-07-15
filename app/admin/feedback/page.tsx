"use client";

import { useCallback, useEffect, useState } from "react";
import { formatFeedbackTime } from "@/lib/feedback/format";

type AdminItem = {
  id: string;
  text: string;
  deviceId: string | null;
  createdAt: number;
  reply?: string;
  repliedAt?: number;
};

export default function AdminFeedbackPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [items, setItems] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/feedback/admin", { cache: "no-store" });
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      if (!res.ok) throw new Error("加载失败");
      const data = (await res.json()) as { items?: AdminItem[] };
      const rows = Array.isArray(data.items) ? data.items : [];
      setItems(rows);
      setDrafts(
        Object.fromEntries(rows.map((item) => [item.id, item.reply ?? ""]))
      );
      setAuthed(true);
    } catch {
      setLoginError("加载反馈失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const login = async () => {
    setLoggingIn(true);
    setLoginError("");
    try {
      const res = await fetch("/api/feedback/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "登录失败");
      }
      setPassword("");
      await loadItems();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoggingIn(false);
    }
  };

  const logout = async () => {
    await fetch("/api/feedback/admin/login", { method: "DELETE" });
    setAuthed(false);
    setItems([]);
  };

  const saveReply = async (id: string) => {
    const reply = (drafts[id] ?? "").trim();
    if (!reply) return;
    setSavingId(id);
    try {
      const res = await fetch("/api/feedback/admin/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, reply }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "保存失败");
      }
      const data = (await res.json()) as { item?: AdminItem };
      if (data.item) {
        setItems((prev) =>
          prev.map((row) => (row.id === id ? { ...row, ...data.item } : row))
        );
      } else {
        await loadItems();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSavingId(null);
    }
  };

  if (authed === null) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center p-6">
        <p className="text-sm text-[var(--color-haze)]">加载中…</p>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-sm flex-col justify-center p-6">
        <div className="glass rounded-[var(--radius-2xl)] p-6">
          <h1 className="text-lg font-bold text-[var(--color-mist)]">反馈管理</h1>
          <p className="mt-2 text-xs text-[var(--color-haze)]">输入管理密码查看并回复用户反馈。</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void login()}
            placeholder="管理密码"
            className="mt-4 w-full rounded-2xl bg-black/[0.05] px-3.5 py-3 text-sm text-[var(--color-mist)] outline-none ring-1 ring-black/[0.06] focus:ring-[var(--color-aura)]/60"
          />
          {loginError ? (
            <p className="mt-2 text-xs text-rose-600">{loginError}</p>
          ) : null}
          <button
            type="button"
            onClick={() => void login()}
            disabled={loggingIn || !password}
            className="btn-primary mt-4 w-full rounded-full py-3 text-sm disabled:opacity-50"
          >
            {loggingIn ? "登录中…" : "进入管理"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col p-4 pb-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-mist)]">反馈管理</h1>
          <p className="mt-1 text-xs text-[var(--color-haze)]">
            共 {items.length} 条 · 回复后用户可在反馈页看到
          </p>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="btn-ghost shrink-0 rounded-full px-4 py-2 text-xs"
        >
          退出
        </button>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-[var(--color-haze)]">加载中…</p>
      ) : items.length === 0 ? (
        <div className="glass rounded-[var(--radius-2xl)] p-8 text-center text-sm text-[var(--color-haze)]">
          暂无反馈
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <article key={item.id} className="glass rounded-[var(--radius-2xl)] p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--color-mist)]">
                  {item.text}
                </p>
              </div>
              <p className="mt-2 text-right text-[11px] tabular-nums text-[var(--color-haze)]">
                {formatFeedbackTime(item.createdAt)}
                {item.deviceId ? ` · 设备 ${item.deviceId.slice(0, 8)}` : ""}
              </p>

              <div className="mt-4">
                <label className="text-xs font-semibold text-[var(--color-mist-soft)]">
                  {item.reply ? "更新回复" : "回复用户"}
                </label>
                <textarea
                  value={drafts[item.id] ?? ""}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [item.id]: e.target.value.slice(0, 500),
                    }))
                  }
                  rows={3}
                  className="mt-2 w-full resize-none rounded-2xl bg-black/[0.05] px-3.5 py-3 text-sm leading-relaxed text-[var(--color-mist)] outline-none ring-1 ring-black/[0.06] focus:ring-[var(--color-aura)]/60"
                />
                <div className="mt-2 flex items-center justify-between">
                  {item.repliedAt ? (
                    <span className="text-[11px] text-[var(--color-haze)]">
                      上次回复 {formatFeedbackTime(item.repliedAt)}
                    </span>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    onClick={() => void saveReply(item.id)}
                    disabled={savingId === item.id || !(drafts[item.id] ?? "").trim()}
                    className="btn-primary rounded-full px-5 py-2 text-xs disabled:opacity-50"
                  >
                    {savingId === item.id ? "保存中…" : item.reply ? "更新回复" : "发送回复"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
