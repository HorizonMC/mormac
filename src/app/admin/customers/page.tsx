import { db } from "@/lib/db-client";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await db.users.list("customer");

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">ลูกค้า</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="ลูกค้าทั้งหมด" value={customers.length} />
        <Stat label="มาจาก LINE" value={customers.filter((c: any) => c.lineUserId).length} />
        <Stat label="สมาชิก" value={customers.filter((c: any) => c.memberTier !== "none").length} />
        <Stat label="งานซ่อมรวม" value={customers.reduce((sum: number, c: any) => sum + (c.repairs?.length || 0), 0)} />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500 border-b border-gray-100">
            <th className="p-3">ชื่อ</th><th className="p-3">โทร</th><th className="p-3">LINE</th>
            <th className="p-3">สมาชิก</th><th className="p-3">แต้ม</th><th className="p-3 text-right">งานซ่อม</th>
          </tr></thead>
          <tbody>
            {customers.map((c: any) => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-gray-500">{c.phone || "—"}</td>
                <td className="p-3">{c.lineUserId ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600">เชื่อมแล้ว</span> : "—"}</td>
                <td className="p-3">{c.memberTier !== "none" ? <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700">{c.memberTier}</span> : "—"}</td>
                <td className="p-3 text-gray-500">{c.memberPoints > 0 ? c.memberPoints : "—"}</td>
                <td className="p-3 text-right font-medium">{c.repairs?.length || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
