import { revalidatePath } from "next/cache";
import { db } from "@/lib/db-client";
import { getBrand } from "@/lib/brand";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  draft: "รอข้อมูล",
  pending: "รออนุมัติ",
  approved: "อนุมัติแล้ว",
  rejected: "ปฏิเสธ",
  done: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};

async function updateAppointmentStatus(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || !status) return;
  await db.appointments.updateStatus(id, status);
  revalidatePath("/admin/appointments");
}

export default async function AdminAppointmentsPage() {
  const [brand, appointments] = await Promise.all([getBrand(), db.appointments.list()]);
  const c = brand.colors;
  const pending = appointments.filter((appointment) => appointment.status === "pending");
  const approved = appointments.filter((appointment) => appointment.status === "approved");
  const calendarDays = groupByDate(appointments.filter((appointment) => appointment.status !== "draft"));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black" style={{ color: c.dark }}>คิวนัดหมาย</h1>
        <p className="text-sm mt-1" style={{ color: c.teal }}>
          {pending.length} คิวรออนุมัติ | {approved.length} คิวที่ยืนยันแล้ว
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b" style={{ borderColor: `${c.dark}08` }}>
            <h2 className="font-bold" style={{ color: c.dark }}>รายการคิวทั้งหมด</h2>
          </div>
          <div className="divide-y" style={{ borderColor: `${c.dark}06` }}>
            {appointments.map((appointment) => (
              <div key={appointment.id} className="p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black" style={{ color: c.dark }}>
                      {appointment.date || "ยังไม่ระบุวัน"} {appointment.time || ""}
                    </p>
                    <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: `${statusColor(appointment.status, c.accent)}18`, color: statusColor(appointment.status, c.accent) }}>
                      {statusLabel[appointment.status] || appointment.status}
                    </span>
                  </div>
                  <p className="text-sm mt-1" style={{ color: c.dark }}>
                    {appointment.customer?.name || "ลูกค้า"} | {appointment.deviceType || "อุปกรณ์"}
                  </p>
                  <p className="text-xs mt-1" style={{ color: c.teal }}>{appointment.symptoms || "-"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["approved", "rejected", "done"].map((status) => (
                    <form key={status} action={updateAppointmentStatus}>
                      <input type="hidden" name="id" value={appointment.id} />
                      <input type="hidden" name="status" value={status} />
                      <button
                        type="submit"
                        className="rounded-lg px-3 py-2 text-xs font-bold transition hover:opacity-80"
                        style={{ background: status === "approved" ? c.accent : `${c.dark}08`, color: c.dark }}
                      >
                        {statusLabel[status]}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            ))}
            {appointments.length === 0 && (
              <div className="px-5 py-16 text-center" style={{ color: c.teal }}>ยังไม่มีคิวนัดหมาย</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold mb-4" style={{ color: c.dark }}>Calendar View</h2>
          <div className="space-y-4">
            {calendarDays.map(([date, items]) => (
              <div key={date} className="rounded-xl p-4" style={{ background: `${c.dark}05` }}>
                <p className="font-black text-sm" style={{ color: c.dark }}>{date}</p>
                <div className="mt-3 space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-lg bg-white px-3 py-2 text-xs">
                      <p className="font-bold" style={{ color: c.dark }}>{item.time} | {item.customer?.name || "ลูกค้า"}</p>
                      <p className="mt-0.5 truncate" style={{ color: c.teal }}>{item.deviceType} - {item.symptoms}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {calendarDays.length === 0 && <p className="text-sm" style={{ color: c.teal }}>ยังไม่มีข้อมูลในปฏิทิน</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function groupByDate<T extends { date: string }>(items: T[]): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = item.date || "ไม่ระบุวัน";
    map.set(key, [...(map.get(key) || []), item]);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function statusColor(status: string, accent: string) {
  if (status === "approved" || status === "done") return accent;
  if (status === "rejected" || status === "cancelled") return "#EF4444";
  return "#F59E0B";
}
