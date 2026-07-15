import { NextResponse } from "next/server";
import {
  adminCookieOptions,
  ADMIN_COOKIE,
  adminPasswordConfigured,
  createAdminToken,
  verifyAdminPassword,
} from "@/lib/feedback/admin";

export async function POST(req: Request) {
  if (!adminPasswordConfigured()) {
    return NextResponse.json({ error: "管理功能未配置" }, { status: 503 });
  }

  let body: { password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "无效请求" }, { status: 400 });
  }

  const password = String(body.password ?? "");
  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "密码错误" }, { status: 401 });
  }

  const token = createAdminToken();
  if (!token) {
    return NextResponse.json({ error: "无法创建会话" }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, adminCookieOptions());
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { ...adminCookieOptions(), maxAge: 0 });
  return res;
}
