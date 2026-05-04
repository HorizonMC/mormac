import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client";

import path from "path";
const dbPath = path.resolve(import.meta.dir, "../dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Owner
  const owner = await prisma.user.create({
    data: { name: "Pongpiphat", email: "pong@mormac.co", role: "owner", phone: "099-999-9999" },
  });

  // Shop
  const shop = await prisma.shop.create({
    data: { name: "MorMac สาขาลาดพร้าว", ownerId: owner.id, address: "123 ลาดพร้าว กรุงเทพ", phone: "02-111-2222" },
  });

  // Tech
  const techUser = await prisma.user.create({
    data: { name: "ช่างเอก", role: "tech", phone: "088-888-8888" },
  });
  const tech = await prisma.staff.create({
    data: { userId: techUser.id, shopId: shop.id, role: "tech" },
  });

  // Customers
  const customers = await Promise.all([
    prisma.user.create({ data: { name: "คุณสมชาย", lineUserId: "U001", role: "customer", phone: "081-111-1111" } }),
    prisma.user.create({ data: { name: "คุณวิไล", lineUserId: "U002", role: "customer", phone: "082-222-2222" } }),
    prisma.user.create({ data: { name: "คุณนที", lineUserId: "U003", role: "customer", phone: "083-333-3333" } }),
  ]);

  // Repairs
  const repairs = [
    { code: "MOR-2605-0001", model: "iPhone 15 Pro", type: "iphone", symptoms: "จอแตก ทัชไม่ได้", status: "repairing", customer: 0, quoted: 3500 },
    { code: "MOR-2605-0002", model: "MacBook Air M2", type: "macbook", symptoms: "เปิดไม่ติด ชาร์จไม่เข้า", status: "diagnosing", customer: 1, quoted: null },
    { code: "MOR-2605-0003", model: "iPhone 14", type: "iphone", symptoms: "แบตบวม เครื่องร้อน", status: "quoted", customer: 2, quoted: 1800 },
    { code: "MOR-2605-0004", model: "iPad Pro 12.9", type: "ipad", symptoms: "จอลาย มีเส้นสี", status: "submitted", customer: 0, quoted: null },
    { code: "MOR-2605-0005", model: "MacBook Pro 14 M3", type: "macbook", symptoms: "คีย์บอร์ดบางปุ่มกดไม่ได้", status: "done", customer: 1, quoted: 4500 },
  ];

  for (const r of repairs) {
    const repair = await prisma.repair.create({
      data: {
        repairCode: r.code,
        shopId: shop.id,
        customerId: customers[r.customer].id,
        techId: ["repairing", "done", "qc"].includes(r.status) ? tech.id : null,
        deviceModel: r.model,
        deviceType: r.type,
        symptoms: r.symptoms,
        status: r.status,
        quotedPrice: r.quoted,
      },
    });

    await prisma.repairEvent.create({
      data: { repairId: repair.id, status: "submitted", actor: "customer" },
    });
    if (["received", "diagnosing", "quoted", "confirmed", "repairing", "qc", "done"].includes(r.status)) {
      await prisma.repairEvent.create({ data: { repairId: repair.id, status: "received", actor: "admin" } });
    }
    if (["diagnosing", "quoted", "confirmed", "repairing", "qc", "done"].includes(r.status)) {
      await prisma.repairEvent.create({ data: { repairId: repair.id, status: "diagnosing", actor: "tech" } });
    }
    if (["quoted", "confirmed", "repairing", "qc", "done"].includes(r.status)) {
      await prisma.repairEvent.create({ data: { repairId: repair.id, status: "quoted", actor: "tech" } });
    }
    if (["confirmed", "repairing", "qc", "done"].includes(r.status)) {
      await prisma.repairEvent.create({ data: { repairId: repair.id, status: "confirmed", actor: "customer" } });
    }
    if (["repairing", "qc", "done"].includes(r.status)) {
      await prisma.repairEvent.create({ data: { repairId: repair.id, status: "repairing", actor: "tech" } });
    }
    if (r.status === "done") {
      await prisma.repairEvent.create({ data: { repairId: repair.id, status: "done", actor: "tech" } });
    }
  }

  // Parts
  await prisma.part.createMany({
    data: [
      { shopId: shop.id, name: "จอ iPhone 15 Pro (OEM)", category: "screen", quantity: 3, costPrice: 2800 },
      { shopId: shop.id, name: "จอ iPhone 14 (OEM)", category: "screen", quantity: 5, costPrice: 1800 },
      { shopId: shop.id, name: "แบต iPhone 14", category: "battery", quantity: 2, costPrice: 450 },
      { shopId: shop.id, name: "แบต iPhone 15 Pro", category: "battery", quantity: 0, costPrice: 550 },
      { shopId: shop.id, name: "คีย์บอร์ด MacBook Pro 14", category: "other", quantity: 1, costPrice: 3200 },
      { shopId: shop.id, name: "สาย Charge USB-C", category: "connector", quantity: 10, costPrice: 80 },
    ],
  });

  console.log("Seeded successfully!");
}

main().finally(() => prisma.$disconnect());
