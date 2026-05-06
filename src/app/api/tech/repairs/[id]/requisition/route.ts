import { NextRequest, NextResponse } from "next/server";
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = (await cookies()).get("tech_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const staffId = getStaffId(token);
  if (!staffId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { partId, quantity, cost } = await req.json();

  if (!partId || !quantity || quantity < 1) {
    return NextResponse.json({ error: "Missing partId or quantity" }, { status: 400 });
  }

  try {
    const result = await db.tech.requisition(staffId, id, { partId, quantity, cost: cost || 0 });
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
