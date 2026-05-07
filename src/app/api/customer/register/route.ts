import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db-client";

export async function POST(req: NextRequest) {
  try {
    const { name, phone, password } = await req.json();
    if (!name || !phone || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await db.customer.register({ name, phone, password });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed";
    const status = message.includes("409") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
