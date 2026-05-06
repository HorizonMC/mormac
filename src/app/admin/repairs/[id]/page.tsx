import { db } from "@/lib/db-client";
import { repairStatusText } from "@/lib/line";
import { notFound } from "next/navigation";
import { StatusUpdateForm } from "./status-form";
import { PartsUsedForm } from "./parts-used-form";
import { RepairPhotos } from "./repair-photos";

interface Props { params: Promise<{ id: string }>; }
export const dynamic = "force-dynamic";

interface RepairDetail {
  id: string;
  repairCode: string;
  deviceModel: string;
  symptoms: string;
  status: string;
  photos?: string | null;
  quotedPrice?: number | null;
  finalPrice?: number | null;
  laborCost?: number | null;
  customer?: { name?: string | null; phone?: string | null } | null;
  tech?: { user?: { name?: string | null } | null } | null;
  partsUsed?: RepairPartUsed[];
  timeline?: RepairTimelineEvent[];
}

interface RepairPartUsed {
  id: string;
  quantity: number;
  cost: number;
  part?: { name?: string | null } | null;
}

interface RepairTimelineEvent {
  id: string;
  status: string;
  note?: string | null;
  createdAt: string | Date;
}

interface AvailablePart {
  id: string;
  name: string;
  costPrice: number;
  quantity: number;
}

export default async function RepairDetailPage({ params }: Props) {
  const { id } = await params;
  const repair = (await db.repairs.get(id)) as RepairDetail | null;
  if (!repair) notFound();

  const availableParts = ((await db.parts.list()) as AvailablePart[]).filter((p) => p.quantity > 0);
  const usedParts = repair.partsUsed || [];
  const partsCost = usedParts.reduce((sum, p) => sum + p.cost, 0);
  const laborCost = repair.laborCost || 0;
  const totalCost = partsCost + laborCost;
  const profit = repair.finalPrice ? repair.finalPrice - totalCost : repair.quotedPrice ? repair.quotedPrice - totalCost : null;
  const intakePhotos = parsePhotoPaths(repair.photos);
  const uploadBaseUrl = process.env.DB_API_URL || "http://localhost:4100";

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold">{repair.repairCode}</h1>
        <div className="flex gap-2">
          <a href={`/api/repairs/jobsheet?code=${repair.repairCode}`} target="_blank" className="text-xs px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-700">🖨️ ใบรับซ่อม</a>
          <a href={`/api/repairs/cover?code=${repair.repairCode}`} target="_blank" className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200">📋 ใบปะหน้า</a>
          <a href={`/track/${repair.repairCode}`} target="_blank" className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200">🔗 Tracking</a>
        </div>
      </div>
      <p className="text-gray-500 text-sm mb-6">{repair.deviceModel} — {repair.symptoms}</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <InfoCard label="สถานะ" value={repairStatusText(repair.status)} />
        <InfoCard label="ลูกค้า" value={`${repair.customer?.name || ""} ${repair.customer?.phone || ""}`} />
        <InfoCard label="ช่าง" value={repair.tech?.user?.name || "ยังไม่ assign"} />
        <InfoCard label="ราคาประเมิน" value={repair.quotedPrice ? `฿${repair.quotedPrice.toLocaleString()}` : "—"} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <p className="font-bold text-sm mb-3">ต้นทุน / กำไร</p>
        <div className="grid grid-cols-4 gap-3 text-center mb-4">
          <div><p className="text-xs text-gray-500">อะไหล่</p><p className="font-bold">฿{partsCost.toLocaleString()}</p></div>
          <div><p className="text-xs text-gray-500">ค่าแรง</p><p className="font-bold">฿{laborCost.toLocaleString()}</p></div>
          <div><p className="text-xs text-gray-500">ต้นทุนรวม</p><p className="font-bold text-red-600">฿{totalCost.toLocaleString()}</p></div>
          <div><p className="text-xs text-gray-500">กำไร</p><p className={`font-bold ${profit !== null && profit >= 0 ? "text-green-600" : "text-red-600"}`}>{profit !== null ? `${profit >= 0 ? "+" : ""}฿${profit.toLocaleString()}` : "—"}</p></div>
        </div>
        {usedParts.length > 0 && (
          <div className="mb-3">{usedParts.map((pu) => (
            <div key={pu.id} className="flex justify-between text-sm py-1 border-b border-gray-50">
              <span>{pu.part?.name} x{pu.quantity}</span><span className="text-gray-500">฿{pu.cost.toLocaleString()}</span>
            </div>
          ))}</div>
        )}
        <PartsUsedForm repairId={repair.id} availableParts={availableParts.map((p) => ({ id: p.id, name: p.name, costPrice: p.costPrice, quantity: p.quantity }))} currentLaborCost={laborCost} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <p className="font-bold text-sm mb-3">อัพเดทสถานะ</p>
        <StatusUpdateForm repairId={repair.id} currentStatus={repair.status} />
      </div>

      {intakePhotos.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <p className="font-bold text-sm mb-3">📸 รูปจากลูกค้า (ก่อนส่งเครื่อง)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {intakePhotos.map((photo) => (
              <a key={photo} href={`${uploadBaseUrl}${photo}`} target="_blank" className="block aspect-square rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                <img src={`${uploadBaseUrl}${photo}`} alt="Intake" className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        </div>
      )}

      <RepairPhotos repairId={repair.id} initialPhotos={[]} uploadBaseUrl={uploadBaseUrl} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <p className="font-bold text-sm mb-3">ประวัติ</p>
        {repair.timeline?.map((e) => (
          <div key={e.id} className="flex items-center gap-3 text-sm">
            <span className="text-gray-400 w-32 shrink-0">{new Date(e.createdAt).toLocaleDateString("th-TH")} {new Date(e.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</span>
            <span className="font-medium">{repairStatusText(e.status)}</span>
            {e.note && <span className="text-gray-400">— {e.note}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3"><p className="text-xs text-gray-500">{label}</p><p className="font-medium">{value}</p></div>);
}

function parsePhotoPaths(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}
