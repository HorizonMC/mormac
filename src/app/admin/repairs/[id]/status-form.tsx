"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_FLOW: Record<string, string[]> = {
  submitted: ["received"],
  received: ["diagnosing"],
  diagnosing: ["quoted"],
  quoted: ["confirmed", "cancelled"],
  confirmed: ["repairing"],
  repairing: ["qc"],
  qc: ["done"],
  done: ["shipped"],
  shipped: ["returned"],
};

const STATUS_LABELS: Record<string, string> = {
  received: "รับเครื่องแล้ว",
  diagnosing: "กำลังตรวจ",
  quoted: "ประเมินราคา",
  confirmed: "ยืนยันซ่อม",
  repairing: "กำลังซ่อม",
  qc: "ตรวจสอบ QC",
  done: "ซ่อมเสร็จ",
  shipped: "จัดส่งแล้ว",
  returned: "ลูกค้ารับแล้ว",
  cancelled: "ยกเลิก",
};

export function StatusUpdateForm({ repairId, currentStatus }: { repairId: string; currentStatus: string }) {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [price, setPrice] = useState("");
  const router = useRouter();

  const nextStatuses = STATUS_FLOW[currentStatus] || [];

  async function updateStatus(status: string) {
    setLoading(true);
    try {
      await fetch(`/api/repairs/${repairId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          note: note || undefined,
          quotedPrice: status === "quoted" && price ? parseFloat(price) : undefined,
          actor: "admin",
        }),
      });
      setNote("");
      setPrice("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (nextStatuses.length === 0) {
    return <p className="text-sm font-bold" style={{ color: "#4A7A8A" }}>งานนี้เสร็จสิ้นแล้ว</p>;
  }

  return (
    <div className="space-y-3">
      {currentStatus === "diagnosing" && (
        <input
          type="number"
          placeholder="ราคาประเมิน (บาท)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
          style={{ border: "1px solid #0F172012" }}
        />
      )}
      <input
        type="text"
        placeholder="หมายเหตุ (ไม่บังคับ)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
        style={{ border: "1px solid #0F172012" }}
      />
      <div className="flex gap-2 flex-wrap">
        {nextStatuses.map((s) => (
          <button
            key={s}
            onClick={() => updateStatus(s)}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 hover:opacity-90"
            style={
              s === "cancelled"
                ? { background: "#FEF2F2", color: "#DC2626" }
                : { background: "#0F1720", color: "#fff" }
            }
          >
            {loading ? "..." : STATUS_LABELS[s] || s}
          </button>
        ))}
      </div>
    </div>
  );
}
