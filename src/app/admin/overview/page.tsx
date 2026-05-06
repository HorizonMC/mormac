import { db } from "@/lib/db-client";
import { getBrand } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const brand = await getBrand();
  const c = brand.colors;
  const stats = await db.stats();

  const kpis = [
    { label: "งานทั้งหมด", value: stats.totalRepairs, icon: "📋", iconBg: `${c.accent}15` },
    { label: "กำลังดำเนินการ", value: stats.activeRepairs, icon: "🔧", iconBg: "#3B82F615" },
    { label: "เสร็จสิ้น", value: stats.completedRepairs, icon: "✅", iconBg: "#10B98115" },
    { label: "เครื่องในสต็อค", value: stats.totalDevices, icon: "📱", iconBg: "#8B5CF615" },
    { label: "พร้อมขาย", value: stats.readyDevices, icon: "🏷️", iconBg: "#F5920015" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black" style={{ color: c.dark }}>
          ภาพรวม
        </h1>
        <p className="text-sm mt-1" style={{ color: c.teal }}>
          สถิติร้านซ่อมทั้งหมด
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-8">
        {kpis.map((kpi, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg mb-3"
              style={{ background: kpi.iconBg }}
            >
              {kpi.icon}
            </div>
            <p className="text-2xl md:text-3xl font-black" style={{ color: c.dark }}>
              {kpi.value}
            </p>
            <p className="text-xs mt-0.5" style={{ color: c.teal }}>
              {kpi.label}
            </p>
          </div>
        ))}
      </div>

      {/* Two-column panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Repairs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div
            className="px-5 py-4 border-b flex items-center justify-between"
            style={{ borderColor: `${c.dark}08` }}
          >
            <div>
              <h2 className="font-bold text-sm" style={{ color: c.dark }}>
                งานซ่อมล่าสุด
              </h2>
              <p className="text-[11px] mt-0.5" style={{ color: c.teal }}>
                รายการล่าสุด 10 รายการ
              </p>
            </div>
            <span className="text-lg">🔧</span>
          </div>
          <div className="divide-y" style={{ borderColor: `${c.dark}04` }}>
            {(stats.recentRepairs?.length ?? 0) > 0 ? (
              stats.recentRepairs?.map((r: any) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-5 py-3.5 transition hover:bg-gray-50/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold" style={{ color: c.accent }}>
                        {r.repairCode}
                      </span>
                    </div>
                    <p className="text-sm font-medium mt-0.5 truncate" style={{ color: c.dark }}>
                      {r.deviceModel}
                    </p>
                  </div>
                  <StatusPill status={r.status} />
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center">
                <div className="text-2xl mb-1">📭</div>
                <p className="text-sm" style={{ color: c.teal }}>ยังไม่มีงาน</p>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Parts */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div
            className="px-5 py-4 border-b flex items-center justify-between"
            style={{ borderColor: `${c.dark}08` }}
          >
            <div>
              <h2 className="font-bold text-sm" style={{ color: c.dark }}>
                อะไหล่ใกล้หมด
              </h2>
              <p className="text-[11px] mt-0.5" style={{ color: c.teal }}>
                สต็อคต่ำกว่าเกณฑ์
              </p>
            </div>
            <span className="text-lg">📦</span>
          </div>
          <div className="divide-y" style={{ borderColor: `${c.dark}04` }}>
            {(stats.lowStockParts?.length ?? 0) > 0 ? (
              stats.lowStockParts?.map((p: any) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-5 py-3.5 transition hover:bg-gray-50/50"
                >
                  <span className="text-sm font-medium truncate" style={{ color: c.dark }}>
                    {p.name}
                  </span>
                  <span
                    className="text-xs font-black px-2.5 py-1 rounded-full shrink-0"
                    style={
                      p.quantity === 0
                        ? { background: "#FEE2E2", color: "#991B1B" }
                        : { background: "#FEF3C7", color: "#92400E" }
                    }
                  >
                    {p.quantity} ชิ้น
                  </span>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center">
                <div className="text-2xl mb-1">✅</div>
                <p className="text-sm" style={{ color: c.teal }}>สต็อคปกติ</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    submitted: { bg: "#FEF3C7", text: "#92400E" },
    received: { bg: "#DBEAFE", text: "#1E40AF" },
    diagnosing: { bg: "#E0E7FF", text: "#3730A3" },
    quoted: { bg: "#FEF3C7", text: "#92400E" },
    confirmed: { bg: "#D1FAE5", text: "#065F46" },
    repairing: { bg: "#DBEAFE", text: "#1E40AF" },
    qc: { bg: "#EDE9FE", text: "#5B21B6" },
    done: { bg: "#D1FAE5", text: "#065F46" },
    shipped: { bg: "#CFFAFE", text: "#155E75" },
    returned: { bg: "#F3F4F6", text: "#374151" },
    cancelled: { bg: "#FEE2E2", text: "#991B1B" },
  };
  const c = config[status] || { bg: "#F3F4F6", text: "#374151" };
  return (
    <span
      className="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap shrink-0"
      style={{ background: c.bg, color: c.text }}
    >
      {status}
    </span>
  );
}
