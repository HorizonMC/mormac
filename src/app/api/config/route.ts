import { NextRequest, NextResponse } from "next/server";
import { getBrand, saveBrand } from "@/lib/brand";

export async function GET() {
  const config = await getBrand();
  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  await saveBrand(body);
  const updated = await getBrand();
  return NextResponse.json(updated);
}
