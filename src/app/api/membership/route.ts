import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addPoints, getDiscount, TIERS } from "@/lib/membership";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    points: user.memberPoints,
    tier: user.memberTier,
    discount: getDiscount(user.memberTier),
    tiers: TIERS,
  });
}

export async function POST(req: NextRequest) {
  const { userId, amount } = await req.json();
  const result = await addPoints(userId, amount);
  return NextResponse.json(result);
}
