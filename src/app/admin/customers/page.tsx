import { db } from "@/lib/db-client";
import { getBrand } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const [customers, brand] = await Promise.all([
    db.users.list("customer"),
    getBrand(),
  ]);
  const c = brand.colors;

  return (
    <div style={{ background: c.bg }} className="min-h-screen -m-4 p-4 sm:-m-6 sm:p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight" style={{ color: c.dark }}>ลูกค้า</h1>
        <p className="text-sm mt-0.5" style={{ color: c.teal }}>รายชื่อลูกค้าและสถิติ</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="ลูกค้าทั้งหมด" value={customers.length} dark={c.dark} teal={c.teal} />
        <StatCard label="มาจาก LINE" value={customers.filter((c: any) => c.lineUserId).length} dark={c.dark} teal={c.teal} accent={c.accent} />
        <StatCard label="สมาชิก" value={customers.filter((c: any) => c.memberTier !== "none").length} dark={c.dark} teal={c.teal} />
        <StatCard label="งานซ่อมรวม" value={customers.reduce((sum: number, c: any) => sum + (c.repairs?.length || 0), 0)} dark={c.dark} teal={c.teal} />
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: `1px solid ${c.dark}08` }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: `${c.dark}04` }}>
              <th className="p-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: c.teal }}>ชื่อ</th>
              <th className="p-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: c.teal }}>โทร</th>
              <th className="p-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: c.teal }}>LINE</th>
              <th className="p-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: c.teal }}>สมาชิก</th>
              <th className="p-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: c.teal }}>แต้ม</th>
              <th className="p-4 text-right text-xs font-bold uppercase tracking-wider" style={{ color: c.teal }}>งานซ่อม</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((cust: any) => (
              <tr key={cust.id} className="transition-colors hover:bg-gray-50" style={{ borderBottom: `1px solid ${c.dark}06` }}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ background: c.dark }}
                    >
                      {(cust.name || "?")[0].toUpperCase()}
                    </div>
                    <span className="font-bold" style={{ color: c.dark }}>{cust.name}</span>
                  </div>
                </td>
                <td className="p-4" style={{ color: c.teal }}>{cust.phone || "—"}</td>
                <td className="p-4">
                  {cust.lineUserId ? (
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: `${c.accent}18`, color: c.accent }}>
                      เชื่อมแล้ว
                    </span>
                  ) : (
                    <span style={{ color: c.teal }}>—</span>
                  )}
                </td>
                <td className="p-4">
                  {cust.memberTier !== "none" ? (
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: `${c.mint}20`, color: c.teal }}>
                      {cust.memberTier}
                    </span>
                  ) : (
                    <span style={{ color: c.teal }}>—</span>
                  )}
                </td>
                <td className="p-4" style={{ color: c.teal }}>{cust.memberPoints > 0 ? cust.memberPoints : "—"}</td>
                <td className="p-4 text-right">
                  <span className="font-black text-lg" style={{ color: c.dark }}>{cust.repairs?.length || 0}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {customers.map((cust: any) => (
          <div key={cust.id} className="bg-white rounded-2xl shadow-sm p-4" style={{ border: `1px solid ${c.dark}08` }}>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ background: c.dark }}
              >
                {(cust.name || "?")[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold truncate" style={{ color: c.dark }}>{cust.name}</p>
                <p className="text-xs" style={{ color: c.teal }}>{cust.phone || "ไม่มีเบอร์"}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-xl" style={{ color: c.dark }}>{cust.repairs?.length || 0}</p>
                <p className="text-xs" style={{ color: c.teal }}>งานซ่อม</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {cust.lineUserId && (
                <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: `${c.accent}18`, color: c.accent }}>
                  LINE
                </span>
              )}
              {cust.memberTier !== "none" && (
                <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: `${c.mint}20`, color: c.teal }}>
                  {cust.memberTier}
                </span>
              )}
              {cust.memberPoints > 0 && (
                <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: `${c.dark}06`, color: c.dark }}>
                  {cust.memberPoints} แต้ม
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
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
  value: number;
  dark: string;
  teal: string;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5" style={{ border: `1px solid ${dark}08` }}>
      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: teal }}>{label}</p>
      <p className="text-3xl font-black" style={{ color: accent || dark }}>{value}</p>
    </div>
  );
}
