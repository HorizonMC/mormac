import Link from "next/link";
import { db } from "@/lib/db-client";
import { getBrand } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default async function FailurePatternsPage({
  searchParams,
}: {
  searchParams: Promise<{ shopId?: string }>;
}) {
  const { shopId } = await searchParams;
  const [brand, report] = await Promise.all([getBrand(), db.reports.failurePatterns(shopId)]);
  const c = brand.colors;
  const topModelCount = Math.max(...report.topModels.map((item) => item.count), 1);
  const topSymptomCount = Math.max(...report.topSymptoms.map((item) => item.count), 1);

  return (
    <div style={{ background: c.bg }} className="min-h-screen -m-4 p-4 sm:-m-6 sm:p-6">
      <div className="mb-8">
        <Link href="/admin/reports" className="text-xs font-bold" style={{ color: c.teal }}>กลับไปรายงาน</Link>
        <h1 className="mt-2 text-2xl font-black tracking-tight" style={{ color: c.dark }}>Device Failure Patterns</h1>
        <p className="text-sm mt-0.5" style={{ color: c.teal }}>
          วิเคราะห์ {report.totalRepairs} งานซ่อม เพื่อดูรุ่นและอาการที่พบบ่อย
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Panel title="รุ่นที่เสียบ่อย" dark={c.dark} teal={c.teal}>
          <div className="space-y-3">
            {report.topModels.map((item) => (
              <div key={item.model}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-bold truncate" style={{ color: c.dark }}>{item.model}</p>
                    <p className="text-xs" style={{ color: c.teal }}>{item.topSymptom.label} ({item.topSymptom.count})</p>
                  </div>
                  <p className="font-black" style={{ color: c.dark }}>{item.count}</p>
                </div>
                <div className="mt-2 h-2 rounded-full" style={{ background: `${c.dark}08` }}>
                  <div className="h-2 rounded-full" style={{ width: `${Math.max(4, (item.count / topModelCount) * 100)}%`, background: c.accent }} />
                </div>
              </div>
            ))}
            {report.topModels.length === 0 && <p className="text-sm" style={{ color: c.teal }}>ยังไม่มีข้อมูล</p>}
          </div>
        </Panel>

        <Panel title="อาการที่พบบ่อย" dark={c.dark} teal={c.teal}>
          <div className="space-y-3">
            {report.topSymptoms.map((item) => (
              <div key={item.symptom}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-bold" style={{ color: c.dark }}>{item.symptom}</p>
                    <p className="text-xs" style={{ color: c.teal }}>พบบ่อยใน {item.topDeviceType.label}</p>
                  </div>
                  <p className="font-black" style={{ color: c.dark }}>{item.count}</p>
                </div>
                <div className="mt-2 h-2 rounded-full" style={{ background: `${c.dark}08` }}>
                  <div className="h-2 rounded-full" style={{ width: `${Math.max(4, (item.count / topSymptomCount) * 100)}%`, background: c.dark }} />
                </div>
              </div>
            ))}
            {report.topSymptoms.length === 0 && <p className="text-sm" style={{ color: c.teal }}>ยังไม่มีข้อมูล</p>}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
        <Panel title="Device Type vs Symptoms" dark={c.dark} teal={c.teal}>
          <div className="space-y-4">
            {report.matrix.map((row) => (
              <div key={row.deviceType} className="rounded-xl p-4" style={{ background: `${c.dark}05` }}>
                <p className="font-black text-sm capitalize" style={{ color: c.dark }}>{row.deviceType}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {row.symptoms.map((symptom) => (
                    <span key={symptom.symptom} className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: `${c.accent}18`, color: c.dark }}>
                      {symptom.symptom} {symptom.count}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="คำแนะนำสต็อกอะไหล่" dark={c.dark} teal={c.teal}>
          <div className="space-y-3">
            {report.stockSuggestions.map((item) => (
              <div key={item.symptom} className="rounded-xl p-4" style={{ background: `${c.dark}05` }}>
                <p className="font-bold" style={{ color: c.dark }}>{item.symptom}</p>
                <p className="text-xs mt-1" style={{ color: c.teal }}>Demand score: {item.demandScore}</p>
                <p className="text-sm mt-2" style={{ color: c.dark }}>{item.suggestion}</p>
              </div>
            ))}
            {report.stockSuggestions.length === 0 && <p className="text-sm" style={{ color: c.teal }}>ยังไม่มีคำแนะนำ</p>}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children, dark, teal }: { title: string; children: React.ReactNode; dark: string; teal: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5" style={{ border: `1px solid ${dark}08` }}>
      <h2 className="font-bold text-sm mb-4" style={{ color: dark }}>{title}</h2>
      <div style={{ color: teal }}>{children}</div>
    </div>
  );
}
