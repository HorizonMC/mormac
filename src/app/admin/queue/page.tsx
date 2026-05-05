import { db } from "@/lib/db-client";
import { repairStatusText } from "@/lib/line";
import { getBrand } from "@/lib/brand";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const brand = await getBrand();
  const repairs = await db.repairs.list();
  const active = repairs.filter((r: any) => !["returned", "cancelled"].includes(r.status));

  const byStatus = {
    pending: active.filter((r: any) => ["submitted", "received", "diagnosing", "quoted"].includes(r.status)),
    working: active.filter((r: any) => ["confirmed", "repairing", "qc"].includes(r.status)),
    done: active.filter((r: any) => ["done", "shipped"].includes(r.status)),
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">คิวงานซ่อม</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="รอดำเนินการ" count={byStatus.pending.length} color="bg-yellow-100 text-yellow-800" />
        <StatCard label="กำลังซ่อม" count={byStatus.working.length} color="bg-blue-100 text-blue-800" />
        <StatCard label="เสร็จ/รอส่ง" count={byStatus.done.length} color="bg-green-100 text-green-800" />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500 border-b border-gray-100">
            <th className="p-3">เลขซ่อม</th><th className="p-3">อุปกรณ์</th><th className="p-3">อาการ</th>
            <th className="p-3">สถานะ</th><th className="p-3">ช่าง</th><th className="p-3">วันที่</th><th className="p-3"></th>
          </tr></thead>
          <tbody>
            {active.map((r: any) => (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-3 font-mono font-medium">{r.repairCode}</td>
                <td className="p-3">{r.deviceModel}</td>
                <td className="p-3 text-gray-500 max-w-40 truncate">{r.symptoms}</td>
                <td className="p-3"><span className="text-xs px-2 py-1 rounded-full bg-gray-50">{repairStatusText(r.status)}</span></td>
                <td className="p-3 text-gray-500">{r.tech?.user?.name || "—"}</td>
                <td className="p-3 text-gray-500">{new Date(r.createdAt).toLocaleDateString("th-TH")}</td>
                <td className="p-3"><Link href={`/admin/repairs/${r.id}`} className="text-xs text-gray-400 underline">จัดการ</Link></td>
              </tr>
            ))}
            {active.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-400">ไม่มีงานซ่อมในระบบ</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold">{count}</p>
      <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>{label}</span>
    </div>
  );
}
