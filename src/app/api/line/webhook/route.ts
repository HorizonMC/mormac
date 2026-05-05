import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  lineConfig, lineClient,
  buildRepairStatusFlex, buildRepairListFlex,
  buildSubmitSuccessFlex, buildReportGuide,
  pushRepairUpdate,
} from "@/lib/line";
import { db } from "@/lib/db-client";
import { getTrackingUrl } from "@/lib/qr";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-line-signature");
  if (!lineConfig.channelSecret) return NextResponse.json({ error: "Channel secret not configured" }, { status: 500 });
  const hash = crypto.createHmac("SHA256", lineConfig.channelSecret).update(body).digest("base64");
  if (signature !== hash) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const { events } = JSON.parse(body);
  for (const event of events) await handleEvent(event);
  return NextResponse.json({ ok: true });
}

async function handleEvent(event: any) {
  if (event.type === "message" && event.message.type === "text") {
    const text = event.message.text.trim();
    const userId: string | undefined = event.source?.userId;
    const replyToken: string = event.replyToken;
    if (!userId) return;

    // Track by repair code
    if (text.startsWith("MOR-")) {
      const repair = await db.repairs.getByCode(text);
      const trackUrl = getTrackingUrl(text);
      if (!repair) {
        await lineClient.replyMessage({ replyToken, messages: [{ type: "text", text: `❌ ไม่พบเลขซ่อม ${text}\n\nกรุณาตรวจสอบเลขซ่อมอีกครั้ง` }] });
      } else {
        await lineClient.replyMessage({ replyToken, messages: [buildRepairStatusFlex(repair, trackUrl)] });
      }
      return;
    }

    // Report repair guide
    if (text === "แจ้งซ่อม") {
      await lineClient.replyMessage({ replyToken, messages: [buildReportGuide()] });
      return;
    }

    // Check status
    if (text === "เช็คสถานะ") {
      const user = await db.users.getByLine(userId);
      if (!user) {
        await lineClient.replyMessage({ replyToken, messages: [{ type: "text", text: "ไม่พบรายการซ่อม\nกรุณาพิมพ์เลขซ่อม เช่น MOR-2605-0001" }] });
        return;
      }
      const repairs = (await db.repairs.list()).filter((r: any) => r.customerId === user.id).slice(0, 5);
      if (repairs.length === 0) {
        await lineClient.replyMessage({ replyToken, messages: [{ type: "text", text: "ไม่พบรายการซ่อม" }] });
        return;
      }
      await lineClient.replyMessage({ replyToken, messages: [buildRepairListFlex(repairs)] });
      return;
    }

    // Submit repair — flexible matching: "รุ่น:", "รุ่น :", "รุ่น", etc.
    const modelMatch = text.match(/รุ่น\s*[:：]\s*(.+)/m);
    const symptomMatch = text.match(/อาการ\s*[:：]\s*(.+)/m);
    if (modelMatch && symptomMatch) {
      const deviceModel = modelMatch[1].trim();
      const symptoms = symptomMatch[1].trim();
      let deviceType = "other";
      const lower = deviceModel.toLowerCase();
      if (lower.includes("iphone")) deviceType = "iphone";
      else if (lower.includes("macbook") || lower.includes("mac")) deviceType = "macbook";
      else if (lower.includes("ipad")) deviceType = "ipad";
      else if (lower.includes("watch")) deviceType = "watch";

      let customer = await db.users.getByLine(userId);
      if (!customer) customer = await db.users.create({ lineUserId: userId, name: "LINE User", role: "customer" });

      const shops = await db.shops.list();
      if (shops.length === 0) {
        await lineClient.replyMessage({ replyToken, messages: [{ type: "text", text: "⚠️ ระบบยังไม่พร้อม กรุณาติดต่อร้านโดยตรง" }] });
        return;
      }

      const { code: repairCode } = await db.repairs.generateCode();
      const trackUrl = getTrackingUrl(repairCode);

      await db.repairs.create({ repairCode, shopId: shops[0].id, customerId: customer.id, deviceModel, deviceType, symptoms, status: "submitted" });

      await lineClient.replyMessage({ replyToken, messages: [buildSubmitSuccessFlex(repairCode, deviceModel, symptoms, trackUrl)] });
      return;
    }

    // Default: help
    await lineClient.replyMessage({
      replyToken,
      messages: [{
        type: "text",
        text: `สวัสดีค่ะ 🙏 หมอแมค MorMac\n\nพิมพ์:\n• \"แจ้งซ่อม\" — แจ้งซ่อมเครื่อง\n• \"เช็คสถานะ\" — ดูงานซ่อมของคุณ\n• \"MOR-XXXX-XXXX\" — ค้นหาเลขซ่อม`,
      }],
    });
  }

  if (event.type === "postback") {
    const userId = event.source?.userId;
    if (!userId) return;
    const params = new URLSearchParams(event.postback.data);
    const action = params.get("action");
    const code = params.get("code");
    if (action === "confirm" && code) {
      const repair = await db.repairs.getByCode(code);
      if (repair) await db.repairs.updateStatus(repair.id, { status: "confirmed", actor: "customer" });
      await pushRepairUpdate(userId, code, "confirmed");
    }
    if (action === "cancel" && code) {
      const repair = await db.repairs.getByCode(code);
      if (repair) await db.repairs.updateStatus(repair.id, { status: "cancelled", actor: "customer" });
      await pushRepairUpdate(userId, code, "cancelled");
    }
  }
}
