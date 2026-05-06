"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Part = {
  id: string;
  name: string;
  costPrice: number;
  quantity: number;
};

type Props = {
  repairId: string;
  parts: Part[];
  accent: string;
  teal: string;
  dark: string;
};

export function TechRequisitionForm({ repairId, parts, accent, teal, dark }: Props) {
  const router = useRouter();
  const [partId, setPartId] = useState("");
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedPart = parts.find((p) => p.id === partId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!partId || qty < 1) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const cost = selectedPart ? selectedPart.costPrice * qty : 0;
      const res = await fetch(`/api/tech/repairs/${repairId}/requisition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partId, quantity: qty, cost }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "ไม่สามารถเบิกอะไหล่ได้");
      }
      setSuccess("เบิกอะไหล่สำเร็จ");
      setPartId("");
      setQty(1);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h3 className="text-sm font-bold mb-3" style={{ color: dark }}>เบิกอะไหล่</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <select
          value={partId}
          onChange={(e) => setPartId(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm bg-white focus:outline-none focus:ring-2"
          style={{ focusRingColor: accent } as any}
          required
        >
          <option value="">-- เลือกอะไหล่ --</option>
          {parts.map((p) => (
            <option key={p.id} value={p.id} disabled={p.quantity < 1}>
              {p.name} (คงเหลือ {p.quantity}) - ฿{p.costPrice.toLocaleString()}
            </option>
          ))}
        </select>

        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">จำนวน</label>
            <input
              type="number"
              min={1}
              max={selectedPart?.quantity || 99}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm focus:outline-none focus:ring-2"
              required
            />
          </div>
          {selectedPart && (
            <div className="text-sm font-bold pb-3" style={{ color: dark }}>
              ฿{(selectedPart.costPrice * qty).toLocaleString()}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !partId}
          className="rounded-xl px-4 py-3 text-sm font-bold text-white transition-opacity disabled:opacity-50"
          style={{ background: teal }}
        >
          {loading ? "กำลังเบิก..." : "เบิกอะไหล่"}
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-2 text-sm" style={{ color: accent }}>{success}</p>}
    </div>
  );
}
