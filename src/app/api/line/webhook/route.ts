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
  if (event.type === "message" && event.message.type === "text") {
    const text = event.message.text.trim();
    const userId: string | undefined = event.source?.userId;
    const replyToken: string = event.replyToken;
    if (!userId) return;

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

    // 3. AI — fire-and-forget to DB server (no Vercel timeout issue)
    const dbUrl = process.env.DB_API_URL || "http://localhost:4100";
    const dbKey = process.env.DB_API_KEY || "mormac-artron-2026";
    fetch(`${dbUrl}/ai/handle`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": dbKey },
      body: JSON.stringify({ message: text, userId }),
    }).catch(() => {});
    // Return immediately — DB server will push reply via LINE API
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
