import { redirect } from "next/navigation";
import { getBrand } from "@/lib/brand";
import { QrScanner } from "./qr-scanner";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ code?: string }>;
}

export default async function TrackSearchPage({ searchParams }: Props) {
  const { code } = await searchParams;
  if (code) redirect(`/track/${code}`);

  const brand = await getBrand();
  const c = brand.colors;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12" style={{ background: c.dark }}>
      {/* Decorative gradient */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.04]"
        style={{ background: `radial-gradient(ellipse at 50% 30%, ${c.accent}, transparent 70%)` }}
      />

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black" style={{ background: c.accent, color: c.dark }}>iP</div>
            <span className="text-white font-bold text-lg">{brand.name}</span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-white mb-2">เช็คสถานะการซ่อม</h1>
          <p className="text-sm" style={{ color: `${c.mint}cc` }}>กรอกเลขซ่อมหรือสแกน QR Code จากใบรับซ่อม</p>
        </div>

        {/* Search Card */}
        <div className="rounded-2xl p-6 md:p-8" style={{ background: `${c.mint}08` }}>
          <form className="space-y-3">
            <input
              name="code"
              placeholder="MOR-2605-0001"
              required
              className="w-full px-4 py-3.5 rounded-xl text-center font-mono text-lg text-white placeholder-gray-500 border-0 outline-none transition focus:ring-2"
              style={{ background: c.dark, outlineColor: c.accent }}
            />
            <button
              type="submit"
              className="w-full px-4 py-3.5 rounded-xl font-bold text-sm transition hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: c.accent, color: c.dark }}
            >
              <span className="inline-flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                ค้นหา
              </span>
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: `${c.mint}22` }} />
            <span className="text-xs" style={{ color: `${c.mint}66` }}>หรือ</span>
            <div className="flex-1 h-px" style={{ background: `${c.mint}22` }} />
          </div>

          <QrScanner dark={c.dark} teal={c.teal} accent={c.accent} />
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-xs transition hover:opacity-80" style={{ color: c.teal }}>
            &larr; กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}
