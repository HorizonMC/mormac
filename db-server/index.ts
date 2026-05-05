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

// ===== AI Parse =====
const SYSTEM_PROMPT = await Bun.file(path.resolve(import.meta.dir, "../ai/repair-assistant.md")).text();

app.post("/ai/parse", async (c) => {
  const { message } = await c.req.json();
  if (!message) return c.json({ error: "Missing message" }, 400);

  try {
    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma3:4b",
        prompt: `ข้อความจากลูกค้า: "${message}"`,
        system: SYSTEM_PROMPT,
        stream: false,
        options: { temperature: 0.1, num_predict: 300 },
      }),
    });
    const data = await res.json() as { response: string };
    const jsonMatch = data.response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return c.json({ intent: "chat", reply: data.response });
    return c.json(JSON.parse(jsonMatch[0]));
  } catch (e) {
    return c.json({ intent: "chat", reply: "ขออภัยค่ะ ระบบขัดข้อง กรุณาลองใหม่" });
  }
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
export default { port: PORT, fetch: app.fetch };
