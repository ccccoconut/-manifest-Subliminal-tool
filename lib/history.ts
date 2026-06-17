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

export function saveTrack(record: TrackRecord): TrackRecord[] {
  const list = [record, ...loadHistory().filter((r) => r.id !== record.id)].slice(
    0,
    MAX
  );
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // 配额超限：丢弃最旧的封面再试
    try {
      localStorage.setItem(KEY, JSON.stringify(list.slice(0, 4)));
    } catch {
      /* give up silently */
    }
  }
  return list;
}

export function deleteTrack(id: string): TrackRecord[] {
  const list = loadHistory().filter((r) => r.id !== id);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* noop */
  }
  return list;
}
