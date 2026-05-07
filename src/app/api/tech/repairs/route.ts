import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db-client";
import { verifySignedToken } from "@/lib/auth-token";

export async function GET() {
  const token = (await cookies()).get("tech_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const staffId = verifySignedToken(token, "tech")?.staffId;
  if (!staffId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const repairs = await db.tech.repairs(staffId);
    return NextResponse.json(repairs);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
