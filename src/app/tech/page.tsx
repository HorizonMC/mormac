import { redirect } from "next/navigation";
import { getTechSession } from "@/lib/tech-auth";
import { db } from "@/lib/db-client";
import { repairStatusText } from "@/lib/line";
import { getBrand } from "@/lib/brand";
import Link from "next/link";

export const dynamic = "force-dynamic";

const deviceEmoji: Record<string, string> = {
  iphone: "📱",
  ipad: "📟",
  mac: "💻",
  macbook: "💻",
  watch: "⌚",
  airpods: "🎧",
};

function getDeviceEmoji(deviceType: string): string {
  const key = (deviceType || "").toLowerCase();
  for (const [k, v] of Object.entries(deviceEmoji)) {
    if (key.includes(k)) return v;
  }
  return "🔧";
}

function statusBadgeColor(status: string): { bg: string; text: string } {
  if (["done", "shipped", "returned"].includes(status)) return { bg: "#DCFCE7", text: "#166534" };
  if (["repairing", "qc", "confirmed"].includes(status)) return { bg: "#DBEAFE", text: "#1E40AF" };
  if (["quoted"].includes(status)) return { bg: "#FEF3C7", text: "#92400E" };
  if (["cancelled"].includes(status)) return { bg: "#FEE2E2", text: "#991B1B" };
  return { bg: "#F3F4F6", text: "#374151" };
}

export default async function TechDashboard() {
  const session = await getTechSession();
  if (!session) redirect("/tech/login");

  const brand = await getBrand();
  const c = brand.colors;

  let repairs: Awaited<ReturnType<typeof db.tech.repairs>> = [];
  try {
    repairs = await db.tech.repairs(session.staffId);
  } catch {
    // API might be down
  }

  const pending = repairs.filter((r) => ["submitted", "received", "diagnosing", "quoted"].includes(r.status));
  const working = repairs.filter((r) => ["confirmed", "repairing", "qc"].includes(r.status));
  const done = repairs.filter((r) => ["done", "shipped", "returned"].includes(r.status));

  const sorted = [...repairs].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div>
      <h1 className="text-xl font-bold mb-4" style={{ color: c.dark }}>งานของฉัน</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <SummaryCard label="รอดำเนินการ" count={pending.length} bg="#FEF3C7" text="#92400E" accent={c.accent} />
        <SummaryCard label="กำลังซ่อม" count={working.length} bg="#DBEAFE" text="#1E40AF" accent={c.accent} />
        <SummaryCard label="เสร็จแล้ว" count={done.length} bg="#DCFCE7" text="#166534" accent={c.accent} />
      </div>

      {/* Repair cards */}
      {sorted.length === 0 ? (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8 text-center">
          <p className="text-4xl mb-3">🔧</p>
          <p className="text-gray-400">ยังไม่มีงานที่มอบหมาย</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((r) => {
            const badge = statusBadgeColor(r.status);
            return (
              <Link
                key={r.id}
                href={`/tech/repairs/${r.id}`}
                className="block rounded-2xl bg-white border border-gray-100 shadow-sm p-4 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getDeviceEmoji(r.deviceType)}</span>
                    <div>
                      <p className="font-mono font-bold text-sm" style={{ color: c.dark }}>{r.repairCode}</p>
                      <p className="text-sm text-gray-600">{r.deviceModel}</p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
                    style={{ background: badge.bg, color: badge.text }}
                  >
                    {repairStatusText(r.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-2">{r.symptoms}</p>
                <p className="text-xs text-gray-400">
                  {new Date(r.createdAt).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  count,
  bg,
  text,
}: {
  label: string;
  count: number;
  bg: string;
  text: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: bg }}>
      <p className="text-2xl font-bold" style={{ color: text }}>{count}</p>
      <p className="text-xs font-medium mt-1" style={{ color: text }}>{label}</p>
    </div>
  );
}
