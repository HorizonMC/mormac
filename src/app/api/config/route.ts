import { NextRequest, NextResponse } from "next/server";
import { getBrand, saveBrand } from "@/lib/brand";
import { db } from "@/lib/db-client";

export async function GET() {
  const brand = await getBrand();
  const rows = await db.config.get();
  const line: Record<string, string> = {};
  for (const r of rows) {
    if (r.key.startsWith("line.")) line[r.key.replace("line.", "")] = r.value;
  }
  return NextResponse.json({ ...brand, line });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { line, ...brandFields } = body;
  await saveBrand(brandFields);
  if (line) {
    const entries: { key: string; value: string }[] = [];
    if (line.channelAccessToken !== undefined) entries.push({ key: "line.channelAccessToken", value: line.channelAccessToken });
    if (line.channelSecret !== undefined) entries.push({ key: "line.channelSecret", value: line.channelSecret });
    if (line.oaId !== undefined) entries.push({ key: "line.oaId", value: line.oaId });
    if (entries.length) await db.config.save(entries);
  }
  return NextResponse.json({ ok: true });
}
