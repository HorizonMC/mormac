import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db-client";
import { verifySignedToken } from "@/lib/auth-token";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = (await cookies()).get("tech_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const staffId = verifySignedToken(token, "tech")?.staffId;
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
