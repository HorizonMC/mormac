import { db } from "@/lib/db-client";
import { getBrand } from "@/lib/brand";
import { PartsTable } from "./parts-table";

export const dynamic = "force-dynamic";

export default async function PartsPage() {
  const [parts, shops, brand] = await Promise.all([
    db.parts.list(),
    db.shops.list(),
    getBrand(),
  ]);
  const c = brand.colors;

  return (
    <div style={{ background: c.bg }} className="min-h-screen -m-4 p-4 sm:-m-6 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: c.dark }}>
            อะไหล่ / สต็อค
          </h1>
          <p className="text-sm mt-0.5" style={{ color: c.teal }}>
            จัดการสต็อคอะไหล่ทั้งหมด
          </p>
        </div>
      </div>
      <PartsTable parts={parts} defaultShopId={shops[0]?.id || ""} />
    </div>
  );
}
