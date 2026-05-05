import { db } from "@/lib/db-client";
import { repairStatusText } from "@/lib/line";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period = "all" } = await searchParams;
  const [summary, byDevice, byStatus, topParts, trend] = await Promise.all([
    db.reports.summary(period),
    db.reports.byDevice(),
    db.reports.byStatus(),
    db.reports.topParts(),
    db.reports.monthlyTrend(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">รายงาน</h1>
        <div className="flex gap-1 bg-white rounded-lg border border-gray-200 p-1">
          {[
            { key: "week", label: "สัปดาห์" },
            { key: "month", label: "เดือน" },
            { key: "year", label: "ปี" },
            { key: "all", label: "ทั้งหมด" },
          ].map((p) => (
            <a
              key={p.key}
              href={`/admin/reports?period=${p.key}`}
              className={`px-3 py-1.5 text-xs rounded-md transition ${
                period === p.key
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {p.label}
            </a>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPI label="รายได้" value={`฿${fmt(summary.totalRevenue)}`} />
        <KPI label="กำไร" value={`฿${fmt(summary.totalProfit)}`} sub={`margin ${summary.margin}%`} accent={summary.totalProfit >= 0} />
        <KPI label="งานเสร็จ" value={summary.completedJobs} sub={`จาก ${summary.totalJobs} งาน`} />
        <KPI label="เฉลี่ย/ใบ" value={`฿${fmt(summary.avgTicket)}`} sub={`${summary.avgTurnaroundDays} วัน/งาน`} />
      </div>

      {/* Cost Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <MiniKPI label="ต้นทุนรวม" value={`฿${fmt(summary.totalCost)}`} color="text-red-600" />
        <MiniKPI label="ค่าอะไหล่" value={`฿${fmt(summary.totalPartsCost)}`} />
        <MiniKPI label="ค่าแรง" value={`฿${fmt(summary.totalLaborCost)}`} />
        <MiniKPI label="กำลังดำเนินการ" value={summary.activeJobs} />
        <MiniKPI label="ยกเลิก" value={summary.cancelledJobs} color="text-gray-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* By Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="font-bold text-sm mb-3">ตามสถานะ</p>
          {byStatus.map((s: any) => (
            <div key={s.status} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50">
              <span>{repairStatusText(s.status)}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-gray-800 h-2 rounded-full"
                    style={{ width: `${Math.min(100, (s.count / (summary.totalJobs || 1)) * 100)}%` }}
                  />
                </div>
                <span className="text-gray-500 w-8 text-right">{s.count}</span>
              </div>
            </div>
          ))}
        </div>

        {/* By Device */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="font-bold text-sm mb-3">ตามประเภทอุปกรณ์</p>
          {byDevice.map((d: any) => (
            <div key={d.type} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50">
              <span className="capitalize">{deviceIcon(d.type)} {d.type}</span>
              <div className="text-right">
                <span className="font-medium">{d.count} งาน</span>
                {d.revenue > 0 && <span className="text-gray-400 text-xs ml-2">฿{fmt(d.revenue)}</span>}
              </div>
            </div>
          ))}
          {byDevice.length === 0 && <p className="text-sm text-gray-400">ยังไม่มีข้อมูล</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Parts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="font-bold text-sm mb-3">อะไหล่ที่ใช้บ่อย</p>
          {topParts.map((p: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50">
              <span>{p.name}</span>
              <div className="text-right">
                <span className="font-medium">{p.totalQty} ชิ้น</span>
                <span className="text-gray-400 text-xs ml-2">฿{fmt(p.totalCost)}</span>
              </div>
            </div>
          ))}
          {topParts.length === 0 && <p className="text-sm text-gray-400">ยังไม่มีข้อมูล</p>}
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="font-bold text-sm mb-3">แนวโน้มรายเดือน</p>
          {trend.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs">
                  <th className="pb-2">เดือน</th>
                  <th className="pb-2 text-right">งาน</th>
                  <th className="pb-2 text-right">รายได้</th>
                  <th className="pb-2 text-right">ต้นทุน</th>
                  <th className="pb-2 text-right">กำไร</th>
                </tr>
              </thead>
              <tbody>
                {trend.map((t: any) => (
                  <tr key={t.month} className="border-b border-gray-50">
                    <td className="py-1.5 font-mono text-xs">{t.month}</td>
                    <td className="py-1.5 text-right">{t.jobs}</td>
                    <td className="py-1.5 text-right">฿{fmt(t.revenue)}</td>
                    <td className="py-1.5 text-right text-red-500">฿{fmt(t.cost)}</td>
                    <td className={`py-1.5 text-right font-medium ${t.revenue - t.cost >= 0 ? "text-green-600" : "text-red-600"}`}>
                      ฿{fmt(t.revenue - t.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-400">ยังไม่มีข้อมูล</p>
          )}
        </div>
      </div>
    </div>
  );
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString();
}

function deviceIcon(type: string): string {
  const icons: Record<string, string> = {
    iphone: "📱", ipad: "📱", macbook: "💻", imac: "🖥️",
    "apple watch": "⌚", airpods: "🎧", mac: "💻",
  };
  return icons[type.toLowerCase()] || "📟";
}

function KPI({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${accent === false ? "text-red-600" : accent === true ? "text-green-600" : ""}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function MiniKPI({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-bold ${color || ""}`}>{value}</p>
    </div>
  );
}
