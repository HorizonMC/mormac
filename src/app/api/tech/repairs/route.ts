import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db-client";

function getStaffId(token: string): string | null {
  try {
    const [b64] = token.split(".");
    const data = JSON.parse(Buffer.from(b64, "base64").toString());
    if (Date.now() - data.iat > 7 * 24 * 60 * 60 * 1000) return null;
    return data.staffId;
  } catch {
    return null;
  }
}

export async function GET() {
  const token = (await cookies()).get("tech_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const staffId = getStaffId(token);
  if (!staffId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const repairs = await db.tech.repairs(staffId);
    return NextResponse.json(repairs);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
