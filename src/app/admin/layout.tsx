import Link from "next/link";
import { getBrand } from "@/lib/brand";
import { AdminMobileMenu } from "./admin-mobile-menu";

const adminLinks = [
  { href: "/admin", label: "แดชบอร์ด", icon: "grid" },
  { href: "/admin/queue", label: "คิวงาน", icon: "list" },
  { href: "/admin/appointments", label: "นัดหมาย", icon: "calendar" },
  { href: "/admin/devices", label: "เครื่อง", icon: "device" },
  { href: "/admin/parts", label: "อะไหล่", icon: "box" },
  { href: "/admin/notifications", label: "แจ้งเตือน", icon: "bell" },
  { href: "/admin/customers", label: "ลูกค้า", icon: "users" },
  { href: "/admin/staff", label: "จัดการช่าง", icon: "wrench" },
  { href: "/admin/overview", label: "ภาพรวม", icon: "chart" },
  { href: "/admin/reports", label: "รายงาน", icon: "file" },
  { href: "/admin/settings", label: "ตั้งค่า", icon: "settings" },
];

function NavIcon({ name, size = 18 }: { name: string; size?: number }) {
  const s = size;
  const props = { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "grid":
      return <svg {...props}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
    case "list":
      return <svg {...props}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
    case "calendar":
      return <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
    case "device":
      return <svg {...props}><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>;
    case "box":
      return <svg {...props}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
    case "bell":
      return <svg {...props}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
    case "users":
      return <svg {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case "wrench":
      return <svg {...props}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
    case "chart":
      return <svg {...props}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
    case "file":
      return <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
    case "settings":
      return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
    case "logout":
      return <svg {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
    default:
      return null;
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const brand = await getBrand();
  const c = brand.colors;
  return (
    <div className="min-h-screen flex" style={{ background: c.bg }}>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col w-60 min-h-screen fixed left-0 top-0 z-40"
        style={{ background: c.dark }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: `${c.mint}15` }}>
          {brand.logo
            ? <img src={brand.logo} alt={brand.name} className="h-9 w-auto shrink-0" />
            : <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black shrink-0" style={{ background: c.accent, color: c.dark }}>D</div>
          }
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight truncate">{brand.name}</p>
            <p className="text-[11px] leading-tight truncate" style={{ color: `${c.mint}88` }}>Admin Panel</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 hover:bg-white/[0.07]"
              style={{ color: c.mint }}
            >
              <span className="opacity-60 group-hover:opacity-100 transition-opacity">
                <NavIcon name={link.icon} size={18} />
              </span>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="px-3 py-4 border-t" style={{ borderColor: `${c.mint}15` }}>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 hover:bg-white/[0.07]"
            style={{ color: `${c.mint}88` }}
          >
            <NavIcon name="logout" size={18} />
            ออกจากระบบ
          </Link>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ background: c.dark }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
            style={{ background: c.accent, color: c.dark }}
          >
            M
          </div>
          <div>
            <span className="text-white font-bold text-sm">{brand.name}</span>
            <span className="text-[11px] ml-2" style={{ color: `${c.mint}88` }}>Admin</span>
          </div>
        </div>
        <AdminMobileMenu links={adminLinks} dark={c.dark} mint={c.mint} accent={c.accent} />
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-60">
        <div className="pt-16 md:pt-0 min-h-screen">
          <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export { adminLinks, NavIcon };
