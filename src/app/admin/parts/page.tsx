import { db } from "@/lib/db-client";
import { PartsTable } from "./parts-table";

export const dynamic = "force-dynamic";

export default async function PartsPage() {
  const parts = await db.parts.list();
  const shops = await db.shops.list();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">อะไหล่ / สต็อค</h1>
      </div>
      <PartsTable parts={parts} defaultShopId={shops[0]?.id || ""} />
    </div>
  );
}
