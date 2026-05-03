import { prisma } from "@/lib/prisma";
import { repairStatusText } from "@/lib/line";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ code: string }>;
}

export default async function TrackPage({ params }: Props) {
  const { code } = await params;

  const repair = await prisma.repair.findUnique({
    where: { repairCode: code },
    include: { timeline: { orderBy: { createdAt: "asc" } } },
  });

  if (!repair) notFound();

  const statuses = ["submitted", "received", "diagnosing", "quoted", "confirmed", "repairing", "qc", "done", "shipped", "returned"];
  const currentIdx = statuses.indexOf(repair.status);

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h1 className="text-xl font-bold text-center mb-1">หมอแมค MorMac</h1>
        <p className="text-center text-gray-500 text-sm mb-6">ติดตามสถานะการซ่อม</p>

        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-500">เลขซ่อม</p>
          <p className="text-lg font-mono font-bold">{repair.repairCode}</p>
          <p className="text-sm mt-2">{repair.deviceModel}</p>
          <p className="text-sm text-gray-600">{repair.symptoms}</p>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium mb-3">สถานะปัจจุบัน</p>
          <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-3">
            <span className="text-2xl">{repairStatusText(repair.status).split(" ")[0]}</span>
            <span className="font-medium">{repairStatusText(repair.status).slice(2)}</span>
          </div>
        </div>

        <div className="space-y-0">
          <p className="text-sm font-medium mb-3">Timeline</p>
          {statuses.map((s, i) => {
            const event = repair.timeline.find((e) => e.status === s);
            const isDone = i <= currentIdx;
            const isCurrent = i === currentIdx;

            return (
              <div key={s} className="flex items-start gap-3 pb-4 last:pb-0">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${isCurrent ? "bg-blue-500 ring-4 ring-blue-100" : isDone ? "bg-green-500" : "bg-gray-200"}`} />
                  {i < statuses.length - 1 && (
                    <div className={`w-0.5 h-6 ${isDone ? "bg-green-300" : "bg-gray-200"}`} />
                  )}
                </div>
                <div className={`-mt-0.5 ${isDone ? "" : "opacity-40"}`}>
                  <p className="text-sm font-medium">{repairStatusText(s)}</p>
                  {event && (
                    <p className="text-xs text-gray-500">
                      {event.createdAt.toLocaleDateString("th-TH")} {event.createdAt.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {repair.quotedPrice && (
          <div className="mt-6 bg-yellow-50 rounded-xl p-4">
            <p className="text-sm text-gray-600">ราคาประเมิน</p>
            <p className="text-xl font-bold">฿{repair.quotedPrice.toLocaleString()}</p>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-gray-400 mt-4">
        หมอแมค MorMac — Apple Device Repair
      </p>
    </div>
  );
}
