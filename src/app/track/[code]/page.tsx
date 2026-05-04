import { prisma } from "@/lib/prisma";
import { repairStatusText } from "@/lib/line";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ code: string }>;
}

const STATUSES = ["submitted", "received", "diagnosing", "quoted", "confirmed", "repairing", "qc", "done", "shipped", "returned"];

export default async function TrackPage({ params }: Props) {
  const { code } = await params;

  const repair = await prisma.repair.findUnique({
    where: { repairCode: code },
    include: { timeline: { orderBy: { createdAt: "asc" } } },
  });

  if (!repair) notFound();

  const currentIdx = STATUSES.indexOf(repair.status);

  return (
    <div className="min-h-screen bg-[#f8fafb] p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-[#0F1720]">MorMac</h1>
        <p className="text-sm text-[#4A7A8A]">หมอแมค — Apple Device Specialist</p>
      </div>

      {/* Device Info Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#85C1B2]/20 p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-[#4A7A8A]">เลขซ่อม</p>
            <p className="text-lg font-mono font-bold text-[#0F1720]">{repair.repairCode}</p>
          </div>
          <div className="w-12 h-12 bg-[#0F1720] rounded-xl flex items-center justify-center">
            <span className="text-xl">
              {repair.deviceType === "iphone" ? "📱" : repair.deviceType === "macbook" ? "💻" : repair.deviceType === "ipad" ? "📋" : repair.deviceType === "watch" ? "⌚" : "🔧"}
            </span>
          </div>
        </div>
        <p className="font-medium text-[#0F1720]">{repair.deviceModel}</p>
        <p className="text-sm text-[#4A7A8A] mt-1">{repair.symptoms}</p>
      </div>

      {/* Current Status */}
      <div className="bg-[#0F1720] rounded-2xl p-4 mb-4">
        <p className="text-[#85C1B2] text-xs mb-1">สถานะปัจจุบัน</p>
        <p className="text-white text-lg font-bold">{repairStatusText(repair.status)}</p>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#85C1B2]/20 p-6">
        <p className="text-sm font-bold text-[#0F1720] mb-4">Timeline</p>
        <div className="space-y-0">
          {STATUSES.map((s, i) => {
            const event = repair.timeline.find((e) => e.status === s);
            const isDone = i <= currentIdx;
            const isCurrent = i === currentIdx;

            return (
              <div key={s} className="flex items-start gap-3 pb-3 last:pb-0">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full border-2 ${isCurrent ? "bg-[#28EF33] border-[#28EF33] ring-4 ring-[#28EF33]/20" : isDone ? "bg-[#4A7A8A] border-[#4A7A8A]" : "bg-white border-[#85C1B2]/40"}`} />
                  {i < STATUSES.length - 1 && (
                    <div className={`w-0.5 h-5 ${isDone ? "bg-[#4A7A8A]" : "bg-[#85C1B2]/20"}`} />
                  )}
                </div>
                <div className={`-mt-0.5 ${isDone ? "" : "opacity-30"}`}>
                  <p className="text-sm font-medium text-[#0F1720]">{repairStatusText(s)}</p>
                  {event && (
                    <p className="text-xs text-[#4A7A8A]">
                      {event.createdAt.toLocaleDateString("th-TH")} {event.createdAt.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quote */}
      {repair.quotedPrice && (
        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-[#85C1B2]/20 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#4A7A8A]">ราคาประเมิน</p>
            <p className="text-xl font-bold text-[#0F1720]">฿{repair.quotedPrice.toLocaleString()}</p>
          </div>
          {repair.status === "quoted" && (
            <span className="text-xs bg-[#28EF33]/10 text-[#0F1720] px-3 py-1 rounded-full font-medium">รอยืนยัน</span>
          )}
        </div>
      )}

      {/* Footer */}
      <p className="text-center text-xs text-[#4A7A8A] mt-6">
        MorMac หมอแมค — Apple Device Specialist
      </p>
    </div>
  );
}
