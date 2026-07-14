"use client";

import { DEVICE_HEADER, DEVICE_STORAGE_KEY } from "./constants";
import type { QuotaSnapshot } from "./types";

function randomId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  try {
    const existing = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (existing && /^[a-zA-Z0-9_-]{8,80}$/.test(existing)) return existing;
    const id = randomId().slice(0, 32);
    localStorage.setItem(DEVICE_STORAGE_KEY, id);
    return id;
  } catch {
    return randomId().slice(0, 32);
  }
}

export function quotaHeaders(extra?: HeadersInit): HeadersInit {
  return {
    ...extra,
    [DEVICE_HEADER]: getDeviceId(),
  };
}

export async function fetchQuota(): Promise<QuotaSnapshot | null> {
  try {
    const res = await fetch("/api/quota", {
      headers: quotaHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.quota as QuotaSnapshot;
  } catch {
    return null;
  }
}

export async function consumeTrackQuota(trackId: string): Promise<{
  ok: boolean;
  quota?: QuotaSnapshot;
  error?: string;
  alreadyCounted?: boolean;
}> {
  try {
    const res = await fetch("/api/quota", {
      method: "POST",
      headers: quotaHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ action: "consume_track", trackId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || "QUOTA_TRACK", quota: data.quota };
    }
    return {
      ok: true,
      alreadyCounted: Boolean(data.alreadyCounted),
      quota: data.quota,
    };
  } catch {
    return { ok: false, error: "NETWORK" };
  }
}

export function quotaExhaustedMessage(quota?: QuotaSnapshot | null): string {
  const reset = quota?.resetLabel ? `将在 ${quota.resetLabel} 重置` : "明天 0 点后重置";
  return `今日制作次数已用完（每天最多 ${quota?.trackLimit ?? 2} 条）。删除作品不会返还次数。${reset}。`;
}
