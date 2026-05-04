import { getBrand } from "@/lib/brand";
import Link from "next/link";

export default async function HomePage() {
  const brand = await getBrand();
  const c = brand.colors;

  return (
    <div className="min-h-screen" style={{ background: c.bg }}>
      {/* Hero */}
      <div className="text-white py-16 px-4 text-center" style={{ background: c.dark }}>
        {brand.logo && <img src={brand.logo} alt={brand.name} className="h-20 mx-auto mb-4" />}
        <h1 className="text-4xl font-bold mb-2">{brand.name}</h1>
        <p className="text-xl mb-1" style={{ color: c.mint }}>{brand.nameTh}</p>
        <p className="text-lg opacity-80">{brand.tagline}</p>
        {brand.phone && <p className="mt-4 text-sm opacity-60">โทร: {brand.phone}</p>}

        <div className="flex gap-3 justify-center mt-8">
          <Link
            href="/track"
            className="px-6 py-3 rounded-xl font-medium text-sm transition"
            style={{ background: c.accent, color: c.dark }}
          >
            🔍 เช็คสถานะซ่อม
          </Link>
          <Link
            href="/admin"
            className="px-6 py-3 rounded-xl font-medium text-sm border transition"
            style={{ borderColor: `${c.mint}66`, color: c.mint }}
          >
            เข้าระบบ Admin
          </Link>
        </div>
      </div>

      {/* Services */}
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h2 className="text-2xl font-bold text-center mb-8" style={{ color: c.dark }}>บริการของเรา</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon: "📱", title: "ซ่อมจอ", desc: "เปลี่ยนจอแท้ / OEM ทุกรุ่น" },
            { icon: "🔋", title: "เปลี่ยนแบต", desc: "แบตแท้ รับประกัน" },
            { icon: "💻", title: "ซ่อม MacBook", desc: "บอร์ด, คีย์บอร์ด, จอ" },
            { icon: "⬆️", title: "อัพเกรด", desc: "เพิ่ม RAM, SSD, storage" },
            { icon: "💰", title: "รับซื้อเครื่องเสีย", desc: "ประเมินราคาฟรี" },
            { icon: "📦", title: "ส่งซ่อมออนไลน์", desc: "แจ้งผ่า LINE ส่งไปรษณีย์" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
              <span className="text-3xl">{s.icon}</span>
              <p className="font-bold mt-2" style={{ color: c.dark }}>{s.title}</p>
              <p className="text-xs mt-1" style={{ color: c.teal }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Track lookup */}
      <div className="py-12 px-4" style={{ background: c.dark }}>
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-xl font-bold text-white mb-2">เช็คสถานะการซ่อม</h2>
          <p className="text-sm mb-4" style={{ color: c.mint }}>กรอกเลขซ่อมหรือสแกน QR Code</p>
          <form action="/track" className="flex gap-2">
            <input
              name="code"
              placeholder="MOR-2605-0001"
              className="flex-1 px-4 py-3 rounded-xl text-sm font-mono"
            />
            <button type="submit" className="px-6 py-3 rounded-xl font-medium text-sm" style={{ background: c.accent, color: c.dark }}>
              ค้นหา
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-4 text-center">
        <p className="text-sm" style={{ color: c.teal }}>{brand.name} {brand.nameTh} — {brand.tagline}</p>
        {brand.address && <p className="text-xs mt-1" style={{ color: c.teal }}>{brand.address}</p>}
      </footer>
    </div>
  );
}
