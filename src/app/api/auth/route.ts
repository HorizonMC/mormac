import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signToken, verifySignedToken } from "@/lib/auth-token";

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "mormac2026";

export function verifyToken(token: string): boolean {
  return !!verifySignedToken(token);
}

export async function POST(req: NextRequest) {
  if (!ADMIN_USER || !ADMIN_PASS) {
    return NextResponse.json({ error: "Admin credentials are not configured" }, { status: 500 });
  }
  const { username, password } = await req.json();

  const userMatch = username === ADMIN_USER;
  const passMatch = password === ADMIN_PASS;
  if (!userMatch || !passMatch) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = signToken({ iat: Date.now(), user: username, role: "admin" });

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
