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

export const maxDuration = 25;

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

async function createRepair(userId: string, deviceModel: string, deviceType: string, symptoms: string) {
  let customer = await db.users.getByLine(userId);
  if (!customer) customer = await db.users.create({ lineUserId: userId, name: "LINE User", role: "customer" });

  const shops = await db.shops.list();
  if (shops.length === 0) return null;

  const { code: repairCode } = await db.repairs.generateCode();
  await db.repairs.create({ repairCode, shopId: shops[0].id, customerId: customer.id, deviceModel, deviceType, symptoms, status: "submitted" });
  return { repairCode, trackUrl: getTrackingUrl(repairCode), deviceModel, symptoms };
}

async function handleEvent(event: any) {
  const userId: string | undefined = event.source?.userId;
  if (!userId) return;

  // Image message — forward to DB server for photo intake
  if (event.type === "message" && event.message.type === "image") {
    const dbUrl = process.env.DB_API_URL || "http://localhost:4100";
    const dbKey = process.env.DB_API_KEY || "";
    try {
      await fetch(`${dbUrl}/ai/handle`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": dbKey },
        body: JSON.stringify({ message: "__IMAGE__", userId, imageMessageId: event.message.id }),
        signal: AbortSignal.timeout(8000),
      });
    } catch { /* fire and forget */ }
    return;
  }

  if (event.type === "message" && event.message.type === "text") {
    const text = event.message.text.trim();
    const replyToken: string = event.replyToken;

    // 1. Track by repair code
    if (/^MOR-\d{4}-\d{4}$/i.test(text)) {
      const repair = await db.repairs.getByCode(text.toUpperCase());
      const trackUrl = getTrackingUrl(text.toUpperCase());
      if (!repair) {
        await lineClient.replyMessage({ replyToken, messages: [{ type: "text", text: `❌ ไม่พบเลขซ่อม ${text}` }] });
      } else {
        await lineClient.replyMessage({ replyToken, messages: [buildRepairStatusFlex(repair, trackUrl)] });
      }
      return;
    }

    // 2. Exact menu keywords
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

    // 3. AI — hand off to DB server, then return before AI work finishes.
    // Vercel may stop background work after the response, so the handoff itself
    // must be awaited. The DB server returns immediately and pushes the LINE reply.
    const dbUrl = process.env.DB_API_URL || "http://localhost:4100";
    const dbKey = process.env.DB_API_KEY || "mormac-artron-2026";
    try {
      const res = await fetch(`${dbUrl}/ai/handle`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": dbKey },
        body: JSON.stringify({ message: text, userId }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`AI handoff failed: ${res.status}`);
    } catch (error) {
      console.error("LINE AI handoff error:", error);
      await lineClient.replyMessage({
        replyToken,
        messages: [{ type: "text", text: "ขออภัยค่ะ ระบบตอบกลับอัตโนมัติขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้งนะคะ" }],
      });
    }
  }

  if (event.type === "postback") {
    const userId = event.source?.userId;
    if (!userId) return;
    const params = new URLSearchParams(event.postback.data);
    const action = params.get("action");
    const code = params.get("code");
    if (!action || !code) return;

    const repair = await db.repairs.getByCode(code);
    if (!repair || !repair.customer?.lineUserId || repair.customer.lineUserId !== userId) return;

    if (action === "confirm") {
      await db.repairs.updateStatus(repair.id, { status: "confirmed", actor: "customer" });
      await pushRepairUpdate(userId, code, "confirmed");
    }
    if (action === "cancel") {
      await db.repairs.updateStatus(repair.id, { status: "cancelled", actor: "customer" });
      await pushRepairUpdate(userId, code, "cancelled");
    }
  }
}
