import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db-client";

export async function GET() {
  return NextResponse.json(await db.devices.list());
}

export async function POST(req: NextRequest) {
  return NextResponse.json(await db.devices.create(await req.json()), { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { id, ...data } = await req.json();
  return NextResponse.json(await db.devices.update(id, data));
}
