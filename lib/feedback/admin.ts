import crypto from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "feedback_admin_token";
const TOKEN_MAX_AGE_SEC = 7 * 24 * 60 * 60;

function adminSecret(): string | null {
  const secret =
    process.env.FEEDBACK_ADMIN_SECRET?.trim() ||
    process.env.FEEDBACK_ADMIN_PASSWORD?.trim();
  return secret || null;
}

export function adminPasswordConfigured(): boolean {
  return Boolean(process.env.FEEDBACK_ADMIN_PASSWORD?.trim());
}

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.FEEDBACK_ADMIN_PASSWORD?.trim();
  if (!expected) return false;
  const a = Buffer.from(password.trim());
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function createAdminToken(): string | null {
  const secret = adminSecret();
  if (!secret) return null;
  const exp = Date.now() + TOKEN_MAX_AGE_SEC * 1000;
  const payload = Buffer.from(JSON.stringify({ exp })).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const secret = adminSecret();
  if (!secret) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      exp?: number;
    };
    return typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: TOKEN_MAX_AGE_SEC,
  };
}

export async function isAdminRequest(req: Request): Promise<boolean> {
  const header = req.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    return verifyAdminToken(header.slice(7).trim());
  }
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);
}
