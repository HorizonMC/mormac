import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db-client";
import { pushRepairUpdate, buildQuoteConfirmFlex, lineClient } from "@/lib/line";

interface Props { params: Promise<{ id: string }>; }

export async function PATCH(req: NextRequest, { params }: Props) {
  const { id } = await params;
  const body = await req.json();
  const repair = await db.repairs.updateStatus(id, body);

  if (!repair) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.status && repair.customer?.lineUserId) {
    try {
      if (body.status === "quoted" && body.quotedPrice) {
        const flex = buildQuoteConfirmFlex(repair.repairCode, body.quotedPrice);
        await lineClient.pushMessage({ to: repair.customer.lineUserId, messages: [flex] });
      } else {
        await pushRepairUpdate(repair.customer.lineUserId, repair.repairCode, body.status);
      }
    } catch {}
  }

  return NextResponse.json({ ok: true, repairCode: repair.repairCode, status: repair.status });
}
