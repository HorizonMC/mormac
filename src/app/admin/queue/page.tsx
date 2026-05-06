import { db } from "@/lib/db-client";
import { repairStatusText } from "@/lib/line";
import { getBrand } from "@/lib/brand";
import Link from "next/link";

export const dynamic = "force-dynamic";

const statusGroups = [
  { key: "all", label: "ทั้งหมด", icon: "📋" },
  { key: "pending", label: "รอดำเนินการ", icon: "⏳" },
  { key: "working", label: "กำลังซ่อม", icon: "🔧" },
  { key: "done", label: "เสร็จ/รอส่ง", icon: "✅" },
];

const deviceEmojis: Record<string, string> = {
  iphone: "📱",
  ipad: "📋",
  macbook: "💻",
  mac: "💻",
  watch: "⌚",
  airpods: "🎧",
};

function getDeviceEmoji(model: string): string {
  const lower = model?.toLowerCase() || "";
  for (const [key, emoji] of Object.entries(deviceEmojis)) {
    if (lower.includes(key)) return emoji;
  }
  return "📱";
}

export default async function QueuePage() {
  const brand = await getBrand();
  const c = brand.colors;
  const repairs = await db.repairs.list();
  const active = repairs.filter((r: any) => !["returned", "cancelled"].includes(r.status));

  const byStatus = {
    pending: active.filter((r: any) => ["submitted", "received", "diagnosing", "quoted"].includes(r.status)),
    working: active.filter((r: any) => ["confirmed", "repairing", "qc"].includes(r.status)),
    done: active.filter((r: any) => ["done", "shipped"].includes(r.status)),
  };

  const statusBadgeConfig: Record<string, { bg: string; text: string }> = {
    submitted: { bg: "#FEF3C7", text: "#92400E" },
    received: { bg: "#DBEAFE", text: "#1E40AF" },
    diagnosing: { bg: "#E0E7FF", text: "#3730A3" },
    quoted: { bg: "#FEF3C7", text: "#92400E" },
    confirmed: { bg: "#D1FAE5", text: "#065F46" },
    repairing: { bg: "#DBEAFE", text: "#1E40AF" },
    qc: { bg: "#EDE9FE", text: "#5B21B6" },
    done: { bg: "#D1FAE5", text: "#065F46" },
    shipped: { bg: "#CFFAFE", text: "#155E75" },
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black" style={{ color: c.dark }}>
          คิวงานซ่อม
        </h1>
        <p className="text-sm mt-1" style={{ color: c.teal }}>
          {active.length} งานที่ยังดำเนินการ
        </p>
      </div>

      {/* Status Filter Tabs (Pill Style) */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statusGroups.map((group) => {
          const count = group.key === "all" ? active.length : byStatus[group.key as keyof typeof byStatus]?.length || 0;
          return (
            <div
              key={group.key}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border-2 transition"
              style={
                group.key === "all"
                  ? { background: c.dark, color: "white", borderColor: c.dark }
                  : { background: "white", color: c.dark, borderColor: `${c.dark}12` }
              }
            >
              <span className="text-sm">{group.icon}</span>
              {group.label}
              <span
                className="text-[11px] font-black px-1.5 py-0.5 rounded-full ml-0.5"
                style={
                  group.key === "all"
                    ? { background: `${c.accent}30`, color: c.accent }
                    : { background: `${c.dark}08`, color: c.teal }
                }
              >
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className="rounded-2xl p-4 md:p-5 border-2" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
          <p className="text-xs font-medium" style={{ color: "#92400E" }}>รอดำเนินการ</p>
          <p className="text-2xl md:text-3xl font-black mt-1" style={{ color: "#78350F" }}>
            {byStatus.pending.length}
          </p>
        </div>
        <div className="rounded-2xl p-4 md:p-5 border-2" style={{ background: "#EFF6FF", borderColor: "#93C5FD" }}>
          <p className="text-xs font-medium" style={{ color: "#1E40AF" }}>กำลังซ่อม</p>
          <p className="text-2xl md:text-3xl font-black mt-1" style={{ color: "#1E3A8A" }}>
            {byStatus.working.length}
          </p>
        </div>
        <div className="rounded-2xl p-4 md:p-5 border-2" style={{ background: "#ECFDF5", borderColor: "#6EE7B7" }}>
          <p className="text-xs font-medium" style={{ color: "#065F46" }}>เสร็จ/รอส่ง</p>
          <p className="text-2xl md:text-3xl font-black mt-1" style={{ color: "#064E3B" }}>
            {byStatus.done.length}
          </p>
        </div>
      </div>

      {/* Repair Cards */}
      <div className="space-y-3">
        {active.map((r: any) => {
          const badge = statusBadgeConfig[r.status] || { bg: "#F3F4F6", text: "#374151" };
          return (
            <Link
              key={r.id}
              href={`/admin/repairs/${r.id}`}
              className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5 transition hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* Device Emoji */}
                  <div
                    className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: `${c.dark}06` }}
                  >
                    {getDeviceEmoji(r.deviceModel)}
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Code + Status */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold" style={{ color: c.accent }}>
                        {r.repairCode}
                      </span>
                      <span
                        className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{ background: badge.bg, color: badge.text }}
                      >
                        {repairStatusText(r.status)}
                      </span>
                    </div>

                    {/* Device Model */}
                    <p className="text-sm font-bold mt-1 truncate" style={{ color: c.dark }}>
                      {r.deviceModel}
                    </p>

                    {/* Symptoms */}
                    {r.symptoms && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: c.teal }}>
                        {r.symptoms}
                      </p>
                    )}

                    {/* Bottom row: customer + tech + date */}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {r.customer?.name && (
                        <span className="text-[11px] font-medium" style={{ color: c.teal }}>
                          👤 {r.customer.name}
                        </span>
                      )}
                      {r.tech?.user?.name && (
                        <span className="text-[11px] font-medium" style={{ color: c.teal }}>
                          🔧 {r.tech.user.name}
                        </span>
                      )}
                      <span className="text-[11px]" style={{ color: `${c.teal}aa` }}>
                        {new Date(r.createdAt).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                          year: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <svg className="shrink-0 mt-1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.teal} strokeWidth="2" strokeLinecap="round" opacity={0.5}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>
          );
        })}

        {active.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <p className="font-bold text-base" style={{ color: c.dark }}>ไม่มีงานซ่อมในระบบ</p>
            <p className="text-xs mt-1" style={{ color: c.teal }}>งานทั้งหมดเสร็จเรียบร้อยแล้ว</p>
          </div>
        )}
      </div>
    </div>
  );
}
