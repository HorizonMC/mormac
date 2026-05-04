import Link from "next/link";
import { getBrand } from "@/lib/brand";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const brand = await getBrand();
  const c = brand.colors;
  return (
    <div className="min-h-screen" style={{ background: c.bg }}>
      <nav className="text-white px-4 py-3 flex items-center justify-between" style={{ background: c.dark }}>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="font-bold text-lg">{brand.name}</Link>
          <span className="text-sm" style={{ color: c.mint }}>Admin</span>
        </div>
        <div className="flex gap-4 text-sm">
          <Link href="/admin/queue" className="hover:text-white" style={{ color: c.mint }}>คิวงาน</Link>
          <Link href="/admin/parts" className="hover:text-white" style={{ color: c.mint }}>อะไหล่</Link>
          <Link href="/admin/overview" className="hover:text-white" style={{ color: c.mint }}>ภาพรวม</Link>
          <Link href="/admin/settings" className="hover:text-white" style={{ color: c.mint }}>ตั้งค่า</Link>
        </div>
      </nav>
      <main className="p-4 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}
