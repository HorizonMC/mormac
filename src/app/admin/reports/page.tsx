import { db } from "@/lib/db-client";
import { getBrand } from "@/lib/brand";
import { repairStatusText } from "@/lib/line";

export const dynamic = "force-dynamic";

interface ReportSummary {
  totalJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  activeJobs: number;
  totalRevenue: number;
  totalPartsCost: number;
  totalLaborCost: number;
  totalCost: number;
  totalProfit: number;
  avgTicket: number;
  avgTurnaroundDays: number;
  margin: number;
}

interface DeviceReport {
  type: string;
  count: number;
  revenue: number;
}

interface StatusReport {
  status: string;
  count: number;
}

interface PartReport {
  name: string;
  totalQty: number;
  totalCost: number;
}

interface TrendReport {
  month: string;
  jobs: number;
  revenue: number;
  cost: number;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period = "all" } = await searchParams;
  const [summary, byDevice, byStatus, topParts, trend, brand] = await Promise.all([
    db.reports.summary(period) as Promise<ReportSummary>,
    db.reports.byDevice() as Promise<DeviceReport[]>,
    db.reports.byStatus() as Promise<StatusReport[]>,
    db.reports.topParts() as Promise<PartReport[]>,
    db.reports.monthlyTrend() as Promise<TrendReport[]>,
    getBrand(),
  ]);
  const c = brand.colors;

  return (
    <div style={{ background: c.bg }} className="min-h-screen -m-4 p-4 sm:-m-6 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: c.dark }}>
            รายงาน
          </h1>
          <p className="text-sm mt-0.5" style={{ color: c.teal }}>
            ภาพรวมผลประกอบการและสถิติ
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Period pills */}
          <div className="flex gap-1 rounded-2xl p-1" style={{ background: `${c.dark}08`, border: `1px solid ${c.dark}10` }}>
            {[
              { key: "week", label: "สัปดาห์" },
              { key: "month", label: "เดือน" },
              { key: "year", label: "ปี" },
              { key: "all", label: "ทั้งหมด" },
            ].map((p) => (
              <a
                key={p.key}
                href={`/admin/reports?period=${p.key}`}
                className="px-4 py-2 text-xs font-bold rounded-xl transition-all"
                style={
                  period === p.key
                    ? { background: c.dark, color: "#fff" }
                    : { color: c.teal }
                }
              >
                {p.label}
              </a>
            ))}
          </div>
          <a
            href={`/api/reports/csv?period=${period}`}
            className="text-xs px-4 py-2.5 rounded-xl font-bold transition-all hover:opacity-90"
            style={{ background: c.accent, color: c.dark }}
          >
            ดาวน์โหลด CSV
          </a>
          <a
            href={`/admin/reports/tech-performance?period=${period}`}
            className="text-xs px-4 py-2.5 rounded-xl font-bold transition-all hover:opacity-90"
            style={{ background: c.dark, color: "#fff" }}
          >
            Tech Performance
          </a>
          <a
            href="/admin/reports/pnl"
            className="text-xs px-4 py-2.5 rounded-xl font-bold transition-all hover:opacity-90"
            style={{ background: `${c.dark}12`, color: c.dark }}
          >
            Monthly P&amp;L
          </a>
          <a
            href="/admin/reports/top-customers"
            className="text-xs px-4 py-2.5 rounded-xl font-bold transition-all hover:opacity-90"
            style={{ background: `${c.accent}18`, color: c.dark }}
          >
            Top Customers
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard
          label="รายได้"
          value={`฿${fmt(summary.totalRevenue)}`}
          dark={c.dark}
          teal={c.teal}
        />
        <KPICard
          label="กำไร"
          value={`฿${fmt(summary.totalProfit)}`}
          sub={`margin ${summary.margin}%`}
          valueColor={summary.totalProfit >= 0 ? c.accent : "#EF4444"}
          dark={c.dark}
          teal={c.teal}
        />
        <KPICard
          label="งานเสร็จ"
          value={String(summary.completedJobs)}
          sub={`จาก ${summary.totalJobs} งาน`}
          dark={c.dark}
          teal={c.teal}
        />
        <KPICard
          label="เฉลี่ย/ใบ"
          value={`฿${fmt(summary.avgTicket)}`}
          sub={`${summary.avgTurnaroundDays} วัน/งาน`}
          dark={c.dark}
          teal={c.teal}
        />
      </div>

      {/* Cost Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <MiniKPI label="ต้นทุนรวม" value={`฿${fmt(summary.totalCost)}`} color="#EF4444" dark={c.dark} teal={c.teal} />
        <MiniKPI label="ค่าอะไหล่" value={`฿${fmt(summary.totalPartsCost)}`} dark={c.dark} teal={c.teal} />
        <MiniKPI label="ค่าแรง" value={`฿${fmt(summary.totalLaborCost)}`} dark={c.dark} teal={c.teal} />
        <MiniKPI label="กำลังดำเนินการ" value={String(summary.activeJobs)} dark={c.dark} teal={c.teal} />
        <MiniKPI label="ยกเลิก" value={String(summary.cancelledJobs)} color={c.teal} dark={c.dark} teal={c.teal} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* By Status */}
        <div className="bg-white rounded-2xl shadow-sm p-5" style={{ border: `1px solid ${c.dark}08` }}>
          <p className="font-bold text-sm mb-4" style={{ color: c.dark }}>ตามสถานะ</p>
          <div className="space-y-1">
            {byStatus.map((s) => (
              <div key={s.status} className="flex items-center justify-between text-sm py-2">
                <span style={{ color: c.dark }}>{repairStatusText(s.status)}</span>
                <div className="flex items-center gap-3">
                  <div className="w-28 rounded-full h-2" style={{ background: `${c.dark}08` }}>
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (s.count / (summary.totalJobs || 1)) * 100)}%`,
                        background: c.dark,
                      }}
                    />
                  </div>
                  <span className="w-8 text-right font-bold text-xs" style={{ color: c.teal }}>{s.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Device */}
        <div className="bg-white rounded-2xl shadow-sm p-5" style={{ border: `1px solid ${c.dark}08` }}>
          <p className="font-bold text-sm mb-4" style={{ color: c.dark }}>ตามประเภทอุปกรณ์</p>
          <div className="space-y-1">
            {byDevice.map((d) => (
              <div key={d.type} className="flex items-center justify-between text-sm py-2">
                <span className="capitalize" style={{ color: c.dark }}>{deviceIcon(d.type)} {d.type}</span>
                <div className="text-right">
                  <span className="font-bold text-sm" style={{ color: c.dark }}>{d.count} งาน</span>
                  {d.revenue > 0 && (
                    <span className="text-xs ml-2" style={{ color: c.mint }}>฿{fmt(d.revenue)}</span>
                  )}
                </div>
              </div>
            ))}
            {byDevice.length === 0 && <p className="text-sm" style={{ color: c.teal }}>ยังไม่มีข้อมูล</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Parts */}
        <div className="bg-white rounded-2xl shadow-sm p-5" style={{ border: `1px solid ${c.dark}08` }}>
          <p className="font-bold text-sm mb-4" style={{ color: c.dark }}>อะไหล่ที่ใช้บ่อย</p>
          <div className="space-y-1">
            {topParts.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-2" style={{ borderBottom: `1px solid ${c.dark}06` }}>
                <span style={{ color: c.dark }}>{p.name}</span>
                <div className="text-right">
                  <span className="font-bold" style={{ color: c.dark }}>{p.totalQty} ชิ้น</span>
                  <span className="text-xs ml-2" style={{ color: c.mint }}>฿{fmt(p.totalCost)}</span>
                </div>
              </div>
            ))}
            {topParts.length === 0 && <p className="text-sm" style={{ color: c.teal }}>ยังไม่มีข้อมูล</p>}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-2xl shadow-sm p-5" style={{ border: `1px solid ${c.dark}08` }}>
          <p className="font-bold text-sm mb-4" style={{ color: c.dark }}>แนวโน้มรายเดือน</p>
          {trend.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs" style={{ color: c.teal }}>
                    <th className="pb-3 text-left font-bold">เดือน</th>
                    <th className="pb-3 text-right font-bold">งาน</th>
                    <th className="pb-3 text-right font-bold">รายได้</th>
                    <th className="pb-3 text-right font-bold">ต้นทุน</th>
                    <th className="pb-3 text-right font-bold">กำไร</th>
                  </tr>
                </thead>
                <tbody>
                  {trend.map((t) => (
                    <tr key={t.month} style={{ borderBottom: `1px solid ${c.dark}06` }}>
                      <td className="py-2.5 font-mono text-xs" style={{ color: c.dark }}>{t.month}</td>
                      <td className="py-2.5 text-right" style={{ color: c.dark }}>{t.jobs}</td>
                      <td className="py-2.5 text-right font-medium" style={{ color: c.dark }}>฿{fmt(t.revenue)}</td>
                      <td className="py-2.5 text-right text-red-500">฿{fmt(t.cost)}</td>
                      <td className="py-2.5 text-right font-bold" style={{ color: t.revenue - t.cost >= 0 ? c.accent : "#EF4444" }}>
                        ฿{fmt(t.revenue - t.cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm" style={{ color: c.teal }}>ยังไม่มีข้อมูล</p>
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

function KPICard({
  label,
  value,
  sub,
  valueColor,
  dark,
  teal,
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
  dark: string;
  teal: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5" style={{ border: `1px solid ${dark}08` }}>
      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: teal }}>{label}</p>
      <p className="text-3xl font-black" style={{ color: valueColor || dark }}>{value}</p>
      {sub && <p className="text-xs mt-1.5" style={{ color: teal }}>{sub}</p>}
    </div>
  );
}

function MiniKPI({
  label,
  value,
  color,
  dark,
  teal,
}: {
  label: string;
  value: string;
  color?: string;
  dark: string;
  teal: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4" style={{ border: `1px solid ${dark}08` }}>
      <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: teal }}>{label}</p>
      <p className="text-lg font-black" style={{ color: color || dark }}>{value}</p>
    </div>
  );
}
