import { db } from "@/lib/db-client";
import { getBrand } from "@/lib/brand";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function markRead(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  if (!id) return;
  await db.notifications.markRead(id);
  revalidatePath("/admin");
  revalidatePath("/admin/notifications");
}

export default async function NotificationsPage() {
  const [brand, notifications] = await Promise.all([getBrand(), db.notifications.list()]);
  const c = brand.colors;
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black" style={{ color: c.dark }}>
            การแจ้งเตือน
          </h1>
          <p className="text-sm mt-1" style={{ color: c.teal }}>
            {unreadCount} รายการที่ยังไม่ได้อ่าน
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y" style={{ borderColor: `${c.dark}06` }}>
          {notifications.map((notification) => (
            <div key={notification.id} className="px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-sm"
                    style={{ background: notification.read ? `${c.dark}08` : `${c.accent}18`, color: notification.read ? c.teal : c.accent }}
                  >
                    🔔
                  </span>
                  <span className="text-xs font-bold uppercase" style={{ color: c.teal }}>
                    {notification.type}
                  </span>
                  {!notification.read && (
                    <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${c.accent}18`, color: c.accent }}>
                      ใหม่
                    </span>
                  )}
                </div>
                <p className="font-bold" style={{ color: c.dark }}>
                  {notification.message}
                </p>
                <p className="text-xs mt-1" style={{ color: `${c.teal}aa` }}>
                  {new Date(notification.createdAt).toLocaleString("th-TH")}
                </p>
              </div>
              {!notification.read && (
                <form action={markRead}>
                  <input type="hidden" name="id" value={notification.id} />
                  <button
                    type="submit"
                    className="rounded-lg px-3 py-2 text-xs font-bold transition hover:opacity-80"
                    style={{ background: `${c.dark}08`, color: c.dark }}
                  >
                    อ่านแล้ว
                  </button>
                </form>
              )}
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="px-5 py-16 text-center" style={{ color: c.teal }}>
              <div className="text-3xl mb-2">🔔</div>
              <p className="text-sm">ยังไม่มีการแจ้งเตือน</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
