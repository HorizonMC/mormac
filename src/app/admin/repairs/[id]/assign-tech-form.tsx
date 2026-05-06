"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface StaffOption {
  id: string;
  name: string;
}

export function AssignTechForm({
  repairId,
  currentTechId,
  staffList,
}: {
  repairId: string;
  currentTechId: string | null;
  staffList: StaffOption[];
}) {
  const [selectedId, setSelectedId] = useState(currentTechId || "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleAssign(techId: string) {
    if (!techId) return;
    setSaving(true);
    try {
      await fetch(`/api/repairs/${repairId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ techId }),
      });
      setSelectedId(techId);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex gap-2 items-center">
      <select
        value={selectedId}
        onChange={(e) => handleAssign(e.target.value)}
        disabled={saving}
        className="flex-1 rounded-xl px-4 py-2.5 text-sm disabled:opacity-50"
        style={{ border: "1px solid #0F172012" }}
      >
        <option value="">เลือกช่าง...</option>
        {staffList.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      {saving && <span className="text-xs" style={{ color: "#4A7A8A" }}>กำลังบันทึก...</span>}
    </div>
  );
}
