import Link from "next/link";
import { db } from "@/lib/db-client";
import { getBrand } from "@/lib/brand";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

export default async function MonthlyPnlPage({
  searchParams,
}: {
  searchParams: Promise<{ shopId?: string }>;
}) {
  const { shopId } = await searchParams;
  const [brand, report] = await Promise.all([getBrand(), db.reports.pnl(shopId)]);
  const c = brand.colors;
  const maxValue = Math.max(...report.months.map((month) => Math.max(month.revenue, month.cogs + month.labor)), 1);
  const grossMargin = report.current.revenue > 0
    ? Math.round((report.current.grossProfit / report.current.revenue) * 100)
    : 0;

  return (
    <div style={{ background: c.bg }} className="min-h-screen -m-4 p-4 sm:-m-6 sm:p-6 print:m-0 print:bg-white print:p-0">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/reports" className="text-xs font-bold print:hidden" style={{ color: c.teal }}>
            กลับไปรายงาน
          </Link>
          <h1 className="mt-2 text-2xl font-black tracking-tight" style={{ color: c.dark }}>
            Monthly P&amp;L
          </h1>
          <p className="text-sm mt-0.5" style={{ color: c.teal }}>
            Revenue, COGS, Labor และ Gross Profit ย้อนหลัง 12 เดือน
          </p>
        </div>
        <PrintButton dark={c.dark} accent={c.accent} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard label="Revenue เดือนนี้" value={`฿${fmt(report.current.revenue)}`} sub={mom(report.momRevenuePct)} dark={c.dark} teal={c.teal} accent={c.accent} />
        <KPICard label="COGS (Parts)" value={`฿${fmt(report.current.cogs)}`} dark={c.dark} teal={c.teal} />
        <KPICard label="Labor" value={`฿${fmt(report.current.labor)}`} dark={c.dark} teal={c.teal} />
        <KPICard label="Gross Profit" value={`฿${fmt(report.current.grossProfit)}`} sub={`${grossMargin}% margin | ${mom(report.momProfitPct)}`} dark={c.dark} teal={c.teal} accent={report.current.grossProfit >= 0 ? c.accent : "#EF4444"} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <MiniKPI label="12M Revenue" value={`฿${fmt(report.totals.revenue)}`} dark={c.dark} teal={c.teal} />
        <MiniKPI label="12M COGS" value={`฿${fmt(report.totals.cogs)}`} dark={c.dark} teal={c.teal} />
        <MiniKPI label="12M Labor" value={`฿${fmt(report.totals.labor)}`} dark={c.dark} teal={c.teal} />
        <MiniKPI label="12M Gross Profit" value={`฿${fmt(report.totals.grossProfit)}`} color={report.totals.grossProfit >= 0 ? c.accent : "#EF4444"} dark={c.dark} teal={c.teal} />
        <MiniKPI label="12M Jobs" value={String(report.totals.jobs)} dark={c.dark} teal={c.teal} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 print:shadow-none" style={{ border: `1px solid ${c.dark}08` }}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="font-bold text-sm" style={{ color: c.dark }}>Revenue vs Cost Trend</p>
            <p className="text-xs mt-0.5" style={{ color: c.teal }}>รายได้เทียบต้นทุนอะไหล่และค่าแรง</p>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs font-bold" style={{ color: c.teal }}>
            <span><i className="inline-block h-2 w-2 rounded-full mr-1" style={{ background: c.accent }} /> Revenue</span>
            <span><i className="inline-block h-2 w-2 rounded-full mr-1" style={{ background: c.dark }} /> Cost</span>
          </div>
        </div>

        <div className="h-72 flex items-end gap-3 overflow-x-auto pb-2">
          {report.months.map((month) => {
            const cost = month.cogs + month.labor;
            return (
              <div key={month.month} className="min-w-16 flex-1 flex flex-col items-center justify-end gap-2">
                <div className="h-56 w-full flex items-end justify-center gap-1">
                  <div
                    className="w-5 rounded-t"
                    title={`Revenue ฿${fmt(month.revenue)}`}
                    style={{ height: `${Math.max(2, (month.revenue / maxValue) * 100)}%`, background: c.accent }}
                  />
                  <div
                    className="w-5 rounded-t"
                    title={`Cost ฿${fmt(cost)}`}
                    style={{ height: `${Math.max(2, (cost / maxValue) * 100)}%`, background: c.dark }}
                  />
                </div>
                <div className="text-center">
                  <p className="font-mono text-[11px] font-bold" style={{ color: c.dark }}>{month.month.slice(5)}</p>
                  <p className="text-[10px]" style={{ color: month.grossProfit >= 0 ? c.teal : "#EF4444" }}>฿{fmt(month.grossProfit)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden print:shadow-none" style={{ border: `1px solid ${c.dark}08` }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs" style={{ color: c.teal, borderBottom: `1px solid ${c.dark}08` }}>
              <th className="px-4 py-3 text-left font-bold">เดือน</th>
              <th className="px-4 py-3 text-right font-bold">Jobs</th>
              <th className="px-4 py-3 text-right font-bold">Revenue</th>
              <th className="px-4 py-3 text-right font-bold">COGS</th>
              <th className="px-4 py-3 text-right font-bold">Labor</th>
              <th className="px-4 py-3 text-right font-bold">Gross Profit</th>
            </tr>
          </thead>
          <tbody>
            {report.months.map((month) => (
              <tr key={month.month} style={{ borderBottom: `1px solid ${c.dark}06` }}>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: c.dark }}>{month.month}</td>
                <td className="px-4 py-3 text-right" style={{ color: c.dark }}>{month.jobs}</td>
                <td className="px-4 py-3 text-right font-medium" style={{ color: c.dark }}>฿{fmt(month.revenue)}</td>
                <td className="px-4 py-3 text-right" style={{ color: c.teal }}>฿{fmt(month.cogs)}</td>
                <td className="px-4 py-3 text-right" style={{ color: c.teal }}>฿{fmt(month.labor)}</td>
                <td className="px-4 py-3 text-right font-black" style={{ color: month.grossProfit >= 0 ? c.accent : "#EF4444" }}>
                  ฿{fmt(month.grossProfit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KPICard({ label, value, sub, dark, teal, accent }: { label: string; value: string; sub?: string; dark: string; teal: string; accent?: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm print:shadow-none" style={{ border: `1px solid ${dark}08` }}>
      <p className="text-xs font-bold" style={{ color: teal }}>{label}</p>
      <p className="text-2xl font-black mt-1" style={{ color: accent || dark }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: teal }}>{sub}</p>}
    </div>
  );
}

function MiniKPI({ label, value, dark, teal, color }: { label: string; value: string; dark: string; teal: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm print:shadow-none" style={{ border: `1px solid ${dark}08` }}>
      <p className="text-[11px] font-bold" style={{ color: teal }}>{label}</p>
      <p className="text-lg font-black mt-1" style={{ color: color || dark }}>{value}</p>
    </div>
  );
}

function fmt(value: number): string {
  return Math.round(value).toLocaleString();
}

function mom(value: number | null): string {
  if (value === null) return "MoM: n/a";
  if (value === 0) return "MoM: 0%";
  return `MoM: ${value > 0 ? "+" : ""}${value}%`;
}
