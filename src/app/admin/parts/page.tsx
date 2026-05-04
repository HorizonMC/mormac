import { prisma } from "@/lib/prisma";
import { PartsTable } from "./parts-table";

export const dynamic = "force-dynamic";

export default async function PartsPage() {
  const parts = await prisma.part.findMany({ orderBy: { name: "asc" } });
  const shops = await prisma.shop.findMany();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">อะไหล่ / สต็อค</h1>
      </div>
      <PartsTable parts={parts} defaultShopId={shops[0]?.id || ""} />
    </div>
  );
}
