import fs from "fs";
import path from "path";
import {
  DAILY_AI_CALL_LIMIT,
  DAILY_TRACK_LIMIT,
  nextResetLabel,
  todayKey,
} from "./constants";
import type { DayQuota, QuotaSnapshot } from "./types";

type StoreFile = {
  devices: Record<string, DayQuota>;
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "quota.json");

let cache: StoreFile | null = null;

function emptyDay(date = todayKey()): DayQuota {
  return { date, tracksUsed: 0, trackIds: [], aiUsed: 0 };
}

function readStore(): StoreFile {
  if (cache) return cache;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf8");
      const parsed = JSON.parse(raw) as StoreFile;
      cache = {
        devices: parsed?.devices && typeof parsed.devices === "object" ? parsed.devices : {},
      };
      return cache;
    }
  } catch {
    /* corrupt → reset */
  }
  cache = { devices: {} };
  return cache;
}

function writeStore(store: StoreFile) {
  cache = store;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
  } catch (err) {
    console.warn("[quota] persist failed", err);
  }
}

function normalizeDeviceId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const id = raw.trim().slice(0, 80);
  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(id)) return null;
  return id;
}

function getDay(store: StoreFile, deviceId: string): DayQuota {
  const today = todayKey();
  const prev = store.devices[deviceId];
  if (!prev || prev.date !== today) {
    const fresh = emptyDay(today);
    store.devices[deviceId] = fresh;
    return fresh;
  }
  return prev;
}

export function toSnapshot(day: DayQuota): QuotaSnapshot {
  const trackLimit = DAILY_TRACK_LIMIT;
  const aiLimit = DAILY_AI_CALL_LIMIT;
  const tracksRemaining = Math.max(0, trackLimit - day.tracksUsed);
  const aiRemaining = Math.max(0, aiLimit - day.aiUsed);
  return {
    date: day.date,
    trackLimit,
    tracksUsed: day.tracksUsed,
    tracksRemaining,
    aiLimit,
    aiUsed: day.aiUsed,
    aiRemaining,
    resetLabel: nextResetLabel(),
    canCreate: tracksRemaining > 0,
    canCallAi: tracksRemaining > 0 && aiRemaining > 0,
  };
}

export function getQuota(deviceIdRaw: string | null | undefined): {
  ok: true;
  snapshot: QuotaSnapshot;
  deviceId: string;
} | { ok: false; error: "INVALID_DEVICE" } {
  const deviceId = normalizeDeviceId(deviceIdRaw);
  if (!deviceId) return { ok: false, error: "INVALID_DEVICE" };
  const store = readStore();
  const day = getDay(store, deviceId);
  writeStore(store);
  return { ok: true, deviceId, snapshot: toSnapshot(day) };
}

/** AI 调用前检查；若有额度则预扣 1 次 AI。作品额度用尽时禁止再调 AI。 */
export function reserveAiCall(deviceIdRaw: string | null | undefined): {
  ok: true;
  snapshot: QuotaSnapshot;
} | {
  ok: false;
  error: "INVALID_DEVICE" | "QUOTA_TRACK" | "QUOTA_AI";
  snapshot?: QuotaSnapshot;
} {
  const deviceId = normalizeDeviceId(deviceIdRaw);
  if (!deviceId) return { ok: false, error: "INVALID_DEVICE" };
  const store = readStore();
  const day = getDay(store, deviceId);
  const snap = toSnapshot(day);
  if (!snap.canCreate) {
    return { ok: false, error: "QUOTA_TRACK", snapshot: snap };
  }
  if (day.aiUsed >= DAILY_AI_CALL_LIMIT) {
    return { ok: false, error: "QUOTA_AI", snapshot: snap };
  }
  day.aiUsed += 1;
  store.devices[deviceId] = day;
  writeStore(store);
  return { ok: true, snapshot: toSnapshot(day) };
}

/**
 * 完整流程合成成功后计次。
 * 同一 trackId 只计一次；删除作品也不会回退。
 */
export function consumeTrack(
  deviceIdRaw: string | null | undefined,
  trackIdRaw: string | null | undefined
): {
  ok: true;
  snapshot: QuotaSnapshot;
  alreadyCounted: boolean;
} | {
  ok: false;
  error: "INVALID_DEVICE" | "QUOTA_TRACK" | "INVALID_TRACK";
  snapshot?: QuotaSnapshot;
} {
  const deviceId = normalizeDeviceId(deviceIdRaw);
  if (!deviceId) return { ok: false, error: "INVALID_DEVICE" };
  const trackId = (trackIdRaw || "").trim().slice(0, 80);
  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(trackId)) {
    return { ok: false, error: "INVALID_TRACK" };
  }

  const store = readStore();
  const day = getDay(store, deviceId);

  if (day.trackIds.includes(trackId)) {
    return { ok: true, alreadyCounted: true, snapshot: toSnapshot(day) };
  }

  if (day.tracksUsed >= DAILY_TRACK_LIMIT) {
    return { ok: false, error: "QUOTA_TRACK", snapshot: toSnapshot(day) };
  }

  day.trackIds.push(trackId);
  day.tracksUsed += 1;
  store.devices[deviceId] = day;
  writeStore(store);
  return { ok: true, alreadyCounted: false, snapshot: toSnapshot(day) };
}

export function assertCanStartTrack(deviceIdRaw: string | null | undefined) {
  return getQuota(deviceIdRaw);
}
