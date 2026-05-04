import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8fafb]">
      <nav className="bg-[#0F1720] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="font-bold text-lg">MorMac</Link>
          <span className="text-[#85C1B2] text-sm">Admin</span>
        </div>
        <div className="flex gap-4 text-sm">
          <Link href="/admin/queue" className="text-[#85C1B2] hover:text-white">คิวงาน</Link>
          <Link href="/admin/overview" className="text-[#85C1B2] hover:text-white">ภาพรวม</Link>
          <Link href="/admin/settings" className="text-[#85C1B2] hover:text-white">ตั้งค่า</Link>
        </div>
      </nav>
      <main className="p-4 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}
