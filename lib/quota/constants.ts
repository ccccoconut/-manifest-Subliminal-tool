/** 每日作品限额：完整流程合成成功才计 1 次；删除不返还。 */
export const DAILY_TRACK_LIMIT = Number(process.env.DAILY_TRACK_LIMIT || 2);

/**
 * 每日 AI 肯定语调用上限（防刷 DeepSeek）。
 * 默认 8：足够两条作品内的首次生成 + 有限次换语气重试。
 */
export const DAILY_AI_CALL_LIMIT = Number(process.env.DAILY_AI_CALL_LIMIT || 8);

export const DEVICE_HEADER = "x-device-id";
export const DEVICE_STORAGE_KEY = "innertune.device.v1";
export const QUOTA_TZ = "Asia/Shanghai";

export function todayKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: QUOTA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** 下一次额度重置的本地可读提示（上海时区次日 0 点） */
export function nextResetLabel(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: QUOTA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);
  // 次日 00:00 Asia/Shanghai ≈ UTC+8
  const next = new Date(Date.UTC(y, m - 1, d + 1, -8, 0, 0));
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: QUOTA_TZ,
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(next);
}
