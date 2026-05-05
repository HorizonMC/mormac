import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { lineConfig, lineClient, pushRepairUpdate } from "@/lib/line";
import { db } from "@/lib/db-client";
import { getTrackingUrl } from "@/lib/qr";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-line-signature");
  const hash = crypto.createHmac("SHA256", lineConfig.channelSecret).update(body).digest("base64");
  if (signature !== hash) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const { events } = JSON.parse(body);
  for (const event of events) await handleEvent(event);
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
      const repair = await db.repairs.getByCode(text);
      const trackUrl = getTrackingUrl(text);
      if (!repair) {
        await lineClient.replyMessage({ replyToken, messages: [{ type: "text", text: `❌ ไม่พบเลขซ่อม ${text}` }] });
      } else {
        await lineClient.replyMessage({ replyToken, messages: [{ type: "text", text: `📱 ${repair.deviceModel}\nเลขซ่อม: ${text}\nสถานะ: ${repair.status}\n\n🔗 ${trackUrl}` }] });
      }
      return;
    }

    if (text === "แจ้งซ่อม") {
      await lineClient.replyMessage({ replyToken, messages: [{ type: "text", text: "📱 กรุณาแจ้งข้อมูลเครื่อง:\n\nรุ่น: iPhone 15 Pro\nอาการ: จอแตก ทัชไม่ได้" }] });
      return;
    }

    if (text === "เช็คสถานะ") {
      const user = await db.users.getByLine(userId);
      if (!user) { await lineClient.replyMessage({ replyToken, messages: [{ type: "text", text: "ไม่พบรายการซ่อม\nกรุณาพิมพ์เลขซ่อม เช่น MOR-2605-0001" }] }); return; }
      const repairs = (await db.repairs.list()).filter((r: any) => r.customerId === user.id).slice(0, 5);
      if (repairs.length === 0) { await lineClient.replyMessage({ replyToken, messages: [{ type: "text", text: "ไม่พบรายการซ่อม" }] }); return; }
      const list = repairs.map((r: any) => `${r.repairCode} | ${r.deviceModel} | ${r.status}`).join("\n");
      await lineClient.replyMessage({ replyToken, messages: [{ type: "text", text: `📋 รายการซ่อมล่าสุด:\n\n${list}` }] });
      return;
    }

    if (text.includes("รุ่น:") && text.includes("อาการ:")) {
      const modelMatch = text.match(/รุ่น:\s*(.+)/);
      const symptomMatch = text.match(/อาการ:\s*(.+)/);
      if (!modelMatch || !symptomMatch) return;
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
      if (shops.length === 0) { await lineClient.replyMessage({ replyToken, messages: [{ type: "text", text: "⚠️ ระบบยังไม่พร้อม" }] }); return; }

      const { code: repairCode } = await db.repairs.generateCode();
      const trackUrl = getTrackingUrl(repairCode);

      await db.repairs.create({ repairCode, shopId: shops[0].id, customerId: customer.id, deviceModel, deviceType, symptoms, status: "submitted" });

      await lineClient.replyMessage({ replyToken, messages: [{ type: "text", text: `✅ แจ้งซ่อมสำเร็จ!\n\n📱 ${deviceModel}\n🔧 ${symptoms}\n🔢 ${repairCode}\n\n🔗 ${trackUrl}` }] });
      return;
    }
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
