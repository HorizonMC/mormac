import { Hono } from "hono";
import { cors } from "hono/cors";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client";
import path from "path";

const dbPath = path.resolve(import.meta.dir, "../dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

const API_KEY = process.env.DB_API_KEY || "mormac-secret-key-change-me";

const app = new Hono();

app.use("*", cors());

app.use("*", async (c, next) => {
  const key = c.req.header("x-api-key");
  if (key !== API_KEY) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
});

// Health
app.get("/health", (c) => c.json({ ok: true, db: dbPath }));

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

type RepairDraftMeta = {
  kind: "repairDraft";
  deviceModel: string;
  deviceType: string;
  symptoms: string;
};

function parseJsonObject<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
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

function buildShippingCoverUrl(repairCode: string) {
  return `https://mormac.vercel.app/api/repairs/cover?code=${encodeURIComponent(repairCode)}`;
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
        where: { customer: { lineUserId: userId }, status: "pending_customer_name" },
        include: { customer: true },
        orderBy: { createdAt: "desc" },
      });

      if (pendingRepair) {
        const fullName = extractThaiFullName(message);
        if (!fullName) {
          await linePush(userId, "ขอชื่อจริงและนามสกุลสำหรับทำใบปะหน้าส่งไปรษณีย์ด้วยค่ะ\nเช่น สมชาย ใจดี");
          return;
        }

        const draft = parseJsonObject<RepairDraftMeta>(pendingRepair.photos);
        if (!draft || draft.kind !== "repairDraft") {
          await prisma.repair.update({
            where: { id: pendingRepair.id },
            data: { status: "cancelled", photos: null },
          });
          await linePush(userId, "ข้อมูลแจ้งซ่อมเดิมไม่สมบูรณ์ กรุณาแจ้งรุ่นเครื่องและอาการอีกครั้งนะคะ");
          return;
        }

        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const prefix = `MOR-${yy}${mm}`;
        const last = await prisma.repair.findFirst({ where: { repairCode: { startsWith: prefix } }, orderBy: { repairCode: "desc" } });
        let seq = 1;
        if (last) seq = parseInt(last.repairCode.split("-")[2], 10) + 1;
        const repairCode = `${prefix}-${String(seq).padStart(4, "0")}`;

        await prisma.$transaction([
          prisma.user.update({ where: { id: pendingRepair.customerId }, data: { name: fullName } }),
          prisma.repair.update({
            where: { id: pendingRepair.id },
            data: {
              repairCode,
              deviceModel: draft.deviceModel,
              deviceType: draft.deviceType,
              symptoms: draft.symptoms,
              status: "submitted",
              photos: null,
            },
          }),
          prisma.repairEvent.create({ data: { repairId: pendingRepair.id, status: "submitted", actor: "system", note: "Customer name confirmed" } }),
        ]);

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
        if (customer.name === "LINE User" || !/\s/.test(customer.name.trim())) {
          await prisma.repair.create({
            data: {
              repairCode: `TMP-${crypto.randomUUID()}`,
              shopId: shops[0].id,
              customerId: customer.id,
              deviceModel,
              deviceType: ai.type || "other",
              symptoms: ai.symptoms,
              status: "pending_customer_name",
              photos: JSON.stringify({
                kind: "repairDraft",
                deviceModel,
                deviceType: ai.type || "other",
                symptoms: ai.symptoms,
              } satisfies RepairDraftMeta),
            },
          });
          await linePush(userId, "รับข้อมูลเครื่องและอาการแล้วค่ะ\nขอชื่อจริงและนามสกุลสำหรับทำใบปะหน้าส่งไปรษณีย์ด้วยนะคะ\nเช่น สมชาย ใจดี");
          return;
        }

        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const prefix = `MOR-${yy}${mm}`;
        const last = await prisma.repair.findFirst({ where: { repairCode: { startsWith: prefix } }, orderBy: { repairCode: "desc" } });
        let seq = 1;
        if (last) seq = parseInt(last.repairCode.split("-")[2], 10) + 1;
        const repairCode = `${prefix}-${String(seq).padStart(4, "0")}`;

        await prisma.repair.create({ data: { repairCode, shopId: shops[0].id, customerId: customer.id, deviceModel, deviceType: ai.type || "other", symptoms: ai.symptoms, status: "submitted" } });
        await prisma.repairEvent.create({ data: { repairId: (await prisma.repair.findUnique({ where: { repairCode } }))!.id, status: "submitted", actor: "system" } });

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
                    { type: "text", text: "อุปกรณ์", size: "sm", color: "#888888", flex: 3 },
                    { type: "text", text: deviceModel, size: "sm", weight: "bold", color: "#0F1720", flex: 7, wrap: true },
                  ]},
                  { type: "box", layout: "horizontal", contents: [
                    { type: "text", text: "อาการ", size: "sm", color: "#888888", flex: 3 },
                    { type: "text", text: ai.symptoms, size: "sm", weight: "bold", color: "#0F1720", flex: 7, wrap: true },
                  ]},
                  { type: "separator", color: "#EEEEEE" },
                  { type: "text", text: "เราจะตรวจเช็คและแจ้งราคาให้ทราบ", size: "xs", color: "#888888", margin: "md", wrap: true },
                ]},
                footer: { type: "box", layout: "vertical", spacing: "sm", paddingAll: "16px", contents: [
                  { type: "button", style: "primary", color: "#0F1720", height: "sm", action: { type: "uri", label: "🔗 ติดตามสถานะ", uri: trackUrl } },
                  { type: "button", style: "secondary", height: "sm", action: { type: "uri", label: "🧾 ใบปะหน้าส่งเครื่อง", uri: buildShippingCoverUrl(repairCode) } },
                ]},
              },
            }],
          }),
        });
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
