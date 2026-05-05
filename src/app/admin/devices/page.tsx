import { db } from "@/lib/db-client";
import { DeviceTable } from "./device-table";

export const dynamic = "force-dynamic";

export default async function DevicesPage() {
  const devices = await db.devices.list();
  const shops = await db.shops.list();
  const totalValue = devices.reduce((sum: number, d: any) => sum + d.buyPrice, 0);
  const potentialRevenue = devices.filter((d: any) => d.sellPrice).reduce((sum: number, d: any) => sum + (d.sellPrice || 0), 0);
  const ready = devices.filter((d: any) => d.status === "ready" || d.status === "listed");
  const sold = devices.filter((d: any) => d.status === "sold");

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">เครื่องรับซื้อ / Refurb</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Stat label="ทั้งหมด" value={String(devices.length)} />
        <Stat label="พร้อมขาย" value={String(ready.length)} />
        <Stat label="ขายแล้ว" value={String(sold.length)} />
        <Stat label="ต้นทุนรวม" value={`฿${totalValue.toLocaleString()}`} />
        <Stat label="ราคาขายรวม" value={`฿${potentialRevenue.toLocaleString()}`} />
      </div>
      <DeviceTable devices={devices} defaultShopId={shops[0]?.id || ""} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
