import { redirect } from "next/navigation";
import { getTechSession } from "@/lib/tech-auth";
import { db } from "@/lib/db-client";
import { repairStatusText } from "@/lib/line";
import { getBrand } from "@/lib/brand";
import Link from "next/link";
import { TechStatusForm } from "./tech-status-form";
import { TechRequisitionForm } from "./tech-requisition-form";

export const dynamic = "force-dynamic";

function statusBadgeColor(status: string): { bg: string; text: string } {
  if (["done", "shipped", "returned"].includes(status)) return { bg: "#DCFCE7", text: "#166534" };
  if (["repairing", "qc", "confirmed"].includes(status)) return { bg: "#DBEAFE", text: "#1E40AF" };
  if (["quoted"].includes(status)) return { bg: "#FEF3C7", text: "#92400E" };
  if (["cancelled"].includes(status)) return { bg: "#FEE2E2", text: "#991B1B" };
  return { bg: "#F3F4F6", text: "#374151" };
}

export default async function TechRepairDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getTechSession();
  if (!session) redirect("/tech/login");

  const { id } = await params;
  const brand = await getBrand();
  const c = brand.colors;

  let repair;
  try {
    repair = await db.tech.repairDetail(session.staffId, id);
  } catch {
    redirect("/tech");
  }

  // Verify tech owns this repair
  if (repair.techId !== session.staffId) redirect("/tech");

  const badge = statusBadgeColor(repair.status);

  let parts: Awaited<ReturnType<typeof db.parts.list>> = [];
  try {
    parts = await db.parts.list();
  } catch {
    // Parts API might be down
  }

  const partsCost = (repair.partsUsed || []).reduce(
    (sum: number, p: any) => sum + (p.cost || 0),
    0
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Back link */}
      <Link href="/tech" className="text-sm flex items-center gap-1" style={{ color: c.teal }}>
        <span>←</span> กลับไปรายการ
      </Link>

      {/* Repair info card */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold font-mono" style={{ color: c.dark }}>
            {repair.repairCode}
          </h1>
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ background: badge.bg, color: badge.text }}
          >
            {repairStatusText(repair.status)}
          </span>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <InfoRow label="อุปกรณ์" value={repair.deviceModel} />
          <InfoRow label="อาการ" value={repair.symptoms} />
          {repair.diagnosis && <InfoRow label="วินิจฉัย" value={repair.diagnosis} />}
          {repair.customer?.name && <InfoRow label="ลูกค้า" value={repair.customer.name} />}
          {repair.serialNo && <InfoRow label="S/N" value={repair.serialNo} />}
          {repair.imei && <InfoRow label="IMEI" value={repair.imei} />}
        </div>
      </div>

      {/* Status update */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
        <TechStatusForm
          repairId={id}
          currentStatus={repair.status}
          accent={c.accent}
          teal={c.teal}
          dark={c.dark}
        />
      </div>

      {/* Parts used */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold" style={{ color: c.dark }}>อะไหล่ที่ใช้</h3>
          {partsCost > 0 && (
            <span className="text-sm font-bold" style={{ color: c.teal }}>
              รวม ฿{partsCost.toLocaleString()}
            </span>
          )}
        </div>
        {(repair.partsUsed || []).length > 0 ? (
          <div className="flex flex-col gap-2">
            {(repair.partsUsed as any[]).map((p: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm"
              >
                <span className="text-gray-700">{p.name || p.partId}</span>
                <div className="flex items-center gap-3 text-gray-500">
                  <span>x{p.quantity}</span>
                  <span className="font-medium" style={{ color: c.dark }}>
                    ฿{(p.cost || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">ยังไม่มีอะไหล่</p>
        )}
      </div>

      {/* Requisition form */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
        <TechRequisitionForm
          repairId={id}
          parts={parts.map((p) => ({
            id: p.id,
            name: p.name,
            costPrice: p.costPrice,
            quantity: p.quantity,
          }))}
          accent={c.accent}
          teal={c.teal}
          dark={c.dark}
        />
      </div>

      {/* Timeline */}
      {repair.timeline && repair.timeline.length > 0 && (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold mb-3" style={{ color: c.dark }}>ไทม์ไลน์</h3>
          <div className="flex flex-col gap-0">
            {repair.timeline.map((event, i) => (
              <div key={event.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className="w-3 h-3 rounded-full mt-1"
                    style={{ background: i === 0 ? c.accent : "#D1D5DB" }}
                  />
                  {i < repair.timeline!.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-200" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium" style={{ color: c.dark }}>
                    {repairStatusText(event.status)}
                  </p>
                  {event.note && (
                    <p className="text-xs text-gray-500 mt-0.5">{event.note}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(event.createdAt).toLocaleString("th-TH", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {event.actor && ` — ${event.actor}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 min-w-[70px] shrink-0">{label}</span>
      <span className="text-gray-700">{value}</span>
    </div>
  );
}
