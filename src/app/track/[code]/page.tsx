import { db } from "@/lib/db-client";
import { repairStatusText } from "@/lib/line";
import { getBrand } from "@/lib/brand";
import { notFound } from "next/navigation";

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

  return (
    <div className="min-h-screen p-4 max-w-md mx-auto" style={{ background: c.bg }}>
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold" style={{ color: c.dark }}>{brand.name}</h1>
        <p className="text-xs" style={{ color: c.teal }}>{brand.nameTh}</p>
      </div>

      {/* Repair Card */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4" style={{ borderColor: `${c.mint}33`, borderWidth: 1 }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs" style={{ color: c.teal }}>เลขซ่อม</p>
            <p className="text-lg font-mono font-bold" style={{ color: c.dark }}>{repair.repairCode}</p>
          </div>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: c.dark }}>
            <span className="text-lg">
              {repair.deviceType === "iphone" ? "📱" : repair.deviceType === "macbook" ? "💻" : repair.deviceType === "ipad" ? "📋" : repair.deviceType === "watch" ? "⌚" : "🔧"}
            </span>
          </div>
        </div>
        <p className="font-medium text-sm" style={{ color: c.dark }}>{repair.deviceModel}</p>
        <p className="text-xs mt-1" style={{ color: c.teal }}>{repair.symptoms}</p>
        <div className="flex gap-4 mt-3 text-xs" style={{ color: c.teal }}>
          <span>วันที่รับ: {date}</span>
          {customer?.name && customer.name !== "LINE User" && <span>ลูกค้า: {customer.name}</span>}
        </div>
      </div>

      {/* Status */}
      <div className="rounded-2xl p-4 mb-4" style={{ background: c.dark }}>
        <p className="text-xs mb-1" style={{ color: c.mint }}>สถานะปัจจุบัน</p>
        <p className="text-lg font-bold text-white">{repairStatusText(repair.status)}</p>
      </div>

      {/* Intake Photos */}
      {photos.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4" style={{ borderColor: `${c.mint}33`, borderWidth: 1 }}>
          <p className="text-sm font-bold mb-3" style={{ color: c.dark }}>📸 รูปเครื่องตอนรับ</p>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo, i) => (
              <a key={i} href={`${uploadBase}${photo}`} target="_blank" className="block aspect-square rounded-lg overflow-hidden bg-gray-50">
                <img src={`${uploadBase}${photo}`} alt={`Device photo ${i + 1}`} className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Price */}
      {repair.quotedPrice && (
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 flex items-center justify-between" style={{ borderColor: `${c.mint}33`, borderWidth: 1 }}>
          <div>
            <p className="text-xs" style={{ color: c.teal }}>ราคาประเมิน</p>
            <p className="text-xl font-bold" style={{ color: c.dark }}>฿{repair.quotedPrice.toLocaleString()}</p>
          </div>
          {repair.finalPrice && repair.finalPrice !== repair.quotedPrice && (
            <div className="text-right">
              <p className="text-xs" style={{ color: c.teal }}>ราคาสุดท้าย</p>
              <p className="text-xl font-bold" style={{ color: c.accent }}>฿{repair.finalPrice.toLocaleString()}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <a
          href={`/api/repairs/cover?code=${encodeURIComponent(repair.repairCode)}`}
          target="_blank"
          className="rounded-xl p-3 text-center text-sm font-bold text-white"
          style={{ background: c.dark }}
        >
          🧾 ใบปะหน้าส่งเครื่อง
        </a>
        <a
          href={`/api/repairs/jobsheet?code=${encodeURIComponent(repair.repairCode)}`}
          target="_blank"
          className="rounded-xl p-3 text-center text-sm font-bold"
          style={{ background: `${c.mint}44`, color: c.dark }}
        >
          🖨️ ใบรับซ่อม
        </a>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl shadow-sm p-5" style={{ borderColor: `${c.mint}33`, borderWidth: 1 }}>
        <p className="text-sm font-bold mb-4" style={{ color: c.dark }}>Timeline</p>
        {STATUSES.map((s, i) => {
          const event = repair.timeline?.find((e: { status: string }) => e.status === s);
          const isDone = i <= currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div key={s} className="flex items-start gap-3 pb-3 last:pb-0">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full border-2" style={{
                  background: isCurrent ? c.accent : isDone ? c.teal : "white",
                  borderColor: isCurrent ? c.accent : isDone ? c.teal : `${c.mint}66`,
                  boxShadow: isCurrent ? `0 0 0 4px ${c.accent}33` : "none",
                }} />
                {i < STATUSES.length - 1 && <div className="w-0.5 h-5" style={{ background: isDone ? c.teal : `${c.mint}33` }} />}
              </div>
              <div className={`-mt-0.5 ${isDone ? "" : "opacity-30"}`}>
                <p className="text-sm font-medium" style={{ color: c.dark }}>{repairStatusText(s)}</p>
                {event && <p className="text-xs" style={{ color: c.teal }}>{new Date(event.createdAt).toLocaleDateString("th-TH")} {new Date(event.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Shop Contact */}
      <div className="mt-4 text-center">
        {brand.phone && <p className="text-xs" style={{ color: c.teal }}>สอบถามเพิ่มเติม โทร: {brand.phone}</p>}
        <p className="text-xs mt-1" style={{ color: `${c.teal}88` }}>{brand.name} {brand.nameTh}</p>
      </div>
    </div>
  );
}
