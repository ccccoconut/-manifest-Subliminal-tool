import type { MixParams, Ratings } from "./types";

const KEY = "innertune.history.v1";
const MAX = 8;

export interface TrackRecord {
  id: string;
  title: string;
  scene: string;
  emotionTags: string[];
  lines: string[];
  anchorLine: string;
  params: MixParams;
  coverDataUrl: string;
  durationSec: number;
  ratings?: Ratings;
  createdAt: number;
  /** 音频是否已写入 IndexedDB（旧记录可能没有） */
  hasAudio?: boolean;
}

export function loadHistory(): TrackRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function persist(list: TrackRecord[]): TrackRecord[] {
  const clipped = list.slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(clipped));
  } catch {
    try {
      localStorage.setItem(KEY, JSON.stringify(clipped.slice(0, 4)));
    } catch {
      /* give up silently */
    }
  }
  return clipped;
}

export function saveTrack(record: TrackRecord): TrackRecord[] {
  return persist([record, ...loadHistory().filter((r) => r.id !== record.id)]);
}

export function updateTrack(
  id: string,
  patch: Partial<Omit<TrackRecord, "id" | "createdAt">>
): TrackRecord[] {
  const list = loadHistory().map((r) =>
    r.id === id ? { ...r, ...patch } : r
  );
  return persist(list);
}

export function deleteTrack(id: string): TrackRecord[] {
  return persist(loadHistory().filter((r) => r.id !== id));
}
