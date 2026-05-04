import { prisma } from "@/lib/prisma";
import { DeviceTable } from "./device-table";

export const dynamic = "force-dynamic";

export default async function DevicesPage() {
  const devices = await prisma.device.findMany({ orderBy: { createdAt: "desc" } });
  const shops = await prisma.shop.findMany();

  const totalValue = devices.reduce((sum, d) => sum + d.buyPrice, 0);
  const potentialRevenue = devices.filter((d) => d.sellPrice).reduce((sum, d) => sum + (d.sellPrice || 0), 0);
  const ready = devices.filter((d) => d.status === "ready" || d.status === "listed");
  const sold = devices.filter((d) => d.status === "sold");

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
