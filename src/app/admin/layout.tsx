import Link from "next/link";
import { getBrand } from "@/lib/brand";
import { AdminMobileMenu } from "./admin-mobile-menu";

const adminLinks = [
  { href: "/admin/queue", label: "คิวงาน" },
  { href: "/admin/devices", label: "เครื่อง" },
  { href: "/admin/parts", label: "อะไหล่" },
  { href: "/admin/customers", label: "ลูกค้า" },
  { href: "/admin/overview", label: "ภาพรวม" },
  { href: "/admin/reports", label: "รายงาน" },
  { href: "/admin/settings", label: "ตั้งค่า" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const brand = await getBrand();
  const c = brand.colors;
  return (
    <div className="min-h-screen" style={{ background: c.bg }}>
      <nav className="relative text-white px-4 py-3 flex items-center justify-between" style={{ background: c.dark }}>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="font-bold text-lg">{brand.name}</Link>
          <span className="text-sm" style={{ color: c.mint }}>Admin</span>
        </div>
        <div className="hidden md:flex gap-4 text-sm">
          {adminLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-white" style={{ color: c.mint }}>{link.label}</Link>
          ))}
        </div>
        <AdminMobileMenu links={adminLinks} dark={c.dark} mint={c.mint} />
      </nav>
      <main className="p-4 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}
