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
