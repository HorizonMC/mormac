import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushRepairUpdate, buildQuoteConfirmFlex, lineClient } from "@/lib/line";

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const { id } = await params;
  const { status, note, quotedPrice, laborCost, actor } = await req.json();

  const repair = await prisma.repair.findUnique({
    where: { id },
    include: { customer: true },
  });

  if (!repair) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (status) updateData.status = status;
  if (quotedPrice !== undefined) updateData.quotedPrice = quotedPrice;
  if (laborCost !== undefined) updateData.laborCost = laborCost;
  if (status === "done") updateData.completedAt = new Date();

  await prisma.repair.update({ where: { id }, data: updateData });

  if (status) {
    await prisma.repairEvent.create({
      data: { repairId: id, status, note, actor },
    });
  }

  if (!status) {
    return NextResponse.json({ ok: true, repairCode: repair.repairCode });
  }

  // Push LINE notification
  if (repair.customer.lineUserId) {
    if (status === "quoted" && quotedPrice) {
      const flex = buildQuoteConfirmFlex(repair.repairCode, quotedPrice);
      await lineClient.pushMessage({
        to: repair.customer.lineUserId,
        messages: [flex],
      });
    } else {
      await pushRepairUpdate(repair.customer.lineUserId, repair.repairCode, status);
    }
  }

  return NextResponse.json({ ok: true, repairCode: repair.repairCode, status });
}
