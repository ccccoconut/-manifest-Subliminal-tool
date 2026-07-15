import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/feedback/admin";
import { setFeedbackReply } from "@/lib/feedback/store";

export async function POST(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  let body: { id?: unknown; reply?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "无效请求" }, { status: 400 });
  }

  const id = String(body.id ?? "").trim();
  const reply = String(body.reply ?? "").trim().slice(0, 500);
  if (!id) {
    return NextResponse.json({ error: "缺少反馈 ID" }, { status: 400 });
  }
  if (reply.length < 1) {
    return NextResponse.json({ error: "回复不能为空" }, { status: 400 });
  }

  const item = setFeedbackReply(id, reply);
  if (!item) {
    return NextResponse.json({ error: "反馈不存在" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    item: {
      id: item.id,
      text: item.text,
      deviceId: item.deviceId,
      createdAt: item.createdAt,
      reply: item.reply,
      repliedAt: item.repliedAt,
    },
  });
}
