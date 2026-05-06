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
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: c.dark }}>จัดการช่าง</h1>
        <AddStaffForm shops={shops.map((s) => ({ id: s.id, name: s.name }))} />
      </div>

      {staffList.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 text-sm">
          ยังไม่มีช่างในระบบ
        </div>
      ) : (
        <div className="grid gap-3">
          {staffList.map((staff: DbStaff) => {
            const permList = staff.perms ? staff.perms.split(",").filter(Boolean) : [];
            return (
              <div key={staff.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium" style={{ color: c.dark }}>
                      {staff.user?.name || "—"}
                    </p>
                    <p className="text-sm text-gray-500">
                      @{staff.username || "—"} &middot; {staff.user?.phone || "—"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: `${c.teal}15`, color: c.teal }}
                      >
                        {ROLE_LABELS[staff.role] || staff.role}
                      </span>
                    </div>
                    {permList.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {permList.map((p) => (
                          <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {PERM_LABELS[p] || p}
                          </span>
                        ))}
                      </div>
                    )}
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
  );
}
