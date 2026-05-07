import Link from "next/link";
import { db } from "@/lib/db-client";
import { getBrand } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default async function TechPerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period = "month" } = await searchParams;
  const [brand, report] = await Promise.all([getBrand(), db.reports.techPerformance(period)]);
  const c = brand.colors;
  const topRevenue = Math.max(...report.techs.map((tech) => tech.revenue), 1);
  const avgDays = report.techs.length
    ? report.techs.reduce((sum, tech) => sum + tech.avgRepairDays, 0) / report.techs.length
    : 0;
  const totalRevenue = report.techs.reduce((sum, tech) => sum + tech.revenue, 0);
  const totalClaims = report.techs.reduce((sum, tech) => sum + tech.warrantyClaims, 0);

  return (
    <div style={{ background: c.bg }} className="min-h-screen -m-4 p-4 sm:-m-6 sm:p-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/reports" className="text-xs font-bold" style={{ color: c.teal }}>
            กลับไปรายงาน
          </Link>
          <h1 className="mt-2 text-2xl font-black tracking-tight" style={{ color: c.dark }}>
            Tech Performance
          </h1>
          <p className="text-sm mt-0.5" style={{ color: c.teal }}>
            เวลาซ่อมเฉลี่ย อัตราเคลม รายได้ และคะแนนของช่าง
          </p>
        </div>
        <div className="flex gap-1 rounded-2xl p-1" style={{ background: `${c.dark}08`, border: `1px solid ${c.dark}10` }}>
          {[
            { key: "week", label: "สัปดาห์" },
            { key: "month", label: "เดือน" },
            { key: "year", label: "ปี" },
            { key: "all", label: "ทั้งหมด" },
          ].map((item) => (
            <Link
              key={item.key}
              href={`/admin/reports/tech-performance?period=${item.key}`}
              className="px-4 py-2 text-xs font-bold rounded-xl transition-all"
              style={period === item.key ? { background: c.dark, color: "#fff" } : { color: c.teal }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard label="ช่างที่มีผลงาน" value={String(report.techs.length)} dark={c.dark} teal={c.teal} />
        <KPICard label="รายได้จากช่าง" value={`฿${fmt(totalRevenue)}`} dark={c.dark} teal={c.teal} />
        <KPICard label="เวลาซ่อมเฉลี่ย" value={`${avgDays.toFixed(1)} วัน`} dark={c.dark} teal={c.teal} />
        <KPICard label="เคลมประกัน" value={String(totalClaims)} dark={c.dark} teal={c.teal} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: `1px solid ${c.dark}08` }}>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left" style={{ color: c.teal, borderBottom: `1px solid ${c.dark}08` }}>
                <th className="px-5 py-3 font-bold">ช่าง</th>
                <th className="px-5 py-3 text-right font-bold">งานเสร็จ</th>
                <th className="px-5 py-3 text-right font-bold">เวลาซ่อมเฉลี่ย</th>
                <th className="px-5 py-3 text-right font-bold">เคลมซ้ำ</th>
                <th className="px-5 py-3 text-right font-bold">รายได้</th>
                <th className="px-5 py-3 text-right font-bold">คะแนน</th>
              </tr>
            </thead>
            <tbody>
              {report.techs.map((tech) => (
                <tr key={tech.techId} style={{ borderBottom: `1px solid ${c.dark}06` }}>
                  <td className="px-5 py-4 font-bold" style={{ color: c.dark }}>{tech.name}</td>
                  <td className="px-5 py-4 text-right" style={{ color: c.dark }}>{tech.jobs}</td>
                  <td className="px-5 py-4 text-right" style={{ color: c.dark }}>{tech.avgRepairDays} วัน</td>
                  <td className="px-5 py-4 text-right font-bold" style={{ color: tech.warrantyClaims > 0 ? "#EF4444" : c.teal }}>{tech.warrantyClaims}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <div className="h-2 w-24 rounded-full" style={{ background: `${c.dark}08` }}>
                        <div className="h-2 rounded-full" style={{ width: `${Math.max(5, (tech.revenue / topRevenue) * 100)}%`, background: c.accent }} />
                      </div>
                      <span className="font-black" style={{ color: c.dark }}>฿{fmt(tech.revenue)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right" style={{ color: c.dark }}>
                    {tech.avgRating ? `${tech.avgRating} / 5 (${tech.ratingCount})` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y" style={{ borderColor: `${c.dark}06` }}>
          {report.techs.map((tech) => (
            <div key={tech.techId} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black" style={{ color: c.dark }}>{tech.name}</p>
                  <p className="text-xs mt-1" style={{ color: c.teal }}>{tech.jobs} งาน | {tech.avgRepairDays} วันเฉลี่ย</p>
                </div>
                <p className="font-black" style={{ color: c.accent }}>฿{fmt(tech.revenue)}</p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <Metric label="เคลมซ้ำ" value={String(tech.warrantyClaims)} color={tech.warrantyClaims > 0 ? "#EF4444" : c.dark} />
                <Metric label="คะแนน" value={tech.avgRating ? `${tech.avgRating} / 5` : "—"} color={c.dark} />
              </div>
            </div>
          ))}
        </div>

        {report.techs.length === 0 && (
          <div className="px-5 py-16 text-center" style={{ color: c.teal }}>
            ยังไม่มีข้อมูลงานที่เสร็จแล้วในช่วงเวลานี้
          </div>
        )}
      </div>
    </div>
  );
}

function KPICard({ label, value, dark, teal }: { label: string; value: string; dark: string; teal: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm" style={{ border: `1px solid ${dark}08` }}>
      <p className="text-xs font-bold" style={{ color: teal }}>{label}</p>
      <p className="text-2xl font-black mt-1" style={{ color: dark }}>{value}</p>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: "#F8FAFC" }}>
      <p className="text-[11px] font-bold text-slate-500">{label}</p>
      <p className="mt-1 font-black" style={{ color }}>{value}</p>
    </div>
  );
}

function fmt(value: number): string {
  return Math.round(value).toLocaleString();
}
