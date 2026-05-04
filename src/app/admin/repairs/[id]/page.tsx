import { prisma } from "@/lib/prisma";
import { repairStatusText } from "@/lib/line";
import { notFound } from "next/navigation";
import { StatusUpdateForm } from "./status-form";

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function RepairDetailPage({ params }: Props) {
  const { id } = await params;

  const repair = await prisma.repair.findUnique({
    where: { id },
    include: {
      customer: true,
      tech: { include: { user: true } },
      timeline: { orderBy: { createdAt: "desc" } },
      partsUsed: { include: { part: true } },
    },
  });

  if (!repair) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-[#0F1720] mb-1">{repair.repairCode}</h1>
      <p className="text-[#4A7A8A] text-sm mb-6">{repair.deviceModel} — {repair.symptoms}</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <InfoCard label="สถานะ" value={repairStatusText(repair.status)} />
        <InfoCard label="ลูกค้า" value={repair.customer.name} />
        <InfoCard label="ช่าง" value={repair.tech?.user.name || "ยังไม่ assign"} />
        <InfoCard label="ราคาประเมิน" value={repair.quotedPrice ? `฿${repair.quotedPrice.toLocaleString()}` : "—"} />
      </div>

      {/* Status Update */}
      <div className="bg-white rounded-xl shadow-sm border border-[#85C1B2]/20 p-4 mb-6">
        <p className="font-bold text-sm mb-3">อัพเดทสถานะ</p>
        <StatusUpdateForm repairId={repair.id} currentStatus={repair.status} />
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-[#85C1B2]/20 p-4">
        <p className="font-bold text-sm mb-3">ประวัติ</p>
        <div className="space-y-2">
          {repair.timeline.map((e) => (
            <div key={e.id} className="flex items-center gap-3 text-sm">
              <span className="text-[#4A7A8A] w-32 shrink-0">
                {e.createdAt.toLocaleDateString("th-TH")} {e.createdAt.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="font-medium">{repairStatusText(e.status)}</span>
              {e.note && <span className="text-[#4A7A8A]">— {e.note}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#85C1B2]/20 p-3">
      <p className="text-xs text-[#4A7A8A]">{label}</p>
      <p className="font-medium text-[#0F1720]">{value}</p>
    </div>
  );
}
