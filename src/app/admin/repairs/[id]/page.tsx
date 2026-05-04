import { prisma } from "@/lib/prisma";
import { repairStatusText } from "@/lib/line";
import { notFound } from "next/navigation";
import { StatusUpdateForm } from "./status-form";
import { PartsUsedForm } from "./parts-used-form";

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
      shop: true,
      tech: { include: { user: true } },
      timeline: { orderBy: { createdAt: "desc" } },
      partsUsed: { include: { part: true } },
    },
  });

  if (!repair) notFound();

  const availableParts = await prisma.part.findMany({
    where: { shopId: repair.shopId, quantity: { gt: 0 } },
    orderBy: { name: "asc" },
  });

  const partsCost = repair.partsUsed.reduce((sum, p) => sum + p.cost, 0);
  const laborCost = repair.laborCost || 0;
  const totalCost = partsCost + laborCost;
  const profit = repair.finalPrice ? repair.finalPrice - totalCost : repair.quotedPrice ? repair.quotedPrice - totalCost : null;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold">{repair.repairCode}</h1>
        <div className="flex gap-2">
          <a href={`/api/repairs/cover?code=${repair.repairCode}`} target="_blank" className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition">🖨️ ใบปะหน้าซอง</a>
          <a href={`/track/${repair.repairCode}`} target="_blank" className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition">🔗 Tracking</a>
        </div>
      </div>
      <p className="text-gray-500 text-sm mb-6">{repair.deviceModel} — {repair.symptoms}</p>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <InfoCard label="สถานะ" value={repairStatusText(repair.status)} />
        <InfoCard label="ลูกค้า" value={`${repair.customer.name} ${repair.customer.phone || ""}`} />
        <InfoCard label="ช่าง" value={repair.tech?.user.name || "ยังไม่ assign"} />
        <InfoCard label="ราคาประเมิน" value={repair.quotedPrice ? `฿${repair.quotedPrice.toLocaleString()}` : "—"} />
      </div>

      {/* Costing */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <p className="font-bold text-sm mb-3">ต้นทุน / กำไร</p>
        <div className="grid grid-cols-4 gap-3 text-center mb-4">
          <div>
            <p className="text-xs text-gray-500">อะไหล่</p>
            <p className="font-bold">฿{partsCost.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">ค่าแรง</p>
            <p className="font-bold">฿{laborCost.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">ต้นทุนรวม</p>
            <p className="font-bold text-red-600">฿{totalCost.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">กำไร</p>
            <p className={`font-bold ${profit !== null && profit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {profit !== null ? `${profit >= 0 ? "+" : ""}฿${profit.toLocaleString()}` : "—"}
            </p>
          </div>
        </div>

        {/* Parts used */}
        {repair.partsUsed.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">อะไหล่ที่ใช้</p>
            {repair.partsUsed.map((pu) => (
              <div key={pu.id} className="flex justify-between text-sm py-1 border-b border-gray-50">
                <span>{pu.part.name} x{pu.quantity}</span>
                <span className="text-gray-500">฿{pu.cost.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        <PartsUsedForm
          repairId={repair.id}
          availableParts={availableParts.map((p) => ({ id: p.id, name: p.name, costPrice: p.costPrice, quantity: p.quantity }))}
          currentLaborCost={laborCost}
        />
      </div>

      {/* Status Update */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <p className="font-bold text-sm mb-3">อัพเดทสถานะ</p>
        <StatusUpdateForm repairId={repair.id} currentStatus={repair.status} />
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <p className="font-bold text-sm mb-3">ประวัติ</p>
        <div className="space-y-2">
          {repair.timeline.map((e) => (
            <div key={e.id} className="flex items-center gap-3 text-sm">
              <span className="text-gray-400 w-32 shrink-0">
                {e.createdAt.toLocaleDateString("th-TH")} {e.createdAt.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="font-medium">{repairStatusText(e.status)}</span>
              {e.note && <span className="text-gray-400">— {e.note}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
