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

function detectDeviceType(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("iphone") || lower.includes("ไอโฟน")) return "iphone";
  if (lower.includes("macbook") || lower.includes("แมคบุ๊ค") || lower.includes("mac book")) return "macbook";
  if (lower.includes("imac") || lower.includes("ไอแมค")) return "imac";
  if (lower.includes("ipad") || lower.includes("ไอแพด")) return "ipad";
  if (lower.includes("watch") || lower.includes("วอช")) return "watch";
  if (lower.includes("airpods") || lower.includes("แอร์พอด")) return "airpods";
  if (lower.includes("mac") || lower.includes("แมค")) return "macbook";
  return "other";
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
        await lineClient.replyMessage({ replyToken, messages: [{ type: "text", text: `❌ ไม่พบเลขซ่อม ${text}\n\nกรุณาตรวจสอบเลขซ่อมอีกครั้ง` }] });
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

    // 3. Fast regex — "รุ่น:" format
    const modelMatch = text.match(/รุ่น\s*[:：]\s*(.+)/m);
    const symptomMatch = text.match(/อาการ\s*[:：]\s*(.+)/m);
    if (modelMatch && symptomMatch) {
      const deviceModel = modelMatch[1].trim();
      const symptoms = symptomMatch[1].trim();
      const result = await createRepair(userId, deviceModel, detectDeviceType(deviceModel), symptoms);
      if (!result) {
        await lineClient.replyMessage({ replyToken, messages: [{ type: "text", text: "⚠️ ระบบยังไม่พร้อม กรุณาติดต่อร้านโดยตรง" }] });
        return;
      }
      await lineClient.replyMessage({ replyToken, messages: [buildSubmitSuccessFlex(result.repairCode, result.deviceModel, result.symptoms, result.trackUrl)] });
      return;
    }

    // 4. Smart regex — detect device + symptom keywords in natural text
    const deviceType = detectDeviceType(text);
    const symptomKeywords = ["จอแตก", "จอร้าว", "จอดำ", "จอค้าง", "เปิดไม่ติด", "เปิดไม่ได้", "ชาร์จไม่เข้า", "แบตบวม", "แบตหมดเร็ว", "แบตเสื่อม", "ลำโพงไม่ดัง", "ไม่มีเสียง", "กล้องเสีย", "ค้าง", "ร้อน", "ช้า", "ร่วง", "ตก", "น้ำเข้า", "เปียก", "Face ID", "Touch ID", "ปุ่มเสีย", "คีย์บอร์ดเสีย", "trackpad", "wifi", "บลูทูธ"];
    const foundSymptoms = symptomKeywords.filter(kw => text.includes(kw));

    if (deviceType !== "other" && foundSymptoms.length > 0) {
      const deviceNames: Record<string, string[]> = {
        iphone: ["iPhone\\s*\\d+\\s*(Pro\\s*Max|Pro|Plus|mini)?", "ไอโฟน\\s*\\d+"],
        macbook: ["MacBook\\s*(Pro|Air)?\\s*\\d*\\s*\"?", "Mac\\s*Book\\s*(Pro|Air)?", "แมคบุ๊ค\\s*(โปร|แอร์)?"],
        ipad: ["iPad\\s*(Pro|Air|mini)?\\s*\\d*", "ไอแพด"],
        imac: ["iMac\\s*\\d*", "ไอแมค"],
        watch: ["Apple\\s*Watch\\s*(Ultra|SE)?\\s*\\d*"],
        airpods: ["AirPods\\s*(Pro|Max)?\\s*\\d*"],
      };
      let deviceModel = deviceType;
      for (const pattern of (deviceNames[deviceType] || [])) {
        const m = text.match(new RegExp(pattern, "i"));
        if (m) { deviceModel = m[0].trim(); break; }
      }
      const extraSpecs = text.match(/(\d+\s*GB|\d+\s*TB|ram\s*\d+|แรม\s*\d+|\d+\s*นิ้ว|\d+\s*inch)/gi);
      if (extraSpecs) deviceModel += ` (${extraSpecs.join(", ")})`;
      const symptoms = foundSymptoms.join(", ");

      const result = await createRepair(userId, deviceModel, deviceType, symptoms);
      if (!result) {
        await lineClient.replyMessage({ replyToken, messages: [{ type: "text", text: "⚠️ ระบบยังไม่พร้อม กรุณาติดต่อร้านโดยตรง" }] });
        return;
      }
      await lineClient.replyMessage({ replyToken, messages: [buildSubmitSuccessFlex(result.repairCode, result.deviceModel, result.symptoms, result.trackUrl)] });
      return;
    }

    // 5. AI fallback — local LLM (non-blocking, with timeout)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const aiRes = await fetch(`${process.env.DB_API_URL || "http://localhost:4100"}/ai/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": process.env.DB_API_KEY || "mormac-artron-2026" },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (aiRes.ok) {
        const ai = await aiRes.json();

        if (ai.intent === "repair" && ai.device && ai.symptoms) {
          const result = await createRepair(userId, ai.specs ? `${ai.device} (${ai.specs})` : ai.device, ai.type || "other", ai.symptoms);
          if (result) {
            await lineClient.replyMessage({ replyToken, messages: [buildSubmitSuccessFlex(result.repairCode, result.deviceModel, result.symptoms, result.trackUrl)] });
            return;
          }
        }

        if (ai.reply) {
          await lineClient.replyMessage({ replyToken, messages: [{ type: "text", text: ai.reply }] });
          return;
        }
      }
    } catch {
      // AI timeout or error — fall through
    }

    // 6. Default help
    await lineClient.replyMessage({
      replyToken,
      messages: [{
        type: "text",
        text: `สวัสดีค่ะ 🙏 หมอแมค MorMac\n\nบอกรุ่นเครื่องและอาการได้เลยค่ะ เช่น\n"iPhone 15 Pro จอแตก"\n"MacBook Pro ชาร์จไม่เข้า"\n\nหรือพิมพ์:\n• "เช็คสถานะ" — ดูงานซ่อม\n• "MOR-XXXX-XXXX" — ค้นหาเลขซ่อม`,
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
