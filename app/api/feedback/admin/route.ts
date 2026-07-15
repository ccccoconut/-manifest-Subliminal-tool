import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/feedback/admin";
import { listAllFeedback } from "@/lib/feedback/store";

export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const items = listAllFeedback().map((item) => ({
    id: item.id,
    text: item.text,
    deviceId: item.deviceId,
    createdAt: item.createdAt,
    reply: item.reply,
    repliedAt: item.repliedAt,
  }));

  return NextResponse.json({ items });
}
