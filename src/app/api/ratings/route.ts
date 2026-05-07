import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db-client";

export async function POST(req: NextRequest) {
  const { repairId, score, comment } = await req.json();
  if (!repairId || typeof score !== "number") {
    return NextResponse.json({ error: "Missing repairId or score" }, { status: 400 });
  }
  try {
    const rating = await db.ratings.create(repairId, { score, comment });
    return NextResponse.json(rating, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    const status = message.includes("409") ? 409 : message.includes("400") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
