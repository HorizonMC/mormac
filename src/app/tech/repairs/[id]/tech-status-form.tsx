"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  repairId: string;
  currentStatus: string;
  accent: string;
  teal: string;
  dark: string;
};

const techStatuses = [
  { value: "diagnosing", label: "กำลังตรวจอาการ", icon: "🔍" },
  { value: "repairing", label: "กำลังซ่อม", icon: "🔧" },
  { value: "qc", label: "ตรวจสอบคุณภาพ", icon: "✅" },
  { value: "done", label: "ซ่อมเสร็จ", icon: "✨" },
];

export function TechStatusForm({ repairId, currentStatus, accent, teal, dark }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function updateStatus(status: string) {
    setLoading(status);
    setError("");
    try {
      const res = await fetch(`/api/tech/repairs/${repairId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "ไม่สามารถอัพเดทสถานะได้");
      }
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <h3 className="text-sm font-bold mb-3" style={{ color: dark }}>อัพเดทสถานะ</h3>
      <div className="grid grid-cols-2 gap-2">
        {techStatuses.map((s) => {
          const isCurrent = s.value === currentStatus;
          return (
            <button
              key={s.value}
              type="button"
              disabled={isCurrent || loading !== null}
              onClick={() => updateStatus(s.value)}
              className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium transition-all disabled:opacity-50"
              style={{
                background: isCurrent ? accent : "white",
                color: isCurrent ? dark : teal,
                border: `2px solid ${isCurrent ? accent : "#E5E7EB"}`,
              }}
            >
              <span className="text-lg">{s.icon}</span>
              <span>{s.label}</span>
              {loading === s.value && <span className="ml-auto animate-spin">⏳</span>}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
