import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db-client";

interface Props { params: Promise<{ id: string }>; }

export async function POST(req: NextRequest, { params }: Props) {
  const { id } = await params;
  const body = await req.json();
  const result = await db.repairs.addPart(id, body);
  return NextResponse.json(result, { status: 201 });
}
