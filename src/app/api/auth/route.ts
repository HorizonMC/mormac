import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "mormac2026";
const SECRET = process.env.LINE_CHANNEL_SECRET || "mormac-auth-secret";

function signToken(payload: string): string {
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64")}.${sig}`;
}

export function verifyToken(token: string): boolean {
  try {
    const [payloadB64, sig] = token.split(".");
    if (!payloadB64 || !sig) return false;
    const payload = Buffer.from(payloadB64, "base64").toString();
    const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
    const data = JSON.parse(payload);
    return Date.now() - data.iat < 7 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  const userMatch = username === ADMIN_USER;
  const passMatch = password === ADMIN_PASS;
  if (!userMatch || !passMatch) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const payload = JSON.stringify({ iat: Date.now(), user: username, role: "admin" });
  const token = signToken(payload);

  (await cookies()).set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  (await cookies()).delete("admin_token");
  return NextResponse.json({ ok: true });
}
