import { getCustomerSession } from "@/lib/customer-auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db-client";
import { getBrand } from "@/lib/brand";
import Link from "next/link";
import { LogoutButton } from "./logout-button";

function statusBadge(status: string, accent: string) {
  const map: Record<string, { label: string; color: string }> = {
    submitted: { label: "แจ้งซ่อมแล้ว", color: "#4A7A8A" },
    received: { label: "รับเครื่องแล้ว", color: "#4A7A8A" },
    diagnosing: { label: "ตรวจอาการ", color: "#3B82F6" },
    quoted: { label: "ประเมินราคาแล้ว", color: "#F59E0B" },
    confirmed: { label: "ยืนยันซ่อม", color: "#3B82F6" },
    repairing: { label: "กำลังซ่อม", color: "#3B82F6" },
    qc: { label: "ตรวจคุณภาพ", color: "#3B82F6" },
    done: { label: "ซ่อมเสร็จ", color: accent },
    shipped: { label: "จัดส่งแล้ว", color: accent },
    returned: { label: "รับคืนแล้ว", color: accent },
    cancelled: { label: "ยกเลิก", color: "#EF4444" },
  };
  const s = map[status] || { label: status, color: "#4A7A8A" };
  return s;
}

export default async function MyRepairsPage() {
  const session = await getCustomerSession();
  if (!session) redirect("/login");

  const brand = await getBrand();
  const c = brand.colors;

  let repairs: Awaited<ReturnType<typeof db.customer.repairs>> = [];
  try {
    repairs = await db.customer.repairs(session.userId);
  } catch {
    // DB might be down
  }

  return (
    <div className="min-h-dvh" style={{ background: c.dark }}>
      {/* Header */}
      <header className="sticky top-0 z-10 px-4 py-4 flex items-center justify-between" style={{ background: c.dark, borderBottom: `1px solid ${c.teal}30` }}>
        <div>
          <h1 className="text-lg font-bold text-white">{brand.name}</h1>
          <p className="text-xs" style={{ color: c.mint }}>
            {session.name}
          </p>
        </div>
        <LogoutButton accent={c.accent} dark={c.dark} />
      </header>

      {/* Content */}
      <main className="px-4 py-6 max-w-lg mx-auto space-y-4">
        <h2 className="text-xl font-bold text-white">งานซ่อมของฉัน</h2>

        {repairs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-2xl mb-2">🔧</p>
            <p style={{ color: c.mint }}>ยังไม่มีงานซ่อม</p>
          </div>
        ) : (
          <div className="space-y-3">
            {repairs.map((repair) => {
              const badge = statusBadge(repair.status, c.accent);
              const date = new Date(repair.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
              return (
                <Link
                  key={repair.id}
                  href={`/track/${repair.repairCode}`}
                  className="block rounded-2xl p-4 transition hover:scale-[1.01]"
                  style={{ background: `${c.teal}18` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold" style={{ color: c.accent }}>{repair.repairCode}</p>
                      <p className="text-white font-medium mt-1 truncate">{repair.deviceModel}</p>
                      <p className="text-xs mt-1 truncate" style={{ color: c.mint }}>{repair.symptoms}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className="inline-block text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ background: `${badge.color}20`, color: badge.color }}
                      >
                        {badge.label}
                      </span>
                      <p className="text-xs mt-2" style={{ color: `${c.teal}88` }}>{date}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
