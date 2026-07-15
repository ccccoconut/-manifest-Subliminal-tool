import { formatFeedbackTime } from "./format";
import type { FeedbackEntry } from "./types";

function adminUrl(): string {
  const base = process.env.SITE_URL?.trim().replace(/\/$/, "");
  return base ? `${base}/admin/feedback` : "/admin/feedback";
}

export async function notifyNewFeedback(entry: FeedbackEntry): Promise<void> {
  const webhook = process.env.LARK_FEEDBACK_WEBHOOK_URL?.trim();
  if (!webhook) return;

  const device = entry.deviceId ? entry.deviceId.slice(0, 8) : "未知";
  const text = [
    "【酥饼】收到新反馈",
    `时间：${formatFeedbackTime(entry.createdAt)}`,
    `设备：${device}`,
    `内容：${entry.text}`,
    `管理：${adminUrl()}`,
  ].join("\n");

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        msg_type: "text",
        content: { text },
      }),
    });
    if (!res.ok) {
      console.error("[feedback] lark webhook failed", res.status, await res.text());
    }
  } catch (err) {
    console.error("[feedback] lark webhook error", err);
  }
}
