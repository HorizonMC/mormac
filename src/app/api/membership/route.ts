import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db-client";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  const users = await db.users.list();
  const user = users.find((u: any) => u.id === userId);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ points: user.memberPoints, tier: user.memberTier });
}
