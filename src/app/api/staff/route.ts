import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db-client";

export async function GET() {
  return NextResponse.json(await db.staff.list());
}

export async function POST(req: NextRequest) {
  const { name, phone, username, password, role, perms, shopId } = await req.json();

  const user = await db.users.create({ name, phone, role: "tech" });
  const staff = await db.staff.create({
    userId: user.id,
    shopId,
    username,
    password,
    role: role || "tech",
    perms: Array.isArray(perms) ? perms.join(",") : perms || "",
  });

  return NextResponse.json(staff, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { id, ...data } = await req.json();
  if (data.perms && Array.isArray(data.perms)) {
    data.perms = data.perms.join(",");
  }
  return NextResponse.json(await db.staff.update(id, data));
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await db.staff.delete(id);
  return NextResponse.json({ ok: true });
}
