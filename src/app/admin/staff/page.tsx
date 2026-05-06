import { db, DbStaff } from "@/lib/db-client";
import { getBrand } from "@/lib/brand";
import { AddStaffForm, EditPermsForm, DeleteStaffButton } from "./staff-forms";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  tech: "ช่าง",
  senior_tech: "ช่างอาวุโส",
  admin: "แอดมิน",
};

const PERM_LABELS: Record<string, string> = {
  repairs: "ดูงานซ่อม",
  parts_view: "ดูอะไหล่",
  parts_requisition: "เบิกอะไหล่",
  reports: "ดูรายงาน",
  customers: "ดูข้อมูลลูกค้า",
};

export default async function StaffPage() {
  const [staffList, shops, brand] = await Promise.all([
    db.staff.list(),
    db.shops.list(),
    getBrand(),
  ]);
  const c = brand.colors;

  return (
    <div style={{ background: c.bg }} className="min-h-screen -m-4 p-4 sm:-m-6 sm:p-6">
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: c.dark }}>จัดการช่าง</h1>
            <p className="text-sm mt-0.5" style={{ color: c.teal }}>ข้อมูลช่างและสิทธิ์การใช้งาน</p>
          </div>
          <AddStaffForm shops={shops.map((s) => ({ id: s.id, name: s.name }))} />
        </div>

        {staffList.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center" style={{ border: `1px solid ${c.dark}08` }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: `${c.dark}06` }}>
              <span className="text-2xl">👤</span>
            </div>
            <p className="font-bold" style={{ color: c.dark }}>ยังไม่มีช่างในระบบ</p>
            <p className="text-sm mt-1" style={{ color: c.teal }}>กดปุ่ม &ldquo;+ เพิ่มช่าง&rdquo; เพื่อเริ่มต้น</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {staffList.map((staff: DbStaff) => {
              const permList = staff.perms ? staff.perms.split(",").filter(Boolean) : [];
              return (
                <div key={staff.id} className="bg-white rounded-2xl shadow-sm p-5" style={{ border: `1px solid ${c.dark}08` }}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0"
                        style={{ background: c.dark }}
                      >
                        {(staff.user?.name || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-lg" style={{ color: c.dark }}>
                          {staff.user?.name || "—"}
                        </p>
                        <p className="text-sm" style={{ color: c.teal }}>
                          @{staff.username || "—"} &middot; {staff.user?.phone || "—"}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className="text-xs px-3 py-1 rounded-full font-bold"
                            style={{ background: `${c.teal}18`, color: c.teal }}
                          >
                            {ROLE_LABELS[staff.role] || staff.role}
                          </span>
                        </div>
                        {permList.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {permList.map((p) => (
                              <span
                                key={p}
                                className="text-xs px-2.5 py-1 rounded-full font-medium"
                                style={{ background: `${c.mint}15`, color: c.teal }}
                              >
                                {PERM_LABELS[p] || p}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <DeleteStaffButton staffId={staff.id} />
                    </div>
                  </div>
                  <EditPermsForm
                    staff={{
                      id: staff.id,
                      userId: staff.userId,
                      username: staff.username,
                      role: staff.role,
                      perms: staff.perms,
                      shopId: staff.shopId,
                      user: staff.user ? { name: staff.user.name, phone: staff.user.phone } : null,
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
