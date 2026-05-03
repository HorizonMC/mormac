import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { lineConfig, lineClient, pushRepairUpdate, type WebhookEvent } from "@/lib/line";
import { prisma } from "@/lib/prisma";
import { generateRepairCode } from "@/lib/repair-code";
import { getTrackingUrl } from "@/lib/qr";

export async function POST(req: NextRequest) {
  const body = await req.text();

  // Verify signature
  const signature = req.headers.get("x-line-signature");
  const hash = crypto
    .createHmac("SHA256", lineConfig.channelSecret)
    .update(body)
    .digest("base64");

  if (signature !== hash) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const { events } = JSON.parse(body) as { events: WebhookEvent[] };

  for (const event of events) {
    await handleEvent(event);
  }

  return NextResponse.json({ ok: true });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleEvent(event: any) {
  if (event.type === "message" && event.message.type === "text") {
    const text = event.message.text.trim();
    const userId: string | undefined = event.source?.userId;
    const replyToken: string = event.replyToken;
    if (!userId) return;

    if (text.startsWith("MOR-")) {
      await handleStatusCheck(userId, text, replyToken);
      return;
    }

    if (text === "แจ้งซ่อม") {
      await lineClient.replyMessage({
        replyToken,
        messages: [{
          type: "text",
          text: "📱 กรุณาแจ้งข้อมูลเครื่อง:\n\n1. รุ่น (เช่น iPhone 15 Pro)\n2. อาการเสีย\n3. ส่งรูปเครื่อง\n\nพิมพ์ตอบในรูปแบบ:\nรุ่น: iPhone 15 Pro\nอาการ: จอแตก ทัชไม่ได้",
        }],
      });
      return;
    }

    if (text === "เช็คสถานะ") {
      const repairs = await prisma.repair.findMany({
        where: { customer: { lineUserId: userId } },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      if (repairs.length === 0) {
        await lineClient.replyMessage({
          replyToken,
          messages: [{ type: "text", text: "ไม่พบรายการซ่อม\nกรุณาพิมพ์เลขซ่อม เช่น MOR-2605-0001" }],
        });
        return;
      }

      const list = repairs
        .map((r) => `${r.repairCode} | ${r.deviceModel} | ${r.status}`)
        .join("\n");

      await lineClient.replyMessage({
        replyToken,
        messages: [{ type: "text", text: `📋 รายการซ่อมล่าสุด:\n\n${list}\n\nพิมพ์เลขซ่อมเพื่อดูรายละเอียด` }],
      });
      return;
    }

    if (text.includes("รุ่น:") && text.includes("อาการ:")) {
      await handleNewRepair(userId, text, replyToken);
      return;
    }
  }

  if (event.type === "postback") {
    const userId: string | undefined = event.source?.userId;
    if (!userId) return;
    const params = new URLSearchParams(event.postback.data);
    const action = params.get("action");
    const code = params.get("code");

    if (action === "confirm" && code) {
      await prisma.repair.update({
        where: { repairCode: code },
        data: { status: "confirmed" },
      });
      await prisma.repairEvent.create({
        data: { repairId: (await prisma.repair.findUnique({ where: { repairCode: code } }))!.id, status: "confirmed", actor: "customer" },
      });
      await pushRepairUpdate(userId, code, "confirmed");
    }

    if (action === "cancel" && code) {
      await prisma.repair.update({
        where: { repairCode: code },
        data: { status: "cancelled" },
      });
      await pushRepairUpdate(userId, code, "cancelled");
    }
  }
}

async function handleStatusCheck(userId: string, code: string, replyToken: string) {
  const repair = await prisma.repair.findUnique({
    where: { repairCode: code },
    include: { timeline: { orderBy: { createdAt: "asc" } } },
  });

  if (!repair) {
    await lineClient.replyMessage({
      replyToken,
      messages: [{ type: "text", text: `❌ ไม่พบเลขซ่อม ${code}` }],
    });
    return;
  }

  const timeline = repair.timeline
    .map((e) => `• ${e.status} — ${e.createdAt.toLocaleDateString("th-TH")}`)
    .join("\n");

  const trackUrl = getTrackingUrl(code);

  await lineClient.replyMessage({
    replyToken,
    messages: [{
      type: "text",
      text: `📱 ${repair.deviceModel}\nเลขซ่อม: ${code}\nสถานะ: ${repair.status}\n\n${timeline}\n\n🔗 ดูออนไลน์: ${trackUrl}`,
    }],
  });
}

async function handleNewRepair(lineUserId: string, text: string, replyToken: string) {
  const modelMatch = text.match(/รุ่น:\s*(.+)/);
  const symptomMatch = text.match(/อาการ:\s*(.+)/);

  if (!modelMatch || !symptomMatch) return;

  const deviceModel = modelMatch[1].trim();
  const symptoms = symptomMatch[1].trim();

  // Detect device type from model name
  let deviceType = "other";
  const lower = deviceModel.toLowerCase();
  if (lower.includes("iphone")) deviceType = "iphone";
  else if (lower.includes("macbook") || lower.includes("mac")) deviceType = "macbook";
  else if (lower.includes("ipad")) deviceType = "ipad";
  else if (lower.includes("watch")) deviceType = "watch";
  else if (lower.includes("airpods")) deviceType = "airpods";

  // Find or create customer
  let customer = await prisma.user.findUnique({ where: { lineUserId } });
  if (!customer) {
    customer = await prisma.user.create({
      data: { lineUserId, name: "LINE User", role: "customer" },
    });
  }

  // Get default shop (first shop in system)
  const shop = await prisma.shop.findFirst();
  if (!shop) {
    await lineClient.replyMessage({
      replyToken,
      messages: [{ type: "text", text: "⚠️ ระบบยังไม่พร้อม กรุณาติดต่อร้านโดยตรง" }],
    });
    return;
  }

  const repairCode = await generateRepairCode();
  const trackUrl = getTrackingUrl(repairCode);

  const repair = await prisma.repair.create({
    data: {
      repairCode,
      shopId: shop.id,
      customerId: customer.id,
      deviceModel,
      deviceType,
      symptoms,
      status: "submitted",
    },
  });

  await prisma.repairEvent.create({
    data: { repairId: repair.id, status: "submitted", actor: "customer" },
  });

  await lineClient.replyMessage({
    replyToken,
    messages: [
      {
        type: "text",
        text: `✅ แจ้งซ่อมสำเร็จ!\n\n📱 ${deviceModel}\n🔧 อาการ: ${symptoms}\n🔢 เลขซ่อม: ${repairCode}\n\n🔗 ติดตามสถานะ: ${trackUrl}\n\nกรุณาส่งเครื่องมาที่ร้าน พร้อมแจ้งเลขซ่อม ${repairCode}`,
      },
    ],
  });
}
