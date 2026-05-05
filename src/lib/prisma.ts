import { PrismaClient } from "../../src/generated/prisma/client";

const isVercel = !!process.env.VERCEL;

let prisma: PrismaClient;

if (isVercel) {
  // On Vercel: no local DB, pages use db-client.ts instead
  // This is a dummy — pages should import from db-client when DB_API_URL is set
  prisma = null as unknown as PrismaClient;
} else {
  // Local: use libsql adapter with local SQLite
  const { PrismaLibSql } = require("@prisma/adapter-libsql");
  const url = process.env.DATABASE_URL || "file:./dev.db";
  const adapter = new PrismaLibSql({ url });

  const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
  prisma = globalForPrisma.prisma || new PrismaClient({ adapter });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
}

export { prisma };
