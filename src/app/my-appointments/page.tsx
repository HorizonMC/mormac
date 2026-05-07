import { getCustomerSession } from "@/lib/customer-auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db-client";
import { getBrand } from "@/lib/brand";
import Link from "next/link";
import { LogoutButton } from "../my-repairs/logout-button";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  draft: "รอข้อมูล",
  pending: "รอร้านยืนยัน",
  approved: "ยืนยันแล้ว",
  rejected: "ปฏิเสธ",
  done: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};

export default async function MyAppointmentsPage() {
  const session = await getCustomerSession();
  if (!session) redirect("/login");

  const [brand, appointments] = await Promise.all([
    getBrand(),
    db.customer.appointments(session.userId),
  ]);
  const c = brand.colors;

  return (
    <div className="min-h-dvh" style={{ background: c.dark }}>
      <header className="sticky top-0 z-10 px-4 py-4 flex items-center justify-between" style={{ background: c.dark, borderBottom: `1px solid ${c.teal}30` }}>
        <div>
          <h1 className="text-lg font-bold text-white">{brand.name}</h1>
          <p className="text-xs" style={{ color: c.mint }}>{session.name}</p>
        </div>
        <LogoutButton accent={c.accent} dark={c.dark} />
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-white">คิวนัดหมายของฉัน</h2>
          <Link href="/my-repairs" className="text-xs font-bold" style={{ color: c.accent }}>งานซ่อม</Link>
        </div>

        {appointments.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-2xl mb-2">📅</p>
            <p style={{ color: c.mint }}>ยังไม่มีคิวนัดหมาย</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="rounded-2xl p-4" style={{ background: `${c.teal}18` }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-white font-bold">{appointment.date || "ยังไม่ระบุวัน"} {appointment.time}</p>
                    <p className="text-sm mt-1" style={{ color: c.mint }}>{appointment.deviceType || "อุปกรณ์"}</p>
                    <p className="text-xs mt-1" style={{ color: `${c.mint}cc` }}>{appointment.symptoms || "-"}</p>
                  </div>
                  <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: `${c.accent}20`, color: c.accent }}>
                    {statusLabel[appointment.status] || appointment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
