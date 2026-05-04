import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Props) {
  const { id } = await params;
  const { partId, quantity, cost } = await req.json();

  const part = await prisma.part.findUnique({ where: { id: partId } });
  if (!part || part.quantity < quantity) {
    return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
  }

  const [repairPart] = await prisma.$transaction([
    prisma.repairPart.create({
      data: { repairId: id, partId, quantity, cost },
    }),
    prisma.part.update({
      where: { id: partId },
      data: { quantity: { decrement: quantity } },
    }),
    prisma.repair.update({
      where: { id },
      data: { partsCost: { increment: cost } },
    }),
  ]);

  return NextResponse.json(repairPart, { status: 201 });
}
