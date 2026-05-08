import { NextRequest, NextResponse } from "next/server";

const DB_URL = process.env.DB_API_URL || "http://localhost:4100";
const DB_KEY = process.env.DB_API_KEY || "mormac-artron-2026";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("logo") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const body = new FormData();
  body.append("logo", file);

  const res = await fetch(`${DB_URL}/config/logo`, {
    method: "POST",
    headers: { "x-api-key": DB_KEY },
    body,
  });

  if (!res.ok) return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  const data = await res.json();
  return NextResponse.json(data);
}
