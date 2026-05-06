import { db } from "@/lib/db-client";
import { repairStatusText } from "@/lib/line";
import { getBrand } from "@/lib/brand";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const brand = await getBrand();
  const c = brand.colors;
  const stats = await db.stats();
  const repairs = await db.repairs.list();
  const active = repairs.filter((r: any) => !["returned", "cancelled"].includes(r.status));
  const recent = active.slice(0, 8);

  const summaryCards = [
    {
      label: "งานทั้งหมด",
      value: stats.totalRepairs,
      icon: "📋",
      iconBg: `${c.accent}18`,
      iconColor: c.accent,
    },
    {
      label: "กำลังดำเนินการ",
      value: stats.activeRepairs,
      icon: "🔧",
      iconBg: "#3B82F618",
      iconColor: "#3B82F6",
    },
    {
      label: "เสร็จสิ้น",
      value: stats.completedRepairs,
      icon: "✅",
      iconBg: "#10B98118",
      iconColor: "#10B981",
    },
    {
      label: "เครื่องในสต็อค",
      value: stats.totalDevices,
      icon: "📱",
      iconBg: "#8B5CF618",
      iconColor: "#8B5CF6",
    },
  ];

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black" style={{ color: c.dark }}>
          สวัสดี, {brand.name}
        </h1>
        <p className="text-sm mt-1" style={{ color: c.teal }}>
          ภาพรวมร้านซ่อมวันนี้
        </p>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        {summaryCards.map((card, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ background: card.iconBg }}
              >
                {card.icon}
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-black" style={{ color: c.dark }}>
              {card.value}
            </p>
            <p className="text-xs md:text-sm mt-0.5" style={{ color: c.teal }}>
              {card.label}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Repairs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: `${c.dark}08` }}
        >
          <div>
            <h2 className="font-bold text-base" style={{ color: c.dark }}>
              งานซ่อมล่าสุด
            </h2>
            <p className="text-xs mt-0.5" style={{ color: c.teal }}>
              {active.length} งานที่ยังดำเนินการ
            </p>
          </div>
          <Link
            href="/admin/queue"
            className="text-xs font-bold px-3 py-1.5 rounded-lg transition hover:scale-[1.02]"
            style={{ background: `${c.accent}15`, color: c.accent }}
          >
            ดูทั้งหมด
          </Link>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b" style={{ borderColor: `${c.dark}06` }}>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: c.teal }}>เลขซ่อม</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: c.teal }}>อุปกรณ์</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: c.teal }}>อาการ</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: c.teal }}>สถานะ</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: c.teal }}>ช่าง</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: c.teal }}>วันที่</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r: any) => (
                <tr
                  key={r.id}
                  className="border-b transition hover:bg-gray-50/50"
                  style={{ borderColor: `${c.dark}04` }}
                >
                  <td className="px-5 py-3.5 font-mono font-bold text-xs" style={{ color: c.accent }}>
                    {r.repairCode}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-sm" style={{ color: c.dark }}>
                    {r.deviceModel}
                  </td>
                  <td className="px-5 py-3.5 text-sm max-w-40 truncate" style={{ color: c.teal }}>
                    {r.symptoms}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: c.teal }}>
                    {r.tech?.user?.name || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-xs" style={{ color: `${c.teal}aa` }}>
                    {new Date(r.createdAt).toLocaleDateString("th-TH")}
                  </td>
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/admin/repairs/${r.id}`}
                      className="text-xs font-bold px-2.5 py-1 rounded-lg transition hover:opacity-80"
                      style={{ background: `${c.dark}08`, color: c.dark }}
                    >
                      จัดการ
                    </Link>
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center" style={{ color: c.teal }}>
                    <div className="text-3xl mb-2">📭</div>
                    <p className="text-sm">ไม่มีงานซ่อมในระบบ</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y" style={{ borderColor: `${c.dark}06` }}>
          {recent.map((r: any) => (
            <Link
              key={r.id}
              href={`/admin/repairs/${r.id}`}
              className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-gray-50/50 active:bg-gray-100/50"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold" style={{ color: c.accent }}>
                    {r.repairCode}
                  </span>
                  <StatusBadge status={r.status} />
                </div>
                <p className="text-sm font-medium truncate" style={{ color: c.dark }}>
                  {r.deviceModel}
                </p>
                <p className="text-xs mt-0.5 truncate" style={{ color: c.teal }}>
                  {r.symptoms}
                </p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.teal} strokeWidth="2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ))}
          {recent.length === 0 && (
            <div className="px-4 py-12 text-center" style={{ color: c.teal }}>
              <div className="text-3xl mb-2">📭</div>
              <p className="text-sm">ไม่มีงานซ่อมในระบบ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    submitted: { bg: "#FEF3C7", text: "#92400E", label: "แจ้งซ่อม" },
    received: { bg: "#DBEAFE", text: "#1E40AF", label: "รับเครื่องแล้ว" },
    diagnosing: { bg: "#E0E7FF", text: "#3730A3", label: "กำลังวินิจฉัย" },
    quoted: { bg: "#FEF3C7", text: "#92400E", label: "เสนอราคาแล้ว" },
    confirmed: { bg: "#D1FAE5", text: "#065F46", label: "ลูกค้ายืนยัน" },
    repairing: { bg: "#DBEAFE", text: "#1E40AF", label: "กำลังซ่อม" },
    qc: { bg: "#EDE9FE", text: "#5B21B6", label: "ตรวจสอบ" },
    done: { bg: "#D1FAE5", text: "#065F46", label: "เสร็จแล้ว" },
    shipped: { bg: "#CFFAFE", text: "#155E75", label: "จัดส่งแล้ว" },
    returned: { bg: "#F3F4F6", text: "#374151", label: "รับคืนแล้ว" },
    cancelled: { bg: "#FEE2E2", text: "#991B1B", label: "ยกเลิก" },
  };
  const c = config[status] || { bg: "#F3F4F6", text: "#374151", label: repairStatusText(status) };
  return (
    <span
      className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: c.bg, color: c.text }}
    >
      {c.label}
    </span>
  );
}
