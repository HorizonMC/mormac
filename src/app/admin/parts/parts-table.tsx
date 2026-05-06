"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Part {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  quantity: number;
  costPrice: number;
  alertAt: number;
  shopId: string;
}

const CATEGORIES = [
  { value: "screen", label: "จอ" },
  { value: "battery", label: "แบตเตอรี่" },
  { value: "board", label: "บอร์ด" },
  { value: "connector", label: "สายแพ/ขั้วต่อ" },
  { value: "other", label: "อื่นๆ" },
];

export function PartsTable({ parts: initial, defaultShopId }: { parts: Part[]; defaultShopId: string }) {
  const [parts, setParts] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState(0);
  const router = useRouter();

  async function addPart(form: FormData) {
    const body = {
      shopId: defaultShopId,
      name: form.get("name") as string,
      sku: (form.get("sku") as string) || null,
      category: form.get("category") as string,
      quantity: parseInt(form.get("quantity") as string) || 0,
      costPrice: parseFloat(form.get("costPrice") as string) || 0,
      alertAt: parseInt(form.get("alertAt") as string) || 3,
    };

    const res = await fetch("/api/parts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const part = await res.json();
    setParts((p) => [...p, part].sort((a, b) => a.name.localeCompare(b.name)));
    setShowAdd(false);
  }

  async function updateQty(id: string, quantity: number) {
    await fetch("/api/parts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, quantity }),
    });
    setParts((p) => p.map((x) => (x.id === id ? { ...x, quantity } : x)));
    setEditId(null);
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={() => setShowAdd(!showAdd)}
        className="mb-5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
        style={{ background: "#28EF33", color: "#0F1720" }}
      >
        + เพิ่มอะไหล่
      </button>

      {showAdd && (
        <form
          action={addPart}
          className="bg-white rounded-2xl shadow-sm p-5 mb-5 grid grid-cols-2 md:grid-cols-4 gap-4"
          style={{ border: "1px solid #0F172008" }}
        >
          <div className="col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#4A7A8A" }}>ชื่ออะไหล่</label>
            <input name="name" required className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2" style={{ border: "1px solid #0F172012", outlineColor: "#28EF33" }} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#4A7A8A" }}>SKU</label>
            <input name="sku" className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ border: "1px solid #0F172012" }} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#4A7A8A" }}>หมวด</label>
            <select name="category" className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ border: "1px solid #0F172012" }}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#4A7A8A" }}>จำนวน</label>
            <input name="quantity" type="number" defaultValue={0} className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ border: "1px solid #0F172012" }} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#4A7A8A" }}>ราคาต้นทุน</label>
            <input name="costPrice" type="number" required className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ border: "1px solid #0F172012" }} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#4A7A8A" }}>แจ้งเตือนเมื่อเหลือ</label>
            <input name="alertAt" type="number" defaultValue={3} className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ border: "1px solid #0F172012" }} />
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "#0F1720" }}>บันทึก</button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2.5 rounded-xl text-sm" style={{ color: "#4A7A8A" }}>ยกเลิก</button>
          </div>
        </form>
      )}

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: "1px solid #0F172008" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#0F172004" }}>
              <th className="p-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "#4A7A8A" }}>ชื่ออะไหล่</th>
              <th className="p-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "#4A7A8A" }}>หมวด</th>
              <th className="p-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "#4A7A8A" }}>SKU</th>
              <th className="p-4 text-right text-xs font-bold uppercase tracking-wider" style={{ color: "#4A7A8A" }}>จำนวน</th>
              <th className="p-4 text-right text-xs font-bold uppercase tracking-wider" style={{ color: "#4A7A8A" }}>ต้นทุน</th>
              <th className="p-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "#4A7A8A" }}>สถานะ</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {parts.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-gray-50" style={{ borderBottom: "1px solid #0F172006" }}>
                <td className="p-4 font-bold" style={{ color: "#0F1720" }}>{p.name}</td>
                <td className="p-4">
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "#0F172006", color: "#4A7A8A" }}>
                    {CATEGORIES.find((c) => c.value === p.category)?.label || p.category}
                  </span>
                </td>
                <td className="p-4 font-mono text-xs" style={{ color: "#85C1B2" }}>{p.sku || "—"}</td>
                <td className="p-4 text-right">
                  {editId === p.id ? (
                    <div className="flex items-center justify-end gap-1">
                      <input
                        type="number"
                        value={editQty}
                        onChange={(e) => setEditQty(parseInt(e.target.value) || 0)}
                        className="w-16 rounded-lg px-2 py-1 text-sm text-right"
                        style={{ border: "1px solid #0F172012" }}
                        autoFocus
                      />
                      <button onClick={() => updateQty(p.id, editQty)} className="text-xs font-bold" style={{ color: "#28EF33" }}>OK</button>
                      <button onClick={() => setEditId(null)} className="text-xs" style={{ color: "#4A7A8A" }}>X</button>
                    </div>
                  ) : (
                    <span
                      className="font-black text-lg cursor-pointer"
                      style={{
                        color: p.quantity === 0 ? "#EF4444" : p.quantity <= p.alertAt ? "#F59E0B" : "#0F1720",
                      }}
                      onClick={() => { setEditId(p.id); setEditQty(p.quantity); }}
                    >
                      {p.quantity}
                    </span>
                  )}
                </td>
                <td className="p-4 text-right" style={{ color: "#4A7A8A" }}>฿{p.costPrice.toLocaleString()}</td>
                <td className="p-4">
                  {p.quantity === 0 ? (
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: "#FEF2F2", color: "#EF4444" }}>หมด</span>
                  ) : p.quantity <= p.alertAt ? (
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: "#FFFBEB", color: "#F59E0B" }}>ใกล้หมด</span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: "#28EF3318", color: "#28EF33" }}>ปกติ</span>
                  )}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => { setEditId(p.id); setEditQty(p.quantity); }}
                    className="text-xs font-bold underline"
                    style={{ color: "#4A7A8A" }}
                  >
                    แก้ไข
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {parts.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl shadow-sm p-4" style={{ border: "1px solid #0F172008" }}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-bold" style={{ color: "#0F1720" }}>{p.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: "#0F172006", color: "#4A7A8A" }}>
                    {CATEGORIES.find((c) => c.value === p.category)?.label || p.category}
                  </span>
                  {p.sku && (
                    <span className="font-mono text-xs" style={{ color: "#85C1B2" }}>{p.sku}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                {editId === p.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={editQty}
                      onChange={(e) => setEditQty(parseInt(e.target.value) || 0)}
                      className="w-16 rounded-lg px-2 py-1 text-sm text-right"
                      style={{ border: "1px solid #0F172012" }}
                      autoFocus
                    />
                    <button onClick={() => updateQty(p.id, editQty)} className="text-xs font-bold" style={{ color: "#28EF33" }}>OK</button>
                    <button onClick={() => setEditId(null)} className="text-xs" style={{ color: "#4A7A8A" }}>X</button>
                  </div>
                ) : (
                  <p
                    className="text-2xl font-black cursor-pointer"
                    style={{
                      color: p.quantity === 0 ? "#EF4444" : p.quantity <= p.alertAt ? "#F59E0B" : "#0F1720",
                    }}
                    onClick={() => { setEditId(p.id); setEditQty(p.quantity); }}
                  >
                    {p.quantity}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: "1px solid #0F172006" }}>
              <span className="text-sm" style={{ color: "#4A7A8A" }}>฿{p.costPrice.toLocaleString()}</span>
              {p.quantity === 0 ? (
                <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: "#FEF2F2", color: "#EF4444" }}>หมด</span>
              ) : p.quantity <= p.alertAt ? (
                <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: "#FFFBEB", color: "#F59E0B" }}>ใกล้หมด</span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: "#28EF3318", color: "#28EF33" }}>ปกติ</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs mt-4" style={{ color: "#4A7A8A" }}>คลิกที่ตัวเลขจำนวนเพื่อแก้ไขสต็อคได้เลย</p>
    </div>
  );
}
