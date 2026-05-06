import { db } from "@/lib/db-client";
import { getBrand } from "@/lib/brand";
import { DeviceTable } from "./device-table";

export const dynamic = "force-dynamic";

export default async function DevicesPage() {
  const [devices, shops, brand] = await Promise.all([
    db.devices.list(),
    db.shops.list(),
    getBrand(),
  ]);
  const c = brand.colors;
  const totalValue = devices.reduce((sum: number, d: any) => sum + d.buyPrice, 0);
  const potentialRevenue = devices.filter((d: any) => d.sellPrice).reduce((sum: number, d: any) => sum + (d.sellPrice || 0), 0);
  const ready = devices.filter((d: any) => d.status === "ready" || d.status === "listed");
  const sold = devices.filter((d: any) => d.status === "sold");

  return (
    <div style={{ background: c.bg }} className="min-h-screen -m-4 p-4 sm:-m-6 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight" style={{ color: c.dark }}>
          เครื่องรับซื้อ / Refurb
        </h1>
        <p className="text-sm mt-0.5" style={{ color: c.teal }}>
          จัดการสต็อคเครื่องมือสอง
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard label="ทั้งหมด" value={String(devices.length)} dark={c.dark} teal={c.teal} />
        <StatCard label="พร้อมขาย" value={String(ready.length)} dark={c.dark} teal={c.teal} accent={c.accent} />
        <StatCard label="ขายแล้ว" value={String(sold.length)} dark={c.dark} teal={c.teal} />
        <StatCard label="ต้นทุนรวม" value={`฿${totalValue.toLocaleString()}`} dark={c.dark} teal={c.teal} />
        <StatCard label="ราคาขายรวม" value={`฿${potentialRevenue.toLocaleString()}`} dark={c.dark} teal={c.teal} accent={c.accent} />
      </div>

      <DeviceTable devices={devices} defaultShopId={shops[0]?.id || ""} />
    </div>
  );
}

function StatCard({
  label,
  value,
  dark,
  teal,
  accent,
}: {
  label: string;
  value: string;
  dark: string;
  teal: string;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5" style={{ border: `1px solid ${dark}08` }}>
      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: teal }}>{label}</p>
      <p className="text-xl font-black" style={{ color: accent || dark }}>{value}</p>
    </div>
  );
}
