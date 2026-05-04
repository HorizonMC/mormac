import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_PIN = process.env.ADMIN_PIN || "1234";

export async function POST(req: NextRequest) {
  const { pin } = await req.json();

  if (pin !== ADMIN_PIN) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  const token = Buffer.from(`${Date.now()}:${pin}`).toString("base64");
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
