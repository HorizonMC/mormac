import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  lineConfig, lineClient,
  buildRepairStatusFlex, buildRepairListFlex,
  buildReportGuide,
  pushRepairUpdate,
} from "@/lib/line";
import { db, type DbRepair } from "@/lib/db-client";
import { getTrackingUrl } from "@/lib/qr";

export const maxDuration = 25;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-line-signature");

  // LINE verify request — empty body or empty events
  if (!body || body === '{}' || body === '{"events":[]}') {
    return NextResponse.json({ ok: true });
  }

  if (!lineConfig.channelSecret) return NextResponse.json({ error: "Channel secret not configured" }, { status: 500 });
  const hash = crypto.createHmac("SHA256", lineConfig.channelSecret).update(body).digest("base64");
  if (signature !== hash) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const { events } = JSON.parse(body);
  if (!events?.length) return NextResponse.json({ ok: true });
  for (const event of events) await handleEvent(event);
  return NextResponse.json({ ok: true });
}

type LineWebhookEvent = {
  type: string;
  replyToken?: string;
  source?: { userId?: string };
  message?: { type: string; text?: string; id?: string };
  postback?: { data: string };
};

type AiHandleResponse = {
  ok: boolean;
  reply?: string;
  flex?: Parameters<typeof lineClient.replyMessage>[0]["messages"][number];
};

async function handleEvent(event: LineWebhookEvent) {
  const userId: string | undefined = event.source?.userId;
  if (!userId) return;

  // Image message — forward to DB server, reply with result
  if (event.type === "message" && event.message?.type === "image" && event.replyToken && event.message.id) {
    const dbUrl = process.env.DB_API_URL || "http://localhost:4100";
    const dbKey = process.env.DB_API_KEY || "mormac-artron-2026";
    const replyToken = event.replyToken;
    try {
      const res = await fetch(`${dbUrl}/ai/handle`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": dbKey },
        body: JSON.stringify({ message: "__IMAGE__", userId, imageMessageId: event.message.id, replyToken }),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`Image handoff failed: ${res.status}`);
      const data = await res.json() as AiHandleResponse;
      if (data.reply) {
        await lineClient.replyMessage({ replyToken, messages: [{ type: "text", text: data.reply }] });
      }
    } catch (error) {
      console.error("LINE image handoff error:", error);
      try {
        await lineClient.replyMessage({ replyToken, messages: [{ type: "text", text: "ได้รับรูปแล้วค่ะ กรุณารอสักครู่นะคะ" }] });
      } catch { /* replyToken may have expired */ }
    }
    return;
  }

  if (event.type === "message" && event.message?.type === "text" && event.replyToken && event.message.text) {
    const text = event.message.text.trim();
    const replyToken = event.replyToken;

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
      const repairs = (await db.repairs.list()).filter((repair: DbRepair) => repair.customerId === user.id).slice(0, 5);
      if (repairs.length === 0) {
        await lineClient.replyMessage({ replyToken, messages: [{ type: "text", text: "ไม่พบรายการซ่อม" }] });
        return;
      }
      await lineClient.replyMessage({ replyToken, messages: [buildRepairListFlex(repairs)] });
      return;
    }

    // 3. AI — hand off to DB server, get reply text, then reply via replyToken (no push quota needed)
    const dbUrl = process.env.DB_API_URL || "http://localhost:4100";
    const dbKey = process.env.DB_API_KEY || "mormac-artron-2026";
    try {
      const res = await fetch(`${dbUrl}/ai/handle`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": dbKey },
        body: JSON.stringify({ message: text, userId, replyToken }),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`AI handoff failed: ${res.status}`);
      const data = await res.json() as AiHandleResponse;
      if (data.reply) {
        await lineClient.replyMessage({ replyToken, messages: [{ type: "text", text: data.reply }] });
      } else if (data.flex) {
        await lineClient.replyMessage({ replyToken, messages: [data.flex] });
      }
    } catch (error) {
      console.error("LINE AI handoff error:", error);
      try {
        await lineClient.replyMessage({
          replyToken,
          messages: [{ type: "text", text: "ขออภัยค่ะ ระบบตอบกลับอัตโนมัติขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้งนะคะ" }],
        });
      } catch { /* replyToken may have expired */ }
    }
  }

  if (event.type === "postback") {
    const userId = event.source?.userId;
    if (!userId) return;
    if (!event.postback) return;
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
