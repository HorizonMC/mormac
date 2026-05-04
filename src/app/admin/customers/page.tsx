import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await prisma.user.findMany({
    where: { role: "customer" },
    include: { repairs: { select: { id: true, status: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">ลูกค้า</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500">ลูกค้าทั้งหมด</p>
          <p className="text-2xl font-bold">{customers.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500">มาจาก LINE</p>
          <p className="text-2xl font-bold">{customers.filter((c) => c.lineUserId).length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500">สมาชิก</p>
          <p className="text-2xl font-bold">{customers.filter((c) => c.memberTier !== "none").length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500">งานซ่อมรวม</p>
          <p className="text-2xl font-bold">{customers.reduce((sum, c) => sum + c.repairs.length, 0)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="p-3">ชื่อ</th>
              <th className="p-3">โทร</th>
              <th className="p-3">LINE</th>
              <th className="p-3">สมาชิก</th>
              <th className="p-3">แต้ม</th>
              <th className="p-3 text-right">งานซ่อม</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-gray-500">{c.phone || "—"}</td>
                <td className="p-3">{c.lineUserId ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600">เชื่อมแล้ว</span> : "—"}</td>
                <td className="p-3">
                  {c.memberTier !== "none" ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.memberTier === "gold" ? "bg-yellow-50 text-yellow-700" : c.memberTier === "platinum" ? "bg-purple-50 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                      {c.memberTier}
                    </span>
                  ) : "—"}
                </td>
                <td className="p-3 text-gray-500">{c.memberPoints > 0 ? c.memberPoints : "—"}</td>
                <td className="p-3 text-right font-medium">{c.repairs.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
