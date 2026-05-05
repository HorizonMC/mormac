import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db-client";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") || undefined;
  const repairs = await db.repairs.list(status);
  return NextResponse.json(repairs);
}
