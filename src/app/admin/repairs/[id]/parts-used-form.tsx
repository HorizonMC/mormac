"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AvailablePart {
  id: string;
  name: string;
  costPrice: number;
  quantity: number;
}

export function PartsUsedForm({
  repairId,
  availableParts,
  currentLaborCost,
}: {
  repairId: string;
  availableParts: AvailablePart[];
  currentLaborCost: number;
}) {
  const [selectedPart, setSelectedPart] = useState("");
  const [qty, setQty] = useState(1);
  const [labor, setLabor] = useState(String(currentLaborCost));
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function addPart() {
    if (!selectedPart) return;
    setSaving(true);
    const part = availableParts.find((p) => p.id === selectedPart);
    if (!part) return;

    await fetch(`/api/repairs/${repairId}/parts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partId: part.id, quantity: qty, cost: part.costPrice * qty }),
    });
    setSelectedPart("");
    setQty(1);
    setSaving(false);
    router.refresh();
  }

  async function updateLabor() {
    setSaving(true);
    await fetch(`/api/repairs/${repairId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: undefined, laborCost: parseFloat(labor) || 0 }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-4 pt-4" style={{ borderTop: "1px solid #0F172008" }}>
      <div className="flex gap-2 items-end flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#4A7A8A" }}>เบิกอะไหล่</label>
          <select
            value={selectedPart}
            onChange={(e) => setSelectedPart(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm"
            style={{ border: "1px solid #0F172012" }}
          >
            <option value="">เลือกอะไหล่...</option>
            {availableParts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (เหลือ {p.quantity}) — ฿{p.costPrice}
              </option>
            ))}
          </select>
        </div>
        <div className="w-20">
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#4A7A8A" }}>จำนวน</label>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(parseInt(e.target.value) || 1)}
            className="w-full rounded-xl px-4 py-2.5 text-sm"
            style={{ border: "1px solid #0F172012" }}
          />
        </div>
        <button
          onClick={addPart}
          disabled={!selectedPart || saving}
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all hover:opacity-90"
          style={{ background: "#0F1720" }}
        >
          เบิก
        </button>
      </div>

      <div className="flex gap-2 items-end flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#4A7A8A" }}>ค่าแรง (บาท)</label>
          <input
            type="number"
            value={labor}
            onChange={(e) => setLabor(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm"
            style={{ border: "1px solid #0F172012" }}
          />
        </div>
        <button
          onClick={updateLabor}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-all"
          style={{ background: "#0F172006", color: "#0F1720" }}
        >
          บันทึกค่าแรง
        </button>
      </div>
    </div>
  );
}
