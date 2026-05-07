import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { db } from "@/lib/db-client";

const SECRET = process.env.LINE_CHANNEL_SECRET || "mormac-auth-secret";

function signToken(payload: string): string {
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64")}.${sig}`;
}

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json();
    if (!phone || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const customer = await db.customer.auth(phone, password);

    const payload = JSON.stringify({
      iat: Date.now(),
      userId: customer.userId,
      name: customer.name,
      role: "customer",
    });
    const token = signToken(payload);

    (await cookies()).set("customer_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({ ok: true, name: customer.name });
  } catch {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
}

export async function DELETE() {
  (await cookies()).delete("customer_token");
  return NextResponse.json({ ok: true });
}
