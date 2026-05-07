import Link from "next/link";
import { db } from "@/lib/db-client";
import { getBrand } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [brand, ltv] = await Promise.all([getBrand(), db.customer.ltv(id)]);
  const c = brand.colors;
  const repairs = ltv.customer.repairs || [];

  return (
    <div style={{ background: c.bg }} className="min-h-screen -m-4 p-4 sm:-m-6 sm:p-6">
      <div className="mb-8">
        <Link href="/admin/customers" className="text-xs font-bold" style={{ color: c.teal }}>กลับไปลูกค้า</Link>
        <h1 className="mt-2 text-2xl font-black tracking-tight" style={{ color: c.dark }}>{ltv.customer.name}</h1>
        <p className="text-sm mt-0.5" style={{ color: c.teal }}>{ltv.customer.phone || "ไม่มีเบอร์"} | {ltv.customer.lineUserId ? "LINE connected" : "No LINE"}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard label="Lifetime Revenue" value={`฿${fmt(ltv.totalRevenue)}`} dark={c.dark} teal={c.teal} accent={c.accent} />
        <KPICard label="Lifetime Profit" value={`฿${fmt(ltv.totalProfit)}`} dark={c.dark} teal={c.teal} accent={ltv.totalProfit >= 0 ? c.accent : "#EF4444"} />
        <KPICard label="Avg Ticket" value={`฿${fmt(ltv.avgTicket)}`} dark={c.dark} teal={c.teal} />
        <KPICard label="Avg Rating" value={ltv.avgRating ? `${ltv.avgRating} / 5` : "—"} dark={c.dark} teal={c.teal} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: `1px solid ${c.dark}08` }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: `${c.dark}08` }}>
          <h2 className="font-bold" style={{ color: c.dark }}>ประวัติงานซ่อม ({ltv.totalRepairs})</h2>
        </div>
        <div className="divide-y" style={{ borderColor: `${c.dark}06` }}>
          {repairs.map((repair) => {
            const revenue = repair.finalPrice || repair.quotedPrice || 0;
            return (
              <Link key={repair.id} href={`/admin/repairs/${repair.id}`} className="block px-5 py-4 transition hover:bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-bold" style={{ color: c.accent }}>{repair.repairCode}</p>
                    <p className="mt-1 font-bold" style={{ color: c.dark }}>{repair.deviceModel}</p>
                    <p className="text-xs mt-1 truncate" style={{ color: c.teal }}>{repair.symptoms}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black" style={{ color: c.dark }}>฿{fmt(revenue)}</p>
                    <p className="text-xs mt-1" style={{ color: c.teal }}>{repair.status}</p>
                  </div>
                </div>
              </Link>
            );
          })}
          {repairs.length === 0 && <div className="px-5 py-16 text-center" style={{ color: c.teal }}>ยังไม่มีประวัติงานซ่อม</div>}
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, dark, teal, accent }: { label: string; value: string; dark: string; teal: string; accent?: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm" style={{ border: `1px solid ${dark}08` }}>
      <p className="text-xs font-bold" style={{ color: teal }}>{label}</p>
      <p className="text-2xl font-black mt-1" style={{ color: accent || dark }}>{value}</p>
    </div>
  );
}

function fmt(value: number): string {
  return Math.round(value).toLocaleString();
}
