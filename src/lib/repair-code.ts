import { prisma } from "./prisma";

export async function generateRepairCode(): Promise<string> {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `MOR-${yy}${mm}`;

  const lastRepair = await prisma.repair.findFirst({
    where: { repairCode: { startsWith: prefix } },
    orderBy: { repairCode: "desc" },
  });

  let seq = 1;
  if (lastRepair) {
    const lastSeq = parseInt(lastRepair.repairCode.split("-")[2], 10);
    seq = lastSeq + 1;
  }

  return `${prefix}-${String(seq).padStart(4, "0")}`;
}
