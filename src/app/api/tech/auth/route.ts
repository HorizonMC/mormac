import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db-client";
import { signToken } from "@/lib/auth-token";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const staff = await db.tech.auth(username, password);

    const token = signToken({
      iat: Date.now(),
      staffId: staff.staffId,
      name: staff.name,
      role: "tech",
      perms: staff.perms,
    });

    (await cookies()).set("tech_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({ ok: true, name: staff.name });
  } catch {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
}

export async function DELETE() {
  (await cookies()).delete("tech_token");
  return NextResponse.json({ ok: true });
}
