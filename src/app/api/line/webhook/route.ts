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

    // Exact menu keywords
    if (text === "แจ้งซ่อม") {
      await lineClient.replyMessage({ replyToken, messages: [buildReportGuide()] });
      return;
    }

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

    // AI-powered parsing — send to local LLM
    try {
      const ai = await db.ai.parse(text);

      if (ai.intent === "repair" && ai.device && ai.symptoms) {
        let customer = await db.users.getByLine(userId);
        if (!customer) customer = await db.users.create({ lineUserId: userId, name: "LINE User", role: "customer" });

        const shops = await db.shops.list();
        if (shops.length === 0) {
          await lineClient.replyMessage({ replyToken, messages: [{ type: "text", text: "⚠️ ระบบยังไม่พร้อม กรุณาติดต่อร้านโดยตรง" }] });
          return;
        }

        const { code: repairCode } = await db.repairs.generateCode();
        const trackUrl = getTrackingUrl(repairCode);
        const deviceType = ai.type || "other";
        const deviceModel = ai.specs ? `${ai.device} (${ai.specs})` : ai.device;

        await db.repairs.create({ repairCode, shopId: shops[0].id, customerId: customer.id, deviceModel, deviceType, symptoms: ai.symptoms, status: "submitted" });
        await lineClient.replyMessage({ replyToken, messages: [buildSubmitSuccessFlex(repairCode, deviceModel, ai.symptoms, trackUrl)] });
        return;
      }

      if (ai.intent === "need_info" && ai.reply) {
        await lineClient.replyMessage({ replyToken, messages: [{ type: "text", text: ai.reply }] });
        return;
      }

      if ((ai.intent === "inquiry" || ai.intent === "chat") && ai.reply) {
        await lineClient.replyMessage({ replyToken, messages: [{ type: "text", text: ai.reply }] });
        return;
      }
    } catch {
      // AI unavailable — fall through to default
    }

    // Fallback
    await lineClient.replyMessage({
      replyToken,
      messages: [{
        type: "text",
        text: `สวัสดีค่ะ 🙏 หมอแมค MorMac\n\nพิมพ์:\n• "แจ้งซ่อม" — แจ้งซ่อมเครื่อง\n• "เช็คสถานะ" — ดูงานซ่อมของคุณ\n• "MOR-XXXX-XXXX" — ค้นหาเลขซ่อม\n\nหรือพิมพ์บอกรุ่นและอาการได้เลยค่ะ เช่น\n"MacBook Pro จอแตก"`,
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
