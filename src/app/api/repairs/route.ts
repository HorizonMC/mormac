import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shopId");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (shopId) where.shopId = shopId;
  if (status) where.status = status;

  const repairs = await prisma.repair.findMany({
    where,
    include: { customer: true, tech: { include: { user: true } }, timeline: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(repairs);
}
