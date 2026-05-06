import { getBrand } from "@/lib/brand";
import Link from "next/link";

export default async function HomePage() {
  const brand = await getBrand();
  const c = brand.colors;

  const services = [
    { icon: "📱", title: "ซ่อมจอ iPhone", desc: "จอแท้ / OEM ทุกรุ่น รับประกัน 6 เดือน" },
    { icon: "🔋", title: "เปลี่ยนแบตเตอรี่", desc: "แบตแท้คุณภาพสูง ประกัน 1 ปี" },
    { icon: "💻", title: "ซ่อม MacBook", desc: "บอร์ด คีย์บอร์ด จอ แบต ครบวงจร" },
    { icon: "📋", title: "ซ่อม iPad", desc: "เปลี่ยนจอ แบต พอร์ตชาร์จ" },
    { icon: "⌚", title: "Apple Watch", desc: "เปลี่ยนจอ แบต กระจก" },
    { icon: "📦", title: "ส่งซ่อมทางไปรษณีย์", desc: "แจ้งผ่าน LINE ส่งเครื่องมา ซ่อมเสร็จส่งกลับ" },
  ];

  const steps = [
    { num: "1", title: "แจ้งซ่อมผ่าน LINE", desc: "บอกรุ่นและอาการ แอดมินรับเรื่องทันที" },
    { num: "2", title: "ส่งเครื่องมาที่ร้าน", desc: "ส่งไปรษณีย์หรือนำมาเอง พร้อมใบรับซ่อม" },
    { num: "3", title: "ตรวจสอบและประเมินราคา", desc: "ช่างวินิจฉัย แจ้งราคาก่อนซ่อม" },
    { num: "4", title: "รับเครื่องคืน", desc: "ซ่อมเสร็จส่งกลับ พร้อมใบรับประกัน" },
  ];

  return (
    <div className="min-h-screen" style={{ background: c.dark }}>
      {/* Navigation */}
      <nav className="flex items-center justify-between px-5 py-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg font-black" style={{ background: c.accent, color: c.dark }}>M</div>
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
              Apple Device Specialist
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
              {brand.nameTh}
              <span className="block mt-1" style={{ color: c.accent }}>ซ่อมดี มีประกัน</span>
            </h1>
            <p className="text-base md:text-lg leading-relaxed mb-8" style={{ color: `${c.mint}cc` }}>
              ศูนย์ซ่อม Apple ครบวงจร iPhone, MacBook, iPad, Apple Watch
              โดยช่างผู้เชี่ยวชาญ ส่งซ่อมได้ทั่วประเทศ
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
            { val: "1,000+", label: "เครื่องที่ซ่อมแล้ว" },
            { val: "98%", label: "ลูกค้าพึงพอใจ" },
            { val: "6 เดือน", label: "รับประกัน" },
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
            เครื่องมีปัญหา? <span style={{ color: c.accent }}>แจ้งซ่อมเลย</span>
          </h2>
          <p className="text-sm mb-8" style={{ color: `${c.mint}aa` }}>
            แอดไลน์แจ้งรุ่นและอาการ ช่างประเมินราคาให้ทันที ไม่มีค่าตรวจเช็ค
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-sm transition hover:scale-[1.02]"
              style={{ background: "#06C755", color: "white" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
              แอดไลน์แจ้งซ่อม
            </a>
            {brand.phone && (
              <a
                href={`tel:${brand.phone}`}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-sm border-2 transition hover:scale-[1.02]"
                style={{ borderColor: `${c.mint}33`, color: c.mint }}
              >
                📞 โทร {brand.phone}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-5 py-8" style={{ background: c.dark, borderColor: `${c.mint}11` }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-black" style={{ background: c.accent, color: c.dark }}>M</div>
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
