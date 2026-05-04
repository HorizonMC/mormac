import { prisma } from "@/lib/prisma";
import { repairStatusText } from "@/lib/line";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const repairs = await prisma.repair.findMany({
    where: { status: { notIn: ["returned", "cancelled"] } },
    include: { customer: true, tech: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const byStatus = {
    pending: repairs.filter((r) => ["submitted", "received", "diagnosing", "quoted"].includes(r.status)),
    active: repairs.filter((r) => ["confirmed", "repairing", "qc"].includes(r.status)),
    done: repairs.filter((r) => ["done", "shipped"].includes(r.status)),
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-[#0F1720] mb-4">คิวงานซ่อม</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="รอดำเนินการ" count={byStatus.pending.length} color="bg-yellow-100 text-yellow-800" />
        <StatCard label="กำลังซ่อม" count={byStatus.active.length} color="bg-blue-100 text-blue-800" />
        <StatCard label="เสร็จ/รอส่ง" count={byStatus.done.length} color="bg-green-100 text-green-800" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#85C1B2]/20">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#85C1B2]/20 text-left text-[#4A7A8A]">
                <th className="p-3">เลขซ่อม</th>
                <th className="p-3">อุปกรณ์</th>
                <th className="p-3">อาการ</th>
                <th className="p-3">สถานะ</th>
                <th className="p-3">ช่าง</th>
                <th className="p-3">วันที่</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {repairs.map((r) => (
                <tr key={r.id} className="border-b border-[#85C1B2]/10 hover:bg-[#f0faf7]">
                  <td className="p-3 font-mono font-medium">{r.repairCode}</td>
                  <td className="p-3">{r.deviceModel}</td>
                  <td className="p-3 text-[#4A7A8A] max-w-40 truncate">{r.symptoms}</td>
                  <td className="p-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-[#0F1720]/5">{repairStatusText(r.status)}</span>
                  </td>
                  <td className="p-3 text-[#4A7A8A]">{r.tech?.user.name || "—"}</td>
                  <td className="p-3 text-[#4A7A8A]">{r.createdAt.toLocaleDateString("th-TH")}</td>
                  <td className="p-3">
                    <Link href={`/admin/repairs/${r.id}`} className="text-[#4A7A8A] hover:text-[#0F1720] text-xs underline">
                      จัดการ
                    </Link>
                  </td>
                </tr>
              ))}
              {repairs.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-[#4A7A8A]">ไม่มีงานซ่อมในระบบ</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#85C1B2]/20 p-4">
      <p className="text-sm text-[#4A7A8A]">{label}</p>
      <p className="text-2xl font-bold text-[#0F1720]">{count}</p>
      <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>{label}</span>
    </div>
  );
}
