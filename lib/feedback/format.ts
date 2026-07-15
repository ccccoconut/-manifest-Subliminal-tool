const TZ = "Asia/Shanghai";

export function formatFeedbackTime(ts: number): string {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}
