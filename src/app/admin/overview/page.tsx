import { db } from "@/lib/db-client";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const stats = await db.stats();

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">ภาพรวม</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <KPI label="งานทั้งหมด" value={stats.totalRepairs} />
        <KPI label="กำลังดำเนินการ" value={stats.activeRepairs} accent />
        <KPI label="เสร็จสิ้น" value={stats.completedRepairs} />
        <KPI label="เครื่องในสต็อค" value={stats.totalDevices} />
        <KPI label="พร้อมขาย" value={stats.readyDevices} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="font-bold text-sm mb-3">งานซ่อมล่าสุด</p>
          {stats.recentRepairs?.map((r: any) => (
            <div key={r.id} className="flex items-center justify-between text-sm pb-2 border-b border-gray-50">
              <div><span className="font-mono text-xs text-gray-400">{r.repairCode}</span><p className="font-medium">{r.deviceModel}</p></div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50">{r.status}</span>
            </div>
          )) || <p className="text-sm text-gray-400">ยังไม่มีงาน</p>}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="font-bold text-sm mb-3">อะไหล่ใกล้หมด</p>
          {stats.lowStockParts?.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between text-sm pb-2 border-b border-gray-50">
              <span>{p.name}</span>
              <span className={`text-xs font-bold ${p.quantity === 0 ? "text-red-600" : "text-yellow-600"}`}>{p.quantity} ชิ้น</span>
            </div>
          )) || <p className="text-sm text-gray-400">สต็อคปกติ</p>}
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
