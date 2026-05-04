import { prisma } from "@/lib/prisma";
import { getBrand } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const brand = await getBrand();
  const c = brand.colors;

  const [totalRepairs, activeRepairs, completedRepairs, totalDevices, readyDevices] = await Promise.all([
    prisma.repair.count(),
    prisma.repair.count({ where: { status: { notIn: ["returned", "cancelled"] } } }),
    prisma.repair.count({ where: { status: "returned" } }),
    prisma.device.count(),
    prisma.device.count({ where: { status: "ready" } }),
  ]);

  const recentRepairs = await prisma.repair.findMany({
    include: { customer: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const lowStockParts = await prisma.part.findMany({
    where: { quantity: { lte: 3 } },
    orderBy: { quantity: "asc" },
    take: 10,
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-6" style={{ color: c.dark }}>ภาพรวม</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <KPI label="งานทั้งหมด" value={totalRepairs} />
        <KPI label="กำลังดำเนินการ" value={activeRepairs} accent />
        <KPI label="เสร็จสิ้น" value={completedRepairs} />
        <KPI label="เครื่องในสต็อค" value={totalDevices} />
        <KPI label="พร้อมขาย" value={readyDevices} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4" style={{ borderColor: `${c.mint}33`, borderWidth: 1 }}>
          <p className="font-bold text-sm mb-3">งานซ่อมล่าสุด</p>
          <div className="space-y-2">
            {recentRepairs.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm pb-2" style={{ borderBottom: `1px solid ${c.mint}1a` }}>
                <div>
                  <span className="font-mono text-xs" style={{ color: c.teal }}>{r.repairCode}</span>
                  <p className="font-medium">{r.deviceModel}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${c.dark}0d` }}>{r.status}</span>
              </div>
            ))}
            {recentRepairs.length === 0 && <p className="text-sm" style={{ color: c.teal }}>ยังไม่มีงาน</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4" style={{ borderColor: `${c.mint}33`, borderWidth: 1 }}>
          <p className="font-bold text-sm mb-3">อะไหล่ใกล้หมด</p>
          <div className="space-y-2">
            {lowStockParts.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm pb-2" style={{ borderBottom: `1px solid ${c.mint}1a` }}>
                <span>{p.name}</span>
                <span className={`text-xs font-bold ${p.quantity === 0 ? "text-red-600" : "text-yellow-600"}`}>
                  {p.quantity} ชิ้น
                </span>
              </div>
            ))}
            {lowStockParts.length === 0 && <p className="text-sm" style={{ color: c.teal }}>สต็อคปกติ</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${accent ? "bg-gray-900 text-white" : "bg-white shadow-sm border border-gray-100"}`}>
      <p className={`text-xs ${accent ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
