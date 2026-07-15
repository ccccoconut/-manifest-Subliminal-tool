import fs from "fs";
import path from "path";
import type { FeedbackEntry, FeedbackStore } from "./types";

const CANDIDATE_DIRS = [
  path.join(process.cwd(), "data"),
  path.join("/tmp", "innertune-feedback"),
];

function resolveFile(): string {
  for (const dir of CANDIDATE_DIRS) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      const probe = path.join(dir, ".write-test");
      fs.writeFileSync(probe, "ok");
      fs.unlinkSync(probe);
      return path.join(dir, "feedback.json");
    } catch {
      /* try next */
    }
  }
  return path.join(CANDIDATE_DIRS[0], "feedback.json");
}

const FEEDBACK_FILE = resolveFile();

export function readFeedbackStore(): FeedbackStore {
  try {
    if (fs.existsSync(FEEDBACK_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(FEEDBACK_FILE, "utf8")) as FeedbackStore;
      if (Array.isArray(parsed?.items)) return parsed;
    }
  } catch {
    /* reset */
  }
  return { items: [] };
}

export function writeFeedbackStore(store: FeedbackStore) {
  fs.mkdirSync(path.dirname(FEEDBACK_FILE), { recursive: true });
  fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(store, null, 2), "utf8");
}

export function addFeedback(entry: Omit<FeedbackEntry, "reply" | "repliedAt">): FeedbackEntry {
  const store = readFeedbackStore();
  const item: FeedbackEntry = { ...entry };
  store.items.push(item);
  if (store.items.length > 500) {
    store.items = store.items.slice(-500);
  }
  writeFeedbackStore(store);
  return item;
}

export function listFeedbackByDevice(deviceId: string): FeedbackEntry[] {
  return readFeedbackStore()
    .items.filter((item) => item.deviceId === deviceId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function listAllFeedback(): FeedbackEntry[] {
  return readFeedbackStore().items.sort((a, b) => b.createdAt - a.createdAt);
}

export function setFeedbackReply(id: string, reply: string): FeedbackEntry | null {
  const store = readFeedbackStore();
  const item = store.items.find((row) => row.id === id);
  if (!item) return null;
  item.reply = reply;
  item.repliedAt = Date.now();
  writeFeedbackStore(store);
  return item;
}
