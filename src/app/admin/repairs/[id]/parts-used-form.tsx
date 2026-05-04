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
    <div className="space-y-3 pt-2 border-t border-gray-100">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-xs text-gray-500">เบิกอะไหล่</label>
          <select
            value={selectedPart}
            onChange={(e) => setSelectedPart(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
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
          <label className="text-xs text-gray-500">จำนวน</label>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(parseInt(e.target.value) || 1)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={addPart}
          disabled={!selectedPart || saving}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50"
        >
          เบิก
        </button>
      </div>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-xs text-gray-500">ค่าแรง (บาท)</label>
          <input
            type="number"
            value={labor}
            onChange={(e) => setLabor(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={updateLabor}
          disabled={saving}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm disabled:opacity-50"
        >
          บันทึกค่าแรง
        </button>
      </div>
    </div>
  );
}
