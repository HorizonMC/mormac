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
        className="mb-4 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium"
      >
        + เพิ่มอะไหล่
      </button>

      {showAdd && (
        <form
          action={addPart}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <div className="col-span-2">
            <label className="text-xs text-gray-500">ชื่ออะไหล่</label>
            <input name="name" required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">SKU</label>
            <input name="sku" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">หมวด</label>
            <select name="category" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">จำนวน</label>
            <input name="quantity" type="number" defaultValue={0} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">ราคาต้นทุน</label>
            <input name="costPrice" type="number" required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">แจ้งเตือนเมื่อเหลือ</label>
            <input name="alertAt" type="number" defaultValue={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm">บันทึก</button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-gray-500 text-sm">ยกเลิก</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="p-3">ชื่ออะไหล่</th>
              <th className="p-3">หมวด</th>
              <th className="p-3">SKU</th>
              <th className="p-3 text-right">จำนวน</th>
              <th className="p-3 text-right">ต้นทุน</th>
              <th className="p-3">สถานะ</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {parts.map((p) => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3 text-gray-500">{CATEGORIES.find((c) => c.value === p.category)?.label || p.category}</td>
                <td className="p-3 font-mono text-xs text-gray-400">{p.sku || "—"}</td>
                <td className="p-3 text-right">
                  {editId === p.id ? (
                    <div className="flex items-center justify-end gap-1">
                      <input
                        type="number"
                        value={editQty}
                        onChange={(e) => setEditQty(parseInt(e.target.value) || 0)}
                        className="w-16 border border-gray-200 rounded px-2 py-1 text-sm text-right"
                        autoFocus
                      />
                      <button onClick={() => updateQty(p.id, editQty)} className="text-xs text-green-600 font-medium">OK</button>
                      <button onClick={() => setEditId(null)} className="text-xs text-gray-400">X</button>
                    </div>
                  ) : (
                    <span
                      className={`font-bold cursor-pointer ${p.quantity === 0 ? "text-red-600" : p.quantity <= p.alertAt ? "text-yellow-600" : ""}`}
                      onClick={() => { setEditId(p.id); setEditQty(p.quantity); }}
                    >
                      {p.quantity}
                    </span>
                  )}
                </td>
                <td className="p-3 text-right text-gray-500">฿{p.costPrice.toLocaleString()}</td>
                <td className="p-3">
                  {p.quantity === 0 ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">หมด</span>
                  ) : p.quantity <= p.alertAt ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-600 font-medium">ใกล้หมด</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">ปกติ</span>
                  )}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => { setEditId(p.id); setEditQty(p.quantity); }}
                    className="text-xs text-gray-400 hover:text-gray-600 underline"
                  >
                    แก้ไข
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-4">คลิกที่ตัวเลขจำนวนเพื่อแก้ไขสต็อคได้เลย</p>
    </div>
  );
}
