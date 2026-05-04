import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shopId");

  const parts = await prisma.part.findMany({
    where: shopId ? { shopId } : undefined,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(parts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const part = await prisma.part.create({ data: body });
  return NextResponse.json(part, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { id, ...data } = await req.json();

  const part = await prisma.part.update({ where: { id }, data });
  return NextResponse.json(part);
}
