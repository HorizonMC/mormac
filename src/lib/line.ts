import { messagingApi, webhook } from "@line/bot-sdk";

type WebhookEvent = webhook.Event;
type FlexMessage = messagingApi.FlexMessage;
type TextMessage = messagingApi.TextMessage;

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
  channelSecret: process.env.LINE_CHANNEL_SECRET || "",
};

const client = new messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken,
});

export { client as lineClient, config as lineConfig };
export type { WebhookEvent };

const B = { dark: "#0F1720", teal: "#4A7A8A", mint: "#85C1B2", accent: "#28EF33", white: "#FFFFFF" };

export function repairStatusText(status: string): string {
  const map: Record<string, string> = {
    submitted: "📝 แจ้งซ่อมแล้ว",
    received: "✅ ร้านรับเครื่องแล้ว",
    diagnosing: "🔍 กำลังตรวจอาการ",
    quoted: "💰 ประเมินราคาแล้ว",
    confirmed: "👍 ยืนยันซ่อม",
    repairing: "🔧 กำลังซ่อม",
    qc: "✅ ตรวจสอบคุณภาพ",
    done: "✨ ซ่อมเสร็จ",
    shipped: "📦 จัดส่งแล้ว",
    returned: "🏠 ลูกค้ารับคืนแล้ว",
    cancelled: "❌ ยกเลิก",
  };
  return map[status] || status;
}

function statusColor(status: string): string {
  if (["done", "shipped", "returned"].includes(status)) return "#28EF33";
  if (["repairing", "qc", "confirmed"].includes(status)) return "#3B82F6";
  if (["quoted"].includes(status)) return "#F59E0B";
  if (["cancelled"].includes(status)) return "#EF4444";
  return B.teal;
}

export function buildRepairStatusFlex(repair: any, trackUrl: string): FlexMessage {
  return {
    type: "flex",
    altText: `${repair.repairCode} — ${repairStatusText(repair.status)}`,
    contents: {
      type: "bubble",
      styles: { header: { backgroundColor: B.dark }, body: { backgroundColor: B.white }, footer: { backgroundColor: "#F8FAFB" } },
      header: {
        type: "box", layout: "vertical", paddingAll: "16px",
        contents: [
          { type: "text", text: "iPartStore Fix", color: B.mint, size: "xs" },
          { type: "text", text: repair.repairCode, color: B.white, size: "xl", weight: "bold" },
        ],
      },
      body: {
        type: "box", layout: "vertical", spacing: "md", paddingAll: "20px",
        contents: [
          {
            type: "box", layout: "horizontal", spacing: "sm",
            contents: [
              { type: "text", text: "สถานะ", size: "sm", color: "#888888", flex: 3 },
              {
                type: "box", layout: "baseline", flex: 7,
                contents: [
                  { type: "icon", url: `https://img.icons8.com/ios-filled/20/${statusColor(repair.status).replace("#", "")}/circled.png`, size: "xs" },
                  { type: "text", text: repairStatusText(repair.status), size: "sm", weight: "bold", color: statusColor(repair.status), margin: "sm" },
                ],
              },
            ],
          },
          { type: "separator", color: "#EEEEEE" },
          row("อุปกรณ์", repair.deviceModel),
          row("อาการ", repair.symptoms || "—"),
          ...(repair.quotedPrice ? [row("ราคาประเมิน", `฿${repair.quotedPrice.toLocaleString()}`)] : []),
        ],
      },
      footer: {
        type: "box", layout: "vertical", spacing: "sm", paddingAll: "16px",
        contents: [
          {
            type: "button", style: "primary", color: B.dark, height: "sm",
            action: { type: "uri", label: "🔗 ดูรายละเอียดออนไลน์", uri: trackUrl },
          },
        ],
      },
    },
  };
}

export function buildRepairListFlex(repairs: any[]): FlexMessage {
  const items = repairs.slice(0, 5).map((r: any) => ({
    type: "box" as const, layout: "horizontal" as const, spacing: "sm" as const, paddingAll: "12px",
    contents: [
      {
        type: "box" as const, layout: "vertical" as const, flex: 7,
        contents: [
          { type: "text" as const, text: r.repairCode, size: "sm" as const, weight: "bold" as const, color: B.dark },
          { type: "text" as const, text: r.deviceModel, size: "xs" as const, color: "#888888" },
        ],
      },
      {
        type: "box" as const, layout: "vertical" as const, flex: 5,
        contents: [
          { type: "text" as const, text: repairStatusText(r.status), size: "xs" as const, align: "end" as const, color: statusColor(r.status), weight: "bold" as const },
        ],
      },
    ],
  }));

  const withSeparators: any[] = [];
  items.forEach((item, i) => {
    withSeparators.push(item);
    if (i < items.length - 1) withSeparators.push({ type: "separator", color: "#F0F0F0" });
  });

  return {
    type: "flex",
    altText: `รายการซ่อม ${repairs.length} รายการ`,
    contents: {
      type: "bubble",
      styles: { header: { backgroundColor: B.dark } },
      header: {
        type: "box", layout: "vertical", paddingAll: "16px",
        contents: [
          { type: "text", text: "iPartStore Fix", color: B.mint, size: "xs" },
          { type: "text", text: "📋 รายการซ่อมล่าสุด", color: B.white, size: "lg", weight: "bold" },
        ],
      },
      body: {
        type: "box", layout: "vertical", spacing: "none", paddingAll: "4px",
        contents: withSeparators,
      },
    },
  };
}

export function buildSubmitSuccessFlex(repairCode: string, deviceModel: string, symptoms: string, trackUrl: string): FlexMessage {
  return {
    type: "flex",
    altText: `แจ้งซ่อมสำเร็จ ${repairCode}`,
    contents: {
      type: "bubble",
      styles: { header: { backgroundColor: B.dark } },
      header: {
        type: "box", layout: "vertical", paddingAll: "20px",
        contents: [
          { type: "text", text: "✅ แจ้งซ่อมสำเร็จ!", color: B.accent, size: "lg", weight: "bold" },
          { type: "text", text: repairCode, color: B.white, size: "xxl", weight: "bold", margin: "sm" },
        ],
      },
      body: {
        type: "box", layout: "vertical", spacing: "md", paddingAll: "20px",
        contents: [
          row("อุปกรณ์", deviceModel),
          row("อาการ", symptoms),
          { type: "separator", color: "#EEEEEE" },
          { type: "text", text: "เราจะตรวจเช็คและแจ้งราคาให้ทราบ", size: "xs", color: "#888888", margin: "md", wrap: true },
        ],
      },
      footer: {
        type: "box", layout: "vertical", spacing: "sm", paddingAll: "16px",
        contents: [
          {
            type: "button", style: "primary", color: B.dark, height: "sm",
            action: { type: "uri", label: "🔗 ติดตามสถานะ", uri: trackUrl },
          },
        ],
      },
    },
  };
}

export function buildReportGuide(): FlexMessage {
  return {
    type: "flex",
    altText: "วิธีแจ้งซ่อม",
    contents: {
      type: "bubble",
      styles: { header: { backgroundColor: B.dark } },
      header: {
        type: "box", layout: "vertical", paddingAll: "20px",
        contents: [
          { type: "text", text: "iPartStore Fix", color: B.mint, size: "xs" },
          { type: "text", text: "🔧 แจ้งซ่อม", color: B.white, size: "xl", weight: "bold" },
        ],
      },
      body: {
        type: "box", layout: "vertical", spacing: "lg", paddingAll: "20px",
        contents: [
          { type: "text", text: "กรุณาพิมพ์ข้อมูลตามนี้:", size: "sm", color: "#555555" },
          {
            type: "box", layout: "vertical", backgroundColor: "#F5F7F9", cornerRadius: "12px", paddingAll: "16px", spacing: "sm",
            contents: [
              { type: "text", text: "รุ่น: iPhone 15 Pro", size: "md", weight: "bold", color: B.dark },
              { type: "text", text: "อาการ: จอแตก ทัชไม่ได้", size: "md", weight: "bold", color: B.dark },
            ],
          },
          { type: "separator", color: "#EEEEEE" },
          { type: "text", text: "💡 พิมพ์ \"รุ่น:\" ตามด้วยรุ่นเครื่อง\nแล้ว \"อาการ:\" ตามด้วยปัญหา", size: "xs", color: "#999999", wrap: true },
        ],
      },
    },
  };
}

export function buildQuoteConfirmFlex(repairCode: string, price: number): FlexMessage {
  return {
    type: "flex",
    altText: `ประเมินราคาซ่อม ฿${price.toLocaleString()}`,
    contents: {
      type: "bubble",
      styles: { header: { backgroundColor: B.dark } },
      header: {
        type: "box", layout: "vertical", paddingAll: "20px",
        contents: [
          { type: "text", text: "iPartStore Fix", color: B.mint, size: "xs" },
          { type: "text", text: "💰 ประเมินราคาซ่อม", color: B.white, size: "lg", weight: "bold" },
        ],
      },
      body: {
        type: "box", layout: "vertical", spacing: "md", paddingAll: "20px",
        contents: [
          row("เลขซ่อม", repairCode),
          { type: "separator", color: "#EEEEEE" },
          { type: "text", text: `฿${price.toLocaleString()}`, size: "3xl", weight: "bold", color: B.dark, align: "center", margin: "lg" },
          { type: "text", text: "ยืนยันเพื่อเริ่มซ่อม", size: "xs", color: "#999999", align: "center" },
        ],
      },
      footer: {
        type: "box", layout: "horizontal", spacing: "sm", paddingAll: "16px",
        contents: [
          { type: "button", style: "primary", color: B.accent, action: { type: "postback", label: "✅ ยืนยันซ่อม", data: `action=confirm&code=${repairCode}` } },
          { type: "button", style: "secondary", action: { type: "postback", label: "❌ ยกเลิก", data: `action=cancel&code=${repairCode}` } },
        ],
      },
    },
  };
}

export async function pushRepairUpdate(lineUserId: string, repairCode: string, status: string, extra?: string): Promise<void> {
  const statusText = repairStatusText(status);
  const message: FlexMessage = {
    type: "flex",
    altText: `${statusText} — ${repairCode}`,
    contents: {
      type: "bubble",
      styles: { header: { backgroundColor: B.dark } },
      header: {
        type: "box", layout: "vertical", paddingAll: "16px",
        contents: [
          { type: "text", text: "iPartStore Fix", color: B.mint, size: "xs" },
          { type: "text", text: "อัพเดทสถานะ", color: B.white, size: "md", weight: "bold" },
        ],
      },
      body: {
        type: "box", layout: "vertical", spacing: "md", paddingAll: "20px",
        contents: [
          { type: "text", text: statusText, size: "lg", weight: "bold", color: statusColor(status) },
          row("เลขซ่อม", repairCode),
          ...(extra ? [{ type: "text" as const, text: extra, size: "sm" as const, color: "#666666" as const, wrap: true as const, margin: "md" as const }] : []),
        ],
      },
      footer: {
        type: "box", layout: "vertical", paddingAll: "16px",
        contents: [
          {
            type: "button", style: "primary", color: B.dark, height: "sm",
            action: { type: "uri", label: "ดูรายละเอียด", uri: `https://mormac.vercel.app/track/${repairCode}` },
          },
        ],
      },
    },
  };
  await client.pushMessage({ to: lineUserId, messages: [message] });
}

function row(label: string, value: string): any {
  return {
    type: "box", layout: "horizontal",
    contents: [
      { type: "text", text: label, size: "sm", color: "#888888", flex: 3 },
      { type: "text", text: value, size: "sm", weight: "bold", color: B.dark, flex: 7, wrap: true },
    ],
  };
}
