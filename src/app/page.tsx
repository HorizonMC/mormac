import { getBrand } from "@/lib/brand";
import Link from "next/link";

export default async function HomePage() {
  const brand = await getBrand();
  const c = brand.colors;

  const services = [
    { icon: "💬", title: "LINE OA Chatbot", desc: "รับแจ้งซ่อมอัตโนมัติ AI ตอบลูกค้า 24 ชม." },
    { icon: "📋", title: "ใบแจ้งซ่อม", desc: "ออกใบรับซ่อม ใบปะหน้า QR Code ติดตามงาน" },
    { icon: "🔧", title: "จัดการช่าง", desc: "มอบหมายงาน แยกสิทธิ์ ดูผลงานรายคน" },
    { icon: "📦", title: "คลังอะไหล่", desc: "เบิกอะไหล่ ตัด stock อัตโนมัติ แจ้งเตือนหมด" },
    { icon: "📊", title: "รายงานกำไร", desc: "กำไรรายงาน รายช่าง รายเดือน Margin %" },
    { icon: "🎨", title: "White-Label", desc: "ตั้งชื่อร้าน โลโก้ สี ของตัวเอง" },
  ];

  const steps = [
    { num: "1", title: "สมัครใช้งาน", desc: "ตั้งชื่อร้าน เชื่อมต่อ LINE OA ตั้งค่าแบรนด์" },
    { num: "2", title: "เพิ่มช่างและอะไหล่", desc: "สร้างบัญชีช่าง กำหนดสิทธิ์ นำเข้า stock" },
    { num: "3", title: "ลูกค้าแจ้งซ่อมผ่าน LINE", desc: "AI chatbot รับเรื่อง เก็บข้อมูล ถ่ายรูปอัตโนมัติ" },
    { num: "4", title: "บริหาร ติดตาม วิเคราะห์", desc: "มอบหมายงาน ติดตาม สรุปกำไรทุกมิติ" },
  ];

  return (
    <div className="min-h-screen" style={{ background: c.dark }}>
      {/* Navigation */}
      <nav className="flex items-center justify-between px-5 py-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black" style={{ background: c.accent, color: c.dark }}>iP</div>
          <span className="text-white font-bold text-lg">{brand.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="px-4 py-2 rounded-lg text-xs font-medium transition hover:opacity-80" style={{ color: c.mint }}>
            เจ้าของร้าน
          </Link>
          <Link href="/tech-login" className="px-4 py-2 rounded-lg text-xs font-medium transition hover:opacity-80" style={{ background: `${c.accent}18`, color: c.accent }}>
            ช่างซ่อม
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-5 pt-12 pb-20 md:pt-20 md:pb-28">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6" style={{ background: `${c.accent}15`, color: c.accent }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.accent }} />
              Professional Repair Platform
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
              {brand.name}
              <span className="block mt-1" style={{ color: c.accent }}>ระบบจัดการร้านซ่อม</span>
            </h1>
            <p className="text-base md:text-lg leading-relaxed mb-8" style={{ color: `${c.mint}cc` }}>
              แพลตฟอร์มบริหารร้านซ่อมครบวงจร รับงาน ติดตามสถานะ
              จัดการอะไหล่ คำนวณต้นทุน-กำไร เชื่อมต่อ LINE OA อัตโนมัติ
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/track"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: c.accent, color: c.dark }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                เช็คสถานะซ่อม
              </Link>
              <a
                href="#services"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm border-2 transition hover:scale-[1.02]"
                style={{ borderColor: `${c.mint}33`, color: c.mint }}
              >
                ดูบริการทั้งหมด
              </a>
            </div>
          </div>
        </div>
        {/* Decorative gradient */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-[0.03] pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 80% 30%, ${c.accent}, transparent 70%)` }}
        />
      </section>

      {/* Stats Strip */}
      <div style={{ background: `${c.accent}08` }}>
        <div className="max-w-5xl mx-auto px-5 py-6 flex justify-around">
          {[
            { val: "All-in-One", label: "ระบบครบวงจร" },
            { val: "LINE AI", label: "Chatbot อัตโนมัติ" },
            { val: "Real-time", label: "ติดตามสถานะทันที" },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-xl md:text-2xl font-black" style={{ color: c.accent }}>{s.val}</p>
              <p className="text-[11px] md:text-xs mt-0.5" style={{ color: c.mint }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Services */}
      <section id="services" className="py-16 px-5" style={{ background: c.bg }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: c.accent }}>Services</p>
            <h2 className="text-2xl md:text-3xl font-black" style={{ color: c.dark }}>บริการของเรา</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {services.map((s, i) => (
              <div key={i} className="group relative bg-white rounded-2xl p-5 md:p-6 border border-gray-100 transition hover:shadow-lg hover:-translate-y-0.5">
                <span className="text-3xl md:text-4xl">{s.icon}</span>
                <h3 className="font-bold text-sm md:text-base mt-3" style={{ color: c.dark }}>{s.title}</h3>
                <p className="text-[11px] md:text-xs mt-1.5 leading-relaxed" style={{ color: c.teal }}>{s.desc}</p>
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition" style={{ background: `${c.accent}15` }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c.accent} strokeWidth="3" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-5" style={{ background: c.dark }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: c.accent }}>How it works</p>
            <h2 className="text-2xl md:text-3xl font-black text-white">ขั้นตอนส่งซ่อม</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {steps.map((s, i) => (
              <div key={i} className="relative rounded-2xl p-5 md:p-6" style={{ background: `${c.mint}08` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black mb-4" style={{ background: c.accent, color: c.dark }}>
                  {s.num}
                </div>
                <h3 className="font-bold text-sm text-white mb-1.5">{s.title}</h3>
                <p className="text-[11px] md:text-xs leading-relaxed" style={{ color: `${c.mint}aa` }}>{s.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 w-4 text-center" style={{ color: `${c.mint}44` }}>
                    &rsaquo;
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Track Section */}
      <section className="py-16 px-5" style={{ background: c.bg }}>
        <div className="max-w-lg mx-auto">
          <div className="rounded-2xl p-6 md:p-8 shadow-xl border border-gray-100 bg-white">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mx-auto mb-3" style={{ background: `${c.accent}15` }}>
                🔍
              </div>
              <h2 className="text-xl font-black" style={{ color: c.dark }}>เช็คสถานะการซ่อม</h2>
              <p className="text-xs mt-1" style={{ color: c.teal }}>กรอกเลขซ่อมหรือสแกน QR Code จากใบรับซ่อม</p>
            </div>
            <form action="/track" className="flex gap-2">
              <input
                name="code"
                placeholder="MOR-2605-0001"
                className="flex-1 px-4 py-3.5 rounded-xl text-sm font-mono border border-gray-200 outline-none focus:ring-2 transition"
                style={{ focusRing: c.accent } as React.CSSProperties}
              />
              <button
                type="submit"
                className="px-5 py-3.5 rounded-xl font-bold text-sm transition hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: c.dark, color: "white" }}
              >
                ค้นหา
              </button>
            </form>
            <div className="flex items-center gap-3 mt-4">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[10px] text-gray-400">หรือ</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <Link
              href="/track"
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border-2 border-dashed transition hover:opacity-80"
              style={{ borderColor: `${c.teal}33`, color: c.teal }}
            >
              📷 สแกน QR Code
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-5" style={{ background: c.dark }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
            พร้อมยกระดับร้านซ่อม? <span style={{ color: c.accent }}>เริ่มเลย</span>
          </h2>
          <p className="text-sm mb-8" style={{ color: `${c.mint}aa` }}>
            เชื่อมต่อ LINE OA ของร้านคุณ ระบบ AI จัดการรับงาน ติดตามสถานะ คำนวณกำไรให้อัตโนมัติ
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-sm transition hover:scale-[1.02]"
              style={{ background: c.accent, color: c.dark }}
            >
              เข้าสู่ระบบเจ้าของร้าน
            </Link>
            {brand.phone && (
              <a
                href={`tel:${brand.phone}`}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-sm border-2 transition hover:scale-[1.02]"
                style={{ borderColor: `${c.mint}33`, color: c.mint }}
              >
                📞 สอบถาม {brand.phone}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-5 py-8" style={{ background: c.dark, borderColor: `${c.mint}11` }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center text-[8px] font-black" style={{ background: c.accent, color: c.dark }}>iP</div>
            <div>
              <span className="text-white font-bold text-sm">{brand.name}</span>
              <span className="text-xs ml-2" style={{ color: `${c.mint}88` }}>{brand.nameTh}</span>
            </div>
          </div>
          <div className="text-center md:text-right">
            <p className="text-[11px]" style={{ color: `${c.mint}66` }}>{brand.tagline}</p>
            {brand.address && <p className="text-[11px] mt-0.5" style={{ color: `${c.mint}44` }}>{brand.address}</p>}
          </div>
        </div>
      </footer>
    </div>
  );
}
