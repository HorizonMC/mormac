import { NextRequest, NextResponse } from "next/server";
import { getBrand, saveBrand } from "@/lib/brand";

export async function GET() {
  return NextResponse.json(await getBrand());
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  await saveBrand(body);
  return NextResponse.json(await getBrand());
}
