import { db } from "@/lib/db-client";
import { repairStatusText } from "@/lib/line";
import { getBrand } from "@/lib/brand";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{ code: string }>;
}

export const dynamic = "force-dynamic";

const STATUSES = ["submitted", "received", "diagnosing", "quoted", "confirmed", "repairing", "qc", "done", "shipped", "returned"];

function parsePhotos(val: string | null | undefined): string[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export default async function TrackPage({ params }: Props) {
  const { code } = await params;
  const brand = await getBrand();
  const c = brand.colors;
  const uploadBase = process.env.DB_API_URL || "http://localhost:4100";

  const repair = await db.repairs.getByCode(code);
  if (!repair) notFound();

  const currentIdx = STATUSES.indexOf(repair.status);
  const photos = parsePhotos(repair.photos);
  const customer = repair.customer;
  const date = new Date(repair.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });

  const progressPercent = Math.round(((currentIdx + 1) / STATUSES.length) * 100);

  return (
    <div className="min-h-dvh" style={{ background: c.bg }}>
      {/* Header */}
      <div style={{ background: c.dark }}>
        <div className="max-w-md mx-auto px-4 pt-5 pb-6">
          <div className="flex items-center justify-between mb-5">
            <Link href="/track" className="flex items-center gap-2 transition hover:opacity-80">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-black" style={{ background: c.accent, color: c.dark }}>D</div>
              <span className="text-white font-bold text-sm">{brand.name}</span>
            </Link>
            <Link href="/track" className="text-xs px-3 py-1.5 rounded-lg transition hover:opacity-80" style={{ background: `${c.mint}15`, color: c.mint }}>
              &larr; กลับ
            </Link>
          </div>

          {/* Repair Code + Device Icon */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs mb-1" style={{ color: `${c.mint}88` }}>เลขซ่อม</p>
              <p className="text-xl font-mono font-black text-white">{repair.repairCode}</p>
              <p className="text-sm font-medium text-white mt-1">{repair.deviceModel}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${c.accent}15` }}>
              <span className="text-2xl">
                {repair.deviceType === "iphone" ? "📱" : repair.deviceType === "macbook" ? "💻" : repair.deviceType === "ipad" ? "📋" : repair.deviceType === "watch" ? "⌚" : "🔧"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-1">
        {/* Status Card */}
        <div className="rounded-2xl p-5 mb-4 shadow-lg" style={{ background: c.dark }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs mb-0.5" style={{ color: `${c.mint}88` }}>สถานะปัจจุบัน</p>
              <p className="text-xl font-black" style={{ color: c.accent }}>{repairStatusText(repair.status)}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-white">{progressPercent}%</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: `${c.mint}22` }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%`, background: c.accent }}
            />
          </div>
        </div>

        {/* Device Info Card */}
        <div className="bg-white rounded-2xl p-5 mb-4 border" style={{ borderColor: `${c.mint}22` }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: c.accent }}>Device Info</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: c.teal }}>อาการ</span>
              <span className="text-sm font-medium text-right max-w-[60%]" style={{ color: c.dark }}>{repair.symptoms}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: c.teal }}>วันที่รับ</span>
              <span className="text-sm font-medium" style={{ color: c.dark }}>{date}</span>
            </div>
            {customer?.name && customer.name !== "LINE User" && (
              <div className="flex justify-between">
                <span className="text-xs" style={{ color: c.teal }}>ลูกค้า</span>
                <span className="text-sm font-medium" style={{ color: c.dark }}>{customer.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Intake Photos */}
        {photos.length > 0 && (
          <div className="bg-white rounded-2xl p-5 mb-4 border" style={{ borderColor: `${c.mint}22` }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: c.accent }}>Photos</p>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, i) => (
                <a key={i} href={`${uploadBase}${photo}`} target="_blank" className="block aspect-square rounded-xl overflow-hidden bg-gray-50 transition hover:scale-[1.02]">
                  <img src={`${uploadBase}${photo}`} alt={`Device photo ${i + 1}`} className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Price */}
        {repair.quotedPrice && (
          <div className="bg-white rounded-2xl p-5 mb-4 border" style={{ borderColor: `${c.mint}22` }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: c.accent }}>Price</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs" style={{ color: c.teal }}>ราคาประเมิน</p>
                <p className="text-2xl font-black" style={{ color: c.dark }}>{"฿"}{repair.quotedPrice.toLocaleString()}</p>
              </div>
              {repair.finalPrice && repair.finalPrice !== repair.quotedPrice && (
                <div className="text-right">
                  <p className="text-xs" style={{ color: c.teal }}>ราคาสุดท้าย</p>
                  <p className="text-2xl font-black" style={{ color: c.accent }}>{"฿"}{repair.finalPrice.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <a
            href={`/api/repairs/cover?code=${encodeURIComponent(repair.repairCode)}`}
            target="_blank"
            className="rounded-xl p-3.5 text-center text-sm font-bold text-white transition hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: c.dark }}
          >
            🧾 ใบปะหน้าส่งเครื่อง
          </a>
          <a
            href={`/api/repairs/jobsheet?code=${encodeURIComponent(repair.repairCode)}`}
            target="_blank"
            className="rounded-xl p-3.5 text-center text-sm font-bold transition hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: `${c.accent}15`, color: c.dark }}
          >
            🖨️ ใบรับซ่อม
          </a>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl p-5 mb-4 border" style={{ borderColor: `${c.mint}22` }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: c.accent }}>Timeline</p>
          <div className="space-y-0">
            {STATUSES.map((s, i) => {
              const event = repair.timeline?.find((e: { status: string }) => e.status === s);
              const isDone = i <= currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <div key={s} className="flex items-start gap-3 pb-4 last:pb-0">
                  <div className="flex flex-col items-center pt-0.5">
                    <div className="w-3 h-3 rounded-full border-2 shrink-0" style={{
                      background: isCurrent ? c.accent : isDone ? c.dark : "white",
                      borderColor: isCurrent ? c.accent : isDone ? c.dark : `${c.mint}44`,
                      boxShadow: isCurrent ? `0 0 0 4px ${c.accent}33` : "none",
                    }} />
                    {i < STATUSES.length - 1 && <div className="w-0.5 h-6 mt-0.5" style={{ background: isDone ? c.dark : `${c.mint}22` }} />}
                  </div>
                  <div className={`-mt-0.5 ${isDone ? "" : "opacity-25"}`}>
                    <p className={`text-sm ${isCurrent ? "font-black" : "font-medium"}`} style={{ color: isCurrent ? c.accent : c.dark }}>
                      {repairStatusText(s)}
                    </p>
                    {event && (
                      <p className="text-[11px] mt-0.5" style={{ color: c.teal }}>
                        {new Date(event.createdAt).toLocaleDateString("th-TH")} {new Date(event.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pb-8 pt-2">
          {brand.phone && <p className="text-xs" style={{ color: c.teal }}>สอบถามเพิ่มเติม โทร: {brand.phone}</p>}
          <p className="text-[11px] mt-1" style={{ color: `${c.teal}88` }}>{brand.name} {brand.nameTh}</p>
        </div>
      </div>
    </div>
  );
}
