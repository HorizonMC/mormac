import { Hono } from "hono";
import { cors } from "hono/cors";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client";
import path from "path";
import { mkdir } from "fs/promises";

const dbPath = path.resolve(import.meta.dir, "../dev.db");
const uploadsDir = path.resolve(import.meta.dir, "../public/uploads");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

const API_KEY = process.env.DB_API_KEY || "mormac-secret-key-change-me";

const app = new Hono();

app.use("*", cors());

app.use("*", async (c, next) => {
  if (c.req.path.startsWith("/uploads/")) {
    await next();
    return;
  }
  const key = c.req.header("x-api-key");
  if (key !== API_KEY) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
});

// Health
app.get("/health", (c) => c.json({ ok: true, db: dbPath }));

app.get("/uploads/:filename", async (c) => {
  const filename = c.req.param("filename");
  if (filename !== path.basename(filename)) {
    return c.json({ error: "Invalid filename" }, 400);
  }

  const file = Bun.file(path.join(uploadsDir, filename));
  if (!(await file.exists())) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.body(await file.arrayBuffer(), 200, {
    "Content-Type": file.type || "application/octet-stream",
    "Cache-Control": "public, max-age=31536000, immutable",
  });
});

// ===== Repairs =====
app.get("/repairs", async (c) => {
  const status = c.req.query("status");
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  const repairs = await prisma.repair.findMany({
    where,
    include: { customer: true, tech: { include: { user: true } }, timeline: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return c.json(repairs);
});

app.get("/repairs/:id", async (c) => {
  const repair = await prisma.repair.findUnique({
    where: { id: c.req.param("id") },
    include: {
      customer: true, shop: true,
      tech: { include: { user: true } },
      timeline: { orderBy: { createdAt: "desc" } },
      partsUsed: { include: { part: true } },
    },
  });
  return repair ? c.json(repair) : c.json({ error: "Not found" }, 404);
});

app.post("/repairs/:id/photos", async (c) => {
  const id = c.req.param("id");
  const repair = await prisma.repair.findUnique({ where: { id }, select: { id: true, photos: true } });
  if (!repair) return c.json({ error: "Not found" }, 404);

  const formData = await c.req.formData();
  const upload = formData.get("photo") || formData.get("file") || formData.get("image");
  if (!(upload instanceof File)) {
    return c.json({ error: "Missing image file" }, 400);
  }
  if (!upload.type.startsWith("image/")) {
    return c.json({ error: "File must be an image" }, 400);
  }

  const ext = imageExtension(upload);
  const safeRepairId = id.replace(/[^a-zA-Z0-9_-]/g, "");
  const filename = `${safeRepairId}_${Date.now()}${ext}`;
  const publicPath = `/uploads/${filename}`;

  await mkdir(uploadsDir, { recursive: true });
  await Bun.write(path.join(uploadsDir, filename), upload);

  const existingPhotos = parseJsonObject<unknown>(repair.photos);
  const photos = Array.isArray(existingPhotos) ? existingPhotos.filter((item): item is string => typeof item === "string") : [];
  photos.push(publicPath);

  const updatedRepair = await prisma.repair.update({
    where: { id },
    data: { photos: JSON.stringify(photos) },
    include: {
      customer: true, shop: true,
      tech: { include: { user: true } },
      timeline: { orderBy: { createdAt: "desc" } },
      partsUsed: { include: { part: true } },
    },
  });

  return c.json({ ok: true, path: publicPath, photos, repair: updatedRepair }, 201);
});

app.get("/repairs/code/:code", async (c) => {
  const repair = await prisma.repair.findUnique({
    where: { repairCode: c.req.param("code") },
    include: { customer: true, timeline: { orderBy: { createdAt: "asc" } }, shop: true },
  });
  return repair ? c.json(repair) : c.json({ error: "Not found" }, 404);
});

app.post("/repairs", async (c) => {
  const body = await c.req.json();
  const repair = await prisma.repair.create({ data: body });
  await prisma.repairEvent.create({ data: { repairId: repair.id, status: "submitted", actor: "system" } });
  return c.json(repair, 201);
});

app.patch("/repairs/:id/status", async (c) => {
  const id = c.req.param("id");
  const { status, note, quotedPrice, laborCost, actor } = await c.req.json();
  const updateData: Record<string, unknown> = {};
  if (status) updateData.status = status;
  if (quotedPrice !== undefined) updateData.quotedPrice = quotedPrice;
  if (laborCost !== undefined) updateData.laborCost = laborCost;
  if (status === "done") updateData.completedAt = new Date();
  await prisma.repair.update({ where: { id }, data: updateData });
  if (status) await prisma.repairEvent.create({ data: { repairId: id, status, note, actor } });
  const repair = await prisma.repair.findUnique({ where: { id }, include: { customer: true } });
  if (status && status !== "pending_customer_name" && repair?.customer?.lineUserId) {
    try {
      await pushRepairStatusNotification(repair.customer.lineUserId, repair);
    } catch (error) {
      console.error("LINE status push error:", error);
    }
  }
  return c.json(repair);
});

app.post("/repairs/:id/parts", async (c) => {
  const id = c.req.param("id");
  const { partId, quantity, cost } = await c.req.json();
  const [repairPart] = await prisma.$transaction([
    prisma.repairPart.create({ data: { repairId: id, partId, quantity, cost } }),
    prisma.part.update({ where: { id: partId }, data: { quantity: { decrement: quantity } } }),
    prisma.repair.update({ where: { id }, data: { partsCost: { increment: cost } } }),
  ]);
  return c.json(repairPart, 201);
});

// ===== Users / Customers =====
app.get("/users", async (c) => {
  const role = c.req.query("role");
  const lineUserId = c.req.query("lineUserId");
  const where: Record<string, unknown> = {};
  if (role) where.role = role;
  if (lineUserId) where.lineUserId = lineUserId;
  const users = await prisma.user.findMany({
    where,
    include: { repairs: { select: { id: true, status: true } } },
    orderBy: { createdAt: "desc" },
  });
  return c.json(users);
});

app.post("/users", async (c) => {
  const body = await c.req.json();
  const user = await prisma.user.create({ data: body });
  return c.json(user, 201);
});

app.get("/users/line/:lineUserId", async (c) => {
  const user = await prisma.user.findUnique({ where: { lineUserId: c.req.param("lineUserId") } });
  return user ? c.json(user) : c.json(null);
});

// ===== Parts =====
app.get("/parts", async (c) => {
  const parts = await prisma.part.findMany({ orderBy: { name: "asc" } });
  return c.json(parts);
});

app.post("/parts", async (c) => {
  const body = await c.req.json();
  return c.json(await prisma.part.create({ data: body }), 201);
});

app.patch("/parts/:id", async (c) => {
  const { id } = c.req.param() as { id: string };
  const body = await c.req.json();
  return c.json(await prisma.part.update({ where: { id }, data: body }));
});

// ===== Devices =====
app.get("/devices", async (c) => {
  const devices = await prisma.device.findMany({ include: { shop: true }, orderBy: { createdAt: "desc" } });
  return c.json(devices);
});

app.post("/devices", async (c) => {
  const body = await c.req.json();
  return c.json(await prisma.device.create({ data: body }), 201);
});

app.patch("/devices/:id", async (c) => {
  const body = await c.req.json();
  return c.json(await prisma.device.update({ where: { id: c.req.param("id") }, data: body }));
});

// ===== Shops =====
app.get("/shops", async (c) => {
  const shops = await prisma.shop.findMany();
  return c.json(shops);
});

// ===== Config =====
app.get("/config", async (c) => {
  const rows = await prisma.config.findMany({ where: { key: { startsWith: "brand." } } });
  return c.json(rows);
});

app.put("/config", async (c) => {
  const entries: { key: string; value: string }[] = await c.req.json();
  for (const { key, value } of entries) {
    await prisma.config.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
  return c.json({ ok: true });
});

// ===== Stats =====
app.get("/stats", async (c) => {
  const [totalRepairs, activeRepairs, completedRepairs, totalDevices, readyDevices] = await Promise.all([
    prisma.repair.count(),
    prisma.repair.count({ where: { status: { notIn: ["returned", "cancelled"] } } }),
    prisma.repair.count({ where: { status: "returned" } }),
    prisma.device.count(),
    prisma.device.count({ where: { status: "ready" } }),
  ]);
  const lowStockParts = await prisma.part.findMany({ where: { quantity: { lte: 3 } }, orderBy: { quantity: "asc" }, take: 10 });
  const recentRepairs = await prisma.repair.findMany({ include: { customer: true }, orderBy: { createdAt: "desc" }, take: 10 });
  return c.json({ totalRepairs, activeRepairs, completedRepairs, totalDevices, readyDevices, lowStockParts, recentRepairs });
});

// ===== AI =====
const SYSTEM_PROMPT = await Bun.file(path.resolve(import.meta.dir, "../ai/repair-assistant.md")).text();
const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
const BRAND = { dark: "#0F1720", accent: "#28EF33", mint: "#85C1B2", white: "#FFFFFF" };

type RepairDraftMeta = {
  kind: "repairDraft";
  deviceModel: string;
  deviceType: string;
  symptoms: string;
  specs?: string;
  fullName?: string;
  phone?: string;
  returnAddress?: string;
  step?: "name" | "phone" | "address" | "specs";
};

function parseJsonObject<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function imageExtension(file: File) {
  const byType: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/heic": ".heic",
    "image/heif": ".heif",
    "image/avif": ".avif",
  };
  const extFromName = path.extname(file.name).toLowerCase().replace(/[^a-z0-9.]/g, "");
  return byType[file.type] || extFromName || ".jpg";
}

function extractThaiFullName(message: string): string | null {
  const text = message.trim().replace(/\s+/g, " ");
  const match = text.match(/^(?:ชื่อ|ผมชื่อ|ฉันชื่อ|ลูกค้าชื่อ)\s*[:：]?\s*(.+)$/i);
  const name = (match?.[1] || text).trim();
  if (name.length < 4 || name.length > 80) return null;
  if (!/\s/.test(name)) return null;
  if (/[0-9]|@|https?:\/\//i.test(name)) return null;
  return name;
}

function extractPhone(message: string): string | null {
  const digits = message.replace(/\D/g, "");
  if (!/^0\d{8,9}$/.test(digits)) return null;
  return digits;
}

function extractReturnAddress(message: string): string | null {
  const address = message.trim().replace(/\s+/g, " ");
  if (address.length < 15 || address.length > 500) return null;
  if (!/(ถ\.|ถนน|ซ\.|ซอย|ม\.|หมู่|ตำบล|ต\.|แขวง|อำเภอ|อ\.|เขต|จังหวัด|จ\.|กรุงเทพ|กทม|ไปรษณีย์|\d{5})/i.test(address)) return null;
  return address;
}

function wantsToSkipSpecs(message: string) {
  return /^(ข้าม|ไม่ทราบ|ไม่รู้|ดูไม่เป็น|skip)$/i.test(message.trim());
}

function needsMacSpecs(draft: RepairDraftMeta) {
  return ["macbook", "imac", "mac"].includes(draft.deviceType.toLowerCase()) && !draft.specs;
}

function macSpecsHelpText() {
  return [
    "ขอรายละเอียด RAM และพื้นที่เก็บข้อมูลของ Mac เพิ่มเติมค่ะ เช่น RAM 16GB / SSD 512GB",
    "",
    "วิธีดูจากเครื่อง Mac:",
    "1. กดเมนู Apple  มุมซ้ายบน",
    "2. เลือก About This Mac / เกี่ยวกับ Mac เครื่องนี้",
    "3. ดู Memory หรือ RAM",
    "4. กด More Info หรือ Storage เพื่อดู SSD/พื้นที่เก็บข้อมูล",
    "",
    "ถ้าดูไม่เป็น พิมพ์ว่า “ข้าม” ได้ค่ะ",
  ].join("\n");
}

function buildShippingCoverUrl(repairCode: string) {
  return `https://mormac.vercel.app/api/repairs/cover?code=${encodeURIComponent(repairCode)}`;
}

function buildTrackingUrl(repairCode: string) {
  return `https://mormac.vercel.app/track/${encodeURIComponent(repairCode)}`;
}

function repairStatusText(status: string): string {
  const map: Record<string, string> = {
    submitted: "แจ้งซ่อมแล้ว",
    received: "ร้านรับเครื่องแล้ว",
    diagnosing: "กำลังตรวจอาการ",
    quoted: "ประเมินราคาแล้ว",
    confirmed: "ยืนยันซ่อม",
    repairing: "กำลังซ่อม",
    qc: "ตรวจสอบคุณภาพ",
    done: "ซ่อมเสร็จ",
    shipped: "จัดส่งแล้ว",
    returned: "ลูกค้ารับคืนแล้ว",
    cancelled: "ยกเลิก",
    pending_customer_info: "รอข้อมูลลูกค้า",
  };
  return map[status] || status;
}

function repairStatusColor(status: string): string {
  if (["done", "shipped", "returned"].includes(status)) return BRAND.accent;
  if (["repairing", "qc", "confirmed"].includes(status)) return "#3B82F6";
  if (status === "quoted") return "#F59E0B";
  if (status === "cancelled") return "#EF4444";
  return "#4A7A8A";
}

function flexRow(label: string, value: string) {
  return {
    type: "box",
    layout: "horizontal",
    contents: [
      { type: "text", text: label, size: "sm", color: "#888888", flex: 3 },
      { type: "text", text: value, size: "sm", weight: "bold", color: BRAND.dark, flex: 7, wrap: true },
    ],
  };
}

function priceText(price: number | null | undefined) {
  return typeof price === "number" ? `฿${price.toLocaleString("th-TH")}` : "รอดูรายละเอียด";
}

function buildRepairStatusFlex(repair: {
  repairCode: string;
  status: string;
  deviceModel: string;
  symptoms: string;
  quotedPrice?: number | null;
}) {
  const statusText = repairStatusText(repair.status);
  const statusColor = repairStatusColor(repair.status);
  const trackUrl = buildTrackingUrl(repair.repairCode);

  return {
    type: "flex",
    altText: `${statusText} - ${repair.repairCode}`,
    contents: {
      type: "bubble",
      styles: {
        header: { backgroundColor: BRAND.dark },
        body: { backgroundColor: BRAND.white },
        footer: { backgroundColor: "#F8FAFB" },
      },
      header: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        contents: [
          { type: "text", text: "หมอแมค MorMac", color: BRAND.mint, size: "xs" },
          { type: "text", text: "อัปเดตสถานะซ่อม", color: BRAND.white, size: "lg", weight: "bold", margin: "xs" },
          { type: "text", text: repair.repairCode, color: BRAND.accent, size: "xl", weight: "bold", margin: "sm" },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "20px",
        contents: [
          { type: "text", text: statusText, size: "lg", weight: "bold", color: statusColor, wrap: true },
          { type: "separator", color: "#EEEEEE" },
          flexRow("อุปกรณ์", repair.deviceModel),
          flexRow("อาการ", repair.symptoms || "-"),
          ...(repair.quotedPrice ? [flexRow("ราคาประเมิน", priceText(repair.quotedPrice))] : []),
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        paddingAll: "16px",
        contents: [
          {
            type: "button",
            style: "primary",
            color: BRAND.dark,
            height: "sm",
            action: { type: "uri", label: "ดูรายละเอียด", uri: trackUrl },
          },
        ],
      },
    },
  };
}

function buildQuoteConfirmFlex(repair: {
  repairCode: string;
  deviceModel: string;
  symptoms: string;
  quotedPrice?: number | null;
}) {
  const trackUrl = buildTrackingUrl(repair.repairCode);

  return {
    type: "flex",
    altText: `ประเมินราคาซ่อม ${repair.repairCode}`,
    contents: {
      type: "bubble",
      styles: {
        header: { backgroundColor: BRAND.dark },
        body: { backgroundColor: BRAND.white },
        footer: { backgroundColor: "#F8FAFB" },
      },
      header: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        contents: [
          { type: "text", text: "หมอแมค MorMac", color: BRAND.mint, size: "xs" },
          { type: "text", text: "ประเมินราคาซ่อม", color: BRAND.white, size: "lg", weight: "bold", margin: "xs" },
          { type: "text", text: repair.repairCode, color: BRAND.accent, size: "xl", weight: "bold", margin: "sm" },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "20px",
        contents: [
          flexRow("อุปกรณ์", repair.deviceModel),
          flexRow("อาการ", repair.symptoms || "-"),
          { type: "separator", color: "#EEEEEE" },
          { type: "text", text: priceText(repair.quotedPrice), size: "3xl", weight: "bold", color: BRAND.dark, align: "center", margin: "lg" },
          { type: "text", text: "กรุณายืนยันหรือยกเลิกงานซ่อม", size: "xs", color: "#888888", align: "center", wrap: true },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        paddingAll: "16px",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              { type: "button", style: "primary", color: BRAND.accent, action: { type: "postback", label: "ยืนยัน", data: `action=confirm&code=${repair.repairCode}` } },
              { type: "button", style: "secondary", action: { type: "postback", label: "ยกเลิก", data: `action=cancel&code=${repair.repairCode}` } },
            ],
          },
          {
            type: "button",
            style: "primary",
            color: BRAND.dark,
            height: "sm",
            action: { type: "uri", label: "ดูรายละเอียด", uri: trackUrl },
          },
        ],
      },
    },
  };
}

async function nextRepairCode() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `MOR-${yy}${mm}`;
  const last = await prisma.repair.findFirst({ where: { repairCode: { startsWith: prefix } }, orderBy: { repairCode: "desc" } });
  let seq = 1;
  if (last) seq = parseInt(last.repairCode.split("-")[2], 10) + 1;
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

async function pushRepairCreated(userId: string, repairCode: string, fullName: string, draft: RepairDraftMeta) {
  const trackUrl = `https://mormac.vercel.app/track/${repairCode}`;
  await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: { Authorization: `Bearer ${LINE_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      to: userId,
      messages: [{
        type: "flex", altText: `แจ้งซ่อมสำเร็จ ${repairCode}`,
        contents: {
          type: "bubble",
          styles: { header: { backgroundColor: "#0F1720" } },
          header: { type: "box", layout: "vertical", paddingAll: "20px", contents: [
            { type: "text", text: "✅ แจ้งซ่อมสำเร็จ!", color: "#28EF33", size: "lg", weight: "bold" },
            { type: "text", text: repairCode, color: "#FFFFFF", size: "xxl", weight: "bold", margin: "sm" },
          ]},
          body: { type: "box", layout: "vertical", spacing: "md", paddingAll: "20px", contents: [
            { type: "box", layout: "horizontal", contents: [
              { type: "text", text: "ลูกค้า", size: "sm", color: "#888888", flex: 3 },
              { type: "text", text: fullName, size: "sm", weight: "bold", color: "#0F1720", flex: 7, wrap: true },
            ]},
            { type: "box", layout: "horizontal", contents: [
              { type: "text", text: "อุปกรณ์", size: "sm", color: "#888888", flex: 3 },
              { type: "text", text: draft.deviceModel, size: "sm", weight: "bold", color: "#0F1720", flex: 7, wrap: true },
            ]},
            { type: "box", layout: "horizontal", contents: [
              { type: "text", text: "อาการ", size: "sm", color: "#888888", flex: 3 },
              { type: "text", text: draft.symptoms, size: "sm", weight: "bold", color: "#0F1720", flex: 7, wrap: true },
            ]},
            { type: "separator", color: "#EEEEEE" },
            { type: "text", text: "เปิดหน้าติดตามเพื่อพิมพ์ใบปะหน้าซองหรือกล่องส่งเครื่องได้ค่ะ", size: "xs", color: "#888888", margin: "md", wrap: true },
          ]},
          footer: { type: "box", layout: "vertical", spacing: "sm", paddingAll: "16px", contents: [
            { type: "button", style: "primary", color: "#0F1720", height: "sm", action: { type: "uri", label: "🔗 ติดตามสถานะ", uri: trackUrl } },
            { type: "button", style: "secondary", height: "sm", action: { type: "uri", label: "🧾 ใบปะหน้าส่งเครื่อง", uri: buildShippingCoverUrl(repairCode) } },
          ]},
        },
      }],
    }),
  });
}

async function aiParse(message: string) {
  const res = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gemma3:4b",
      prompt: `ข้อความจากลูกค้า: "${message}"`,
      system: SYSTEM_PROMPT,
      stream: false,
      keep_alive: "30m",
      options: { temperature: 0.1, num_predict: 300 },
    }),
  });
  const data = await res.json() as { response: string };
  const jsonMatch = data.response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { intent: "chat" as const, reply: data.response };
  return JSON.parse(jsonMatch[0]);
}

async function linePush(userId: string, text: string) {
  await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: { Authorization: `Bearer ${LINE_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ to: userId, messages: [{ type: "text", text }] }),
  });
}

async function linePushFlex(userId: string, message: Record<string, unknown>) {
  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: { Authorization: `Bearer ${LINE_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ to: userId, messages: [message] }),
  });
  if (!res.ok) throw new Error(`LINE push failed: ${res.status} ${await res.text()}`);
}

async function pushRepairStatusNotification(userId: string, repair: {
  repairCode: string;
  status: string;
  deviceModel: string;
  symptoms: string;
  quotedPrice?: number | null;
}) {
  const message = repair.status === "quoted"
    ? buildQuoteConfirmFlex(repair)
    : buildRepairStatusFlex(repair);
  await linePushFlex(userId, message);
}

app.post("/ai/parse", async (c) => {
  const { message } = await c.req.json();
  if (!message) return c.json({ error: "Missing message" }, 400);
  try {
    return c.json(await aiParse(message));
  } catch {
    return c.json({ intent: "chat", reply: "ขออภัยค่ะ ระบบขัดข้อง กรุณาลองใหม่" });
  }
});

// Async AI handler — Vercel fires and forgets, DB server does AI + LINE reply
app.post("/ai/handle", async (c) => {
  const { message, userId } = await c.req.json();
  if (!message || !userId) return c.json({ error: "Missing fields" }, 400);

  // Return 200 immediately, process in background
  const task = (async () => {
    try {
      let customer = await prisma.user.findUnique({ where: { lineUserId: userId } });
      const pendingRepair = await prisma.repair.findFirst({
        where: { customer: { lineUserId: userId }, status: { in: ["pending_customer_name", "pending_customer_info"] } },
        include: { customer: true },
        orderBy: { createdAt: "desc" },
      });

      if (pendingRepair) {
        const draft = parseJsonObject<RepairDraftMeta>(pendingRepair.photos);
        if (!draft || draft.kind !== "repairDraft") {
          await prisma.repair.update({
            where: { id: pendingRepair.id },
            data: { status: "cancelled", photos: null },
          });
          await linePush(userId, "ข้อมูลแจ้งซ่อมเดิมไม่สมบูรณ์ กรุณาแจ้งรุ่นเครื่องและอาการอีกครั้งนะคะ");
          return;
        }

        const step = draft.step || "name";
        if (step === "name") {
          const fullName = extractThaiFullName(message);
          if (!fullName) {
            await linePush(userId, "ขอชื่อจริงและนามสกุลสำหรับทำใบปะหน้าส่งไปรษณีย์ด้วยค่ะ\nเช่น สมชาย ใจดี");
            return;
          }
          draft.fullName = fullName;
          draft.step = "phone";
          await prisma.$transaction([
            prisma.user.update({ where: { id: pendingRepair.customerId }, data: { name: fullName } }),
            prisma.repair.update({ where: { id: pendingRepair.id }, data: { status: "pending_customer_info", photos: JSON.stringify(draft) } }),
          ]);
          await linePush(userId, "ขอเบอร์โทรสำหรับติดต่อและใส่ใบปะหน้าส่งกลับด้วยค่ะ\nเช่น 0812345678");
          return;
        }

        if (step === "phone") {
          const phone = extractPhone(message);
          if (!phone) {
            await linePush(userId, "เบอร์โทรไม่ถูกต้องค่ะ กรุณาส่งเป็นเบอร์มือถือ 9-10 หลัก เช่น 0812345678");
            return;
          }
          draft.phone = phone;
          draft.step = "address";
          await prisma.$transaction([
            prisma.user.update({ where: { id: pendingRepair.customerId }, data: { phone } }),
            prisma.repair.update({ where: { id: pendingRepair.id }, data: { status: "pending_customer_info", photos: JSON.stringify(draft) } }),
          ]);
          await linePush(userId, "ขอที่อยู่สำหรับส่งเครื่องกลับทางไปรษณีย์ด้วยค่ะ\nกรุณาส่ง บ้านเลขที่ / ถนนหรือซอย / แขวง-ตำบล / เขต-อำเภอ / จังหวัด / รหัสไปรษณีย์");
          return;
        }

        if (step === "address") {
          const returnAddress = extractReturnAddress(message);
          if (!returnAddress) {
            await linePush(userId, "ที่อยู่ยังไม่ครบพอสำหรับจัดส่งค่ะ กรุณาส่ง บ้านเลขที่ / ถนนหรือซอย / แขวง-ตำบล / เขต-อำเภอ / จังหวัด / รหัสไปรษณีย์");
            return;
          }
          draft.returnAddress = returnAddress;
          if (needsMacSpecs(draft)) {
            draft.step = "specs";
            await prisma.repair.update({ where: { id: pendingRepair.id }, data: { status: "pending_customer_info", photos: JSON.stringify(draft) } });
            await linePush(userId, macSpecsHelpText());
            return;
          }
        }

        if (step === "specs") {
          if (!wantsToSkipSpecs(message)) draft.specs = message.trim().slice(0, 160);
        }

        const repairCode = await nextRepairCode();
        const finalDeviceModel = draft.specs && !draft.deviceModel.includes(draft.specs)
          ? `${draft.deviceModel} (${draft.specs})`
          : draft.deviceModel;
        await prisma.$transaction([
          prisma.repair.update({
            where: { id: pendingRepair.id },
            data: {
              repairCode,
              deviceModel: finalDeviceModel,
              deviceType: draft.deviceType,
              symptoms: draft.symptoms,
              status: "submitted",
              photos: JSON.stringify({ ...draft, kind: "repairDraft", step: undefined }),
              shippingMethod: "postal_return",
            },
          }),
          prisma.repairEvent.create({ data: { repairId: pendingRepair.id, status: "submitted", actor: "system", note: "Customer intake completed" } }),
        ]);

        await pushRepairCreated(userId, repairCode, draft.fullName || pendingRepair.customer.name, { ...draft, deviceModel: finalDeviceModel });
        return;
      }

      const ai = await aiParse(message);

      if (ai.intent === "repair" && ai.device && ai.symptoms) {
        const shops = await prisma.shop.findMany({ take: 1 });
        if (shops.length === 0) { await linePush(userId, "⚠️ ระบบยังไม่พร้อม"); return; }

        const deviceModel = ai.specs ? `${ai.device} (${ai.specs})` : ai.device;
        const recentDuplicate = await prisma.repair.findFirst({
          where: {
            customer: { lineUserId: userId },
            deviceModel,
            symptoms: ai.symptoms,
            status: { notIn: ["cancelled", "returned"] },
            createdAt: { gte: new Date(Date.now() - 1000 * 60 * 30) },
          },
          orderBy: { createdAt: "desc" },
        });
        if (recentDuplicate) {
          const code = recentDuplicate.repairCode.startsWith("TMP-") ? null : recentDuplicate.repairCode;
          await linePush(
            userId,
            code
              ? `รายการนี้ถูกแจ้งไว้แล้วค่ะ เลขซ่อม ${code}\nติดตามสถานะ: https://mormac.vercel.app/track/${code}`
              : "รายการนี้อยู่ระหว่างรอชื่อจริงและนามสกุลค่ะ กรุณาส่งชื่อจริงและนามสกุล เช่น สมชาย ใจดี"
          );
          return;
        }

        if (!customer) customer = await prisma.user.create({ data: { lineUserId: userId, name: "LINE User", role: "customer" } });
        const hasFullName = customer.name !== "LINE User" && /\s/.test(customer.name.trim());
        const hasPhone = !!customer.phone;
        const draft: RepairDraftMeta = {
          kind: "repairDraft",
          deviceModel,
          deviceType: ai.type || "other",
          symptoms: ai.symptoms,
          specs: ai.specs,
          fullName: hasFullName ? customer.name : undefined,
          phone: hasPhone ? customer.phone || undefined : undefined,
          step: hasFullName ? (hasPhone ? "address" : "phone") : "name",
        };
        await prisma.repair.create({
          data: {
            repairCode: `TMP-${crypto.randomUUID()}`,
            shopId: shops[0].id,
            customerId: customer.id,
            deviceModel,
            deviceType: ai.type || "other",
            symptoms: ai.symptoms,
            status: "pending_customer_info",
            photos: JSON.stringify(draft),
          },
        });
        if (!hasFullName) {
          await linePush(userId, "รับข้อมูลเครื่องและอาการแล้วค่ะ\nขอชื่อจริงและนามสกุลสำหรับทำใบปะหน้าส่งไปรษณีย์ด้วยนะคะ\nเช่น สมชาย ใจดี");
        } else if (!hasPhone) {
          await linePush(userId, "รับข้อมูลเครื่องและอาการแล้วค่ะ\nขอเบอร์โทรสำหรับติดต่อและใส่ใบปะหน้าส่งกลับด้วยค่ะ\nเช่น 0812345678");
        } else {
          await linePush(userId, "รับข้อมูลเครื่องและอาการแล้วค่ะ\nขอที่อยู่สำหรับส่งเครื่องกลับทางไปรษณีย์ด้วยค่ะ\nกรุณาส่ง บ้านเลขที่ / ถนนหรือซอย / แขวง-ตำบล / เขต-อำเภอ / จังหวัด / รหัสไปรษณีย์");
        }
        return;
      }

      if (ai.reply) {
        await linePush(userId, ai.reply);
        return;
      }

      await linePush(userId, "สวัสดีค่ะ 🙏 หมอแมค MorMac\nบอกรุ่นเครื่องและอาการได้เลยค่ะ");
    } catch (e) {
      console.error("AI handle error:", e);
      await linePush(userId, "ขออภัยค่ะ ระบบขัดข้อง กรุณาลองใหม่อีกครั้งนะคะ");
    }
  })();

  // Don't await — return immediately
  void task;
  return c.json({ ok: true, async: true });
});

// ===== Reports =====
app.get("/reports/summary", async (c) => {
  const period = c.req.query("period") || "all";
  const now = new Date();
  let dateFilter: Date | undefined;
  if (period === "month") dateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
  else if (period === "week") { dateFilter = new Date(now); dateFilter.setDate(dateFilter.getDate() - 7); }
  else if (period === "year") dateFilter = new Date(now.getFullYear(), 0, 1);

  const where = dateFilter ? { createdAt: { gte: dateFilter } } : {};
  const doneWhere = { ...where, status: { in: ["done", "shipped", "returned"] } };

  const [totalJobs, completedJobs, cancelledJobs, repairs] = await Promise.all([
    prisma.repair.count({ where }),
    prisma.repair.count({ where: doneWhere }),
    prisma.repair.count({ where: { ...where, status: "cancelled" } }),
    prisma.repair.findMany({
      where: doneWhere,
      select: { quotedPrice: true, finalPrice: true, partsCost: true, laborCost: true, deviceType: true, deviceModel: true, createdAt: true, completedAt: true },
    }),
  ]);

  let totalRevenue = 0, totalPartsCost = 0, totalLaborCost = 0;
  for (const r of repairs) {
    totalRevenue += r.finalPrice || r.quotedPrice || 0;
    totalPartsCost += r.partsCost || 0;
    totalLaborCost += r.laborCost || 0;
  }
  const totalCost = totalPartsCost + totalLaborCost;
  const totalProfit = totalRevenue - totalCost;
  const avgTicket = completedJobs > 0 ? totalRevenue / completedJobs : 0;

  const avgTurnaround = repairs.filter(r => r.completedAt && r.createdAt).reduce((sum, r) => {
    return sum + (new Date(r.completedAt!).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  }, 0) / (completedJobs || 1);

  return c.json({
    totalJobs, completedJobs, cancelledJobs,
    activeJobs: totalJobs - completedJobs - cancelledJobs,
    totalRevenue, totalPartsCost, totalLaborCost, totalCost, totalProfit, avgTicket,
    avgTurnaroundDays: Math.round(avgTurnaround * 10) / 10,
    margin: totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0,
  });
});

app.get("/reports/by-device", async (c) => {
  const repairs = await prisma.repair.findMany({ select: { deviceType: true, status: true, finalPrice: true, quotedPrice: true } });
  const map = new Map<string, { count: number; revenue: number; completed: number }>();
  for (const r of repairs) {
    const key = r.deviceType || "other";
    const entry = map.get(key) || { count: 0, revenue: 0, completed: 0 };
    entry.count++;
    if (["done", "shipped", "returned"].includes(r.status)) {
      entry.completed++;
      entry.revenue += r.finalPrice || r.quotedPrice || 0;
    }
    map.set(key, entry);
  }
  return c.json(Array.from(map.entries()).map(([type, data]) => ({ type, ...data })).sort((a, b) => b.count - a.count));
});

app.get("/reports/by-status", async (c) => {
  const repairs = await prisma.repair.findMany({ select: { status: true } });
  const map = new Map<string, number>();
  for (const r of repairs) map.set(r.status, (map.get(r.status) || 0) + 1);
  return c.json(Array.from(map.entries()).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count));
});

app.get("/reports/top-parts", async (c) => {
  const parts = await prisma.repairPart.findMany({ include: { part: true } });
  const map = new Map<string, { name: string; totalQty: number; totalCost: number }>();
  for (const p of parts) {
    const key = p.partId;
    const entry = map.get(key) || { name: p.part.name, totalQty: 0, totalCost: 0 };
    entry.totalQty += p.quantity;
    entry.totalCost += p.cost;
    map.set(key, entry);
  }
  return c.json(Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty).slice(0, 15));
});

app.get("/reports/monthly-trend", async (c) => {
  const repairs = await prisma.repair.findMany({
    where: { status: { in: ["done", "shipped", "returned"] } },
    select: { createdAt: true, finalPrice: true, quotedPrice: true, partsCost: true, laborCost: true },
    orderBy: { createdAt: "asc" },
  });
  const map = new Map<string, { month: string; jobs: number; revenue: number; cost: number }>();
  for (const r of repairs) {
    const d = new Date(r.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const entry = map.get(key) || { month: key, jobs: 0, revenue: 0, cost: 0 };
    entry.jobs++;
    entry.revenue += r.finalPrice || r.quotedPrice || 0;
    entry.cost += (r.partsCost || 0) + (r.laborCost || 0);
    map.set(key, entry);
  }
  return c.json(Array.from(map.values()));
});

// ===== Repair Code Generator =====
app.post("/generate-repair-code", async (c) => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `MOR-${yy}${mm}`;
  const last = await prisma.repair.findFirst({ where: { repairCode: { startsWith: prefix } }, orderBy: { repairCode: "desc" } });
  let seq = 1;
  if (last) seq = parseInt(last.repairCode.split("-")[2], 10) + 1;
  return c.json({ code: `${prefix}-${String(seq).padStart(4, "0")}` });
});

const PORT = parseInt(process.env.DB_PORT || "4100");
console.log(`MorMac DB Server running on :${PORT}`);

// Pre-warm Ollama model
fetch("http://localhost:11434/api/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ model: "gemma3:4b", prompt: "hi", keep_alive: "30m", options: { num_predict: 1 } }),
}).then(() => console.log("Ollama model pre-warmed")).catch(() => console.log("Ollama not available — AI will be slower"));

export default { port: PORT, fetch: app.fetch };
