import { db } from "@/lib/db-client";
import { repairStatusText } from "@/lib/line";
import { getBrand } from "@/lib/brand";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ code: string }>;
}

const STATUSES = ["submitted", "received", "diagnosing", "quoted", "confirmed", "repairing", "qc", "done", "shipped", "returned"];

export default async function TrackPage({ params }: Props) {
  const { code } = await params;
  const brand = await getBrand();
  const c = brand.colors;

  const repair = await db.repairs.getByCode(code);
  if (!repair) notFound();

  const currentIdx = STATUSES.indexOf(repair.status);

  return (
    <div className="min-h-screen p-4 max-w-md mx-auto" style={{ background: c.bg }}>
      <div className="text-center mb-4">
        {brand.logo && <img src={brand.logo} alt={brand.name} className="h-12 mx-auto mb-2" />}
        <h1 className="text-2xl font-bold" style={{ color: c.dark }}>{brand.name}</h1>
        <p className="text-sm" style={{ color: c.teal }}>{brand.nameTh} — {brand.tagline}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-4" style={{ borderColor: `${c.mint}33`, borderWidth: 1 }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs" style={{ color: c.teal }}>เลขซ่อม</p>
            <p className="text-lg font-mono font-bold" style={{ color: c.dark }}>{repair.repairCode}</p>
          </div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: c.dark }}>
            <span className="text-xl">
              {repair.deviceType === "iphone" ? "📱" : repair.deviceType === "macbook" ? "💻" : repair.deviceType === "ipad" ? "📋" : repair.deviceType === "watch" ? "⌚" : "🔧"}
            </span>
          </div>
        </div>
        <p className="font-medium" style={{ color: c.dark }}>{repair.deviceModel}</p>
        <p className="text-sm mt-1" style={{ color: c.teal }}>{repair.symptoms}</p>
      </div>

      <div className="rounded-2xl p-4 mb-4" style={{ background: c.dark }}>
        <p className="text-xs mb-1" style={{ color: c.mint }}>สถานะปัจจุบัน</p>
        <p className="text-lg font-bold text-white">{repairStatusText(repair.status)}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6" style={{ borderColor: `${c.mint}33`, borderWidth: 1 }}>
        <p className="text-sm font-bold mb-4" style={{ color: c.dark }}>Timeline</p>
        {STATUSES.map((s, i) => {
          const event = repair.timeline?.find((e: any) => e.status === s);
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
                {event && <p className="text-xs" style={{ color: c.teal }}>{new Date(event.createdAt).toLocaleDateString("th-TH")}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {repair.quotedPrice && (
        <div className="mt-4 bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between" style={{ borderColor: `${c.mint}33`, borderWidth: 1 }}>
          <div>
            <p className="text-xs" style={{ color: c.teal }}>ราคาประเมิน</p>
            <p className="text-xl font-bold" style={{ color: c.dark }}>฿{repair.quotedPrice.toLocaleString()}</p>
          </div>
        </div>
      )}

      <p className="text-center text-xs mt-6" style={{ color: c.teal }}>{brand.name} {brand.nameTh}</p>
    </div>
  );
}
