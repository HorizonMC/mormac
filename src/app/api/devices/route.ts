import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const devices = await prisma.device.findMany({
    include: { shop: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(devices);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const device = await prisma.device.create({ data: body });
  return NextResponse.json(device, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { id, ...data } = await req.json();
  const device = await prisma.device.update({ where: { id }, data });
  return NextResponse.json(device);
}
