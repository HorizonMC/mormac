import { db } from "@/lib/db-client";
import { getBrand } from "@/lib/brand";
import { repairStatusText } from "@/lib/line";
import { notFound } from "next/navigation";
import { StatusUpdateForm } from "./status-form";
import { PartsUsedForm } from "./parts-used-form";
import { RepairPhotos } from "./repair-photos";
import { AssignTechForm } from "./assign-tech-form";

interface Props { params: Promise<{ id: string }>; }
export const dynamic = "force-dynamic";

interface RepairRating {
  id: string;
  score: number;
  comment?: string | null;
  createdAt: string | Date;
}

interface RepairDetail {
  id: string;
  repairCode: string;
  deviceModel: string;
  symptoms: string;
  status: string;
  techId?: string | null;
  photos?: string | null;
  quotedPrice?: number | null;
  finalPrice?: number | null;
  laborCost?: number | null;
  customer?: { name?: string | null; phone?: string | null } | null;
  tech?: { user?: { name?: string | null } | null } | null;
  partsUsed?: RepairPartUsed[];
  timeline?: RepairTimelineEvent[];
  rating?: RepairRating | null;
}

interface RepairPartUsed {
  id: string;
  quantity?: number | null;
  cost?: number | null;
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
  costPrice?: number | null;
  quantity?: number | null;
}

export default async function RepairDetailPage({ params }: Props) {
  const { id } = await params;
  const [repair, brand] = await Promise.all([
    db.repairs.get(id) as Promise<RepairDetail | null>,
    getBrand(),
  ]);
  if (!repair) notFound();

  const c = brand.colors;
  const staffList = await db.staff.list();
  const availableParts = ((await db.parts.list()) as AvailablePart[]).filter((p) => toNumber(p.quantity) > 0);
  const usedParts = repair.partsUsed || [];
  const partsCost = usedParts.reduce((sum, p) => sum + toNumber(p.cost), 0);
  const laborCost = toNumber(repair.laborCost);
  const totalCost = partsCost + laborCost;
  const revenue = repair.finalPrice ?? repair.quotedPrice ?? null;
  const profit = revenue !== null ? toNumber(revenue) - totalCost : null;
  const intakePhotos = parsePhotoPaths(repair.photos);
  const uploadBaseUrl = process.env.DB_API_URL || "http://localhost:4100";

  return (
    <div style={{ background: c.bg }} className="min-h-screen -m-4 p-4 sm:-m-6 sm:p-6">
      <div className="max-w-3xl">

        {/* Header Card */}
        <div className="rounded-2xl overflow-hidden shadow-sm mb-6" style={{ border: `1px solid ${c.dark}08` }}>
          <div className="p-5 sm:p-6" style={{ background: c.dark }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: c.mint }}>
                  งานซ่อม
                </p>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {repair.repairCode}
                </h1>
                <p className="text-sm mt-1" style={{ color: c.mint }}>
                  {repair.deviceModel} — {repair.symptoms}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="px-4 py-2 rounded-xl text-sm font-black"
                  style={{ background: c.accent, color: c.dark }}
                >
                  {repairStatusText(repair.status)}
                </span>
              </div>
            </div>
          </div>
          {/* Action links */}
          <div className="bg-white px-5 py-3 flex flex-wrap gap-2" style={{ borderTop: `1px solid ${c.dark}06` }}>
            <a
              href={`/api/repairs/jobsheet?code=${repair.repairCode}`}
              target="_blank"
              className="text-xs px-4 py-2 rounded-xl font-bold transition-all hover:opacity-90"
              style={{ background: c.dark, color: "#fff" }}
            >
              ใบรับซ่อม
            </a>
            <a
              href={`/api/repairs/cover?code=${repair.repairCode}`}
              target="_blank"
              className="text-xs px-4 py-2 rounded-xl font-bold transition-all"
              style={{ background: `${c.dark}08`, color: c.dark }}
            >
              ใบปะหน้า
            </a>
            <a
              href={`/track/${repair.repairCode}`}
              target="_blank"
              className="text-xs px-4 py-2 rounded-xl font-bold transition-all"
              style={{ background: `${c.dark}08`, color: c.dark }}
            >
              Tracking
            </a>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <InfoCard label="ลูกค้า" dark={c.dark} teal={c.teal}>
            <p className="font-bold" style={{ color: c.dark }}>{repair.customer?.name || "—"}</p>
            <p className="text-sm" style={{ color: c.teal }}>{repair.customer?.phone || ""}</p>
          </InfoCard>

          <InfoCard label="ช่าง" dark={c.dark} teal={c.teal}>
            <p className="font-bold mb-2" style={{ color: c.dark }}>
              {repair.tech?.user?.name || "ยังไม่ assign"}
            </p>
            <AssignTechForm
              repairId={repair.id}
              currentTechId={repair.techId ?? null}
              staffList={staffList.map((s) => ({ id: s.id, name: s.user?.name || s.username || "—" }))}
            />
          </InfoCard>

          <InfoCard label="ราคาประเมิน" dark={c.dark} teal={c.teal}>
            <p className="text-2xl font-black" style={{ color: c.dark }}>
              {repair.quotedPrice !== null && repair.quotedPrice !== undefined ? money(repair.quotedPrice) : "—"}
            </p>
          </InfoCard>
        </div>

        {/* Cost / Profit Card */}
        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 mb-6" style={{ border: `1px solid ${c.dark}08` }}>
          <p className="font-bold mb-4" style={{ color: c.dark }}>ต้นทุน / กำไร</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div className="text-center p-3 rounded-xl" style={{ background: `${c.dark}04` }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: c.teal }}>อะไหล่</p>
              <p className="text-lg font-black" style={{ color: c.dark }}>{money(partsCost)}</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: `${c.dark}04` }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: c.teal }}>ค่าแรง</p>
              <p className="text-lg font-black" style={{ color: c.dark }}>{money(laborCost)}</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: "#FEF2F2" }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#DC2626" }}>ต้นทุนรวม</p>
              <p className="text-lg font-black text-red-600">{money(totalCost)}</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: profit !== null && profit >= 0 ? `${c.accent}10` : "#FEF2F2" }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: c.teal }}>กำไร</p>
              <p className="text-lg font-black" style={{ color: profit !== null && profit >= 0 ? c.accent : "#EF4444" }}>
                {profit !== null ? `${profit >= 0 ? "+" : ""}${money(profit)}` : "—"}
              </p>
            </div>
          </div>

          {usedParts.length > 0 && (
            <div className="mb-4 rounded-xl overflow-hidden" style={{ border: `1px solid ${c.dark}06` }}>
              {usedParts.map((pu) => (
                <div key={pu.id} className="flex justify-between text-sm px-4 py-2.5" style={{ borderBottom: `1px solid ${c.dark}06` }}>
                  <span style={{ color: c.dark }}>{pu.part?.name || "อะไหล่"} x{toNumber(pu.quantity)}</span>
                  <span style={{ color: c.teal }}>{money(pu.cost)}</span>
                </div>
              ))}
            </div>
          )}

          <PartsUsedForm repairId={repair.id} availableParts={availableParts.map((p) => ({ id: p.id, name: p.name, costPrice: toNumber(p.costPrice), quantity: toNumber(p.quantity) }))} currentLaborCost={laborCost} />
        </div>

        {/* Status Update Card */}
        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 mb-6" style={{ border: `1px solid ${c.dark}08` }}>
          <p className="font-bold mb-4" style={{ color: c.dark }}>อัพเดทสถานะ</p>
          <StatusUpdateForm repairId={repair.id} currentStatus={repair.status} />
        </div>

        {/* Intake Photos */}
        {intakePhotos.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 mb-6" style={{ border: `1px solid ${c.dark}08` }}>
            <p className="font-bold mb-4" style={{ color: c.dark }}>รูปจากลูกค้า (ก่อนส่งเครื่อง)</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {intakePhotos.map((photo) => (
                <a key={photo} href={imageUrl(photo, uploadBaseUrl)} target="_blank" className="block aspect-square rounded-xl overflow-hidden bg-gray-50" style={{ border: `1px solid ${c.dark}08` }}>
                  <img src={imageUrl(photo, uploadBaseUrl)} alt="Intake" className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Repair Photos */}
        <RepairPhotos repairId={repair.id} initialPhotos={[]} uploadBaseUrl={uploadBaseUrl} />

        {/* Customer Rating */}
        {repair.rating && (
          <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 mb-6" style={{ border: `1px solid ${c.dark}08` }}>
            <p className="font-bold mb-4" style={{ color: c.dark }}>คะแนนจากลูกค้า</p>
            <div className="flex items-center gap-3">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill={star <= repair.rating!.score ? "#FFD700" : "#D1D5DB"}
                    stroke={star <= repair.rating!.score ? "#FFD700" : "#D1D5DB"}
                    strokeWidth="1"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <span className="text-lg font-black" style={{ color: c.dark }}>{repair.rating.score}/5</span>
            </div>
            {repair.rating.comment && (
              <p className="text-sm mt-3 p-3 rounded-xl" style={{ background: `${c.dark}04`, color: c.teal }}>
                {repair.rating.comment}
              </p>
            )}
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6" style={{ border: `1px solid ${c.dark}08` }}>
          <p className="font-bold mb-5" style={{ color: c.dark }}>ประวัติ</p>
          <div className="relative">
            {repair.timeline && repair.timeline.length > 0 && (
              <div
                className="absolute left-[7px] top-2 bottom-2 w-0.5"
                style={{ background: `${c.dark}12` }}
              />
            )}
            <div className="space-y-4">
              {repair.timeline?.map((e, i) => (
                <div key={e.id} className="flex items-start gap-4 relative">
                  {/* Dot */}
                  <div
                    className="w-4 h-4 rounded-full shrink-0 mt-0.5 z-10"
                    style={{
                      background: i === 0 ? c.accent : c.dark,
                      border: `2px solid ${c.bg}`,
                    }}
                  />
                  <div className="min-w-0 flex-1 pb-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <span className="font-bold text-sm" style={{ color: c.dark }}>
                        {repairStatusText(e.status)}
                      </span>
                      <span className="text-xs" style={{ color: c.teal }}>
                        {formatDateTime(e.createdAt)}
                      </span>
                    </div>
                    {e.note && (
                      <p className="text-sm mt-0.5" style={{ color: c.mint }}>{e.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  label,
  dark,
  teal,
  children,
}: {
  label: string;
  dark: string;
  teal: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4" style={{ border: `1px solid ${dark}08` }}>
      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: teal }}>{label}</p>
      {children}
    </div>
  );
}

function parsePhotoPaths(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter(isPhotoPath);
    if (parsed && typeof parsed === "object" && "intakePhotos" in parsed) {
      const photos = (parsed as { intakePhotos?: unknown }).intakePhotos;
      return Array.isArray(photos) ? photos.filter(isPhotoPath) : [];
    }
    return [];
  } catch {
    return [];
  }
}

function isPhotoPath(item: unknown): item is string {
  return typeof item === "string" && item.length > 0;
}

function imageUrl(path: string, baseUrl: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedBase = baseUrl.replace(/\/$/, "");
  return `${normalizedBase}${path.startsWith("/") ? path : `/${path}`}`;
}

function toNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function money(value: number | null | undefined) {
  return `฿${toNumber(value).toLocaleString("th-TH")}`;
}

function formatDateTime(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.toLocaleDateString("th-TH")} ${date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}`;
}
