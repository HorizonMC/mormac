import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

const ADMIN_PIN = process.env.ADMIN_PIN || "1234";
const SECRET = process.env.LINE_CHANNEL_SECRET || "mormac-auth-secret";

function signToken(payload: string): string {
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64")}.${sig}`;
}

export function verifyToken(token: string): boolean {
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return false;
  const payload = Buffer.from(payloadB64, "base64").toString();
  const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  const data = JSON.parse(payload);
  const age = Date.now() - data.iat;
  return age < 7 * 24 * 60 * 60 * 1000;
}

export async function POST(req: NextRequest) {
  const { pin } = await req.json();
  if (pin !== ADMIN_PIN) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  const payload = JSON.stringify({ iat: Date.now(), role: "admin" });
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
