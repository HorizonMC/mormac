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

export async function pushRepairUpdate(
  lineUserId: string,
  repairCode: string,
  status: string,
  extra?: string
): Promise<void> {
  const statusText = repairStatusText(status);
  const message: TextMessage = {
    type: "text",
    text: `${statusText}\n\nเลขซ่อม: ${repairCode}${extra ? `\n${extra}` : ""}`,
  };

  await client.pushMessage({ to: lineUserId, messages: [message] });
}

export function buildQuoteConfirmFlex(
  repairCode: string,
  price: number
): FlexMessage {
  return {
    type: "flex",
    altText: `ประเมินราคาซ่อม ฿${price.toLocaleString()}`,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "💰 ประเมินราคาซ่อม", weight: "bold", size: "lg" },
          { type: "text", text: `เลขซ่อม: ${repairCode}`, size: "sm", color: "#666666", margin: "md" },
          { type: "text", text: `ราคา: ฿${price.toLocaleString()}`, size: "xl", weight: "bold", margin: "lg" },
        ],
      },
      footer: {
        type: "box",
        layout: "horizontal",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            action: { type: "postback", label: "✅ ยืนยันซ่อม", data: `action=confirm&code=${repairCode}` },
          },
          {
            type: "button",
            style: "secondary",
            action: { type: "postback", label: "❌ ยกเลิก", data: `action=cancel&code=${repairCode}` },
          },
        ],
      },
    },
  };
}
