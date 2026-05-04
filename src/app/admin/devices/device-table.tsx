"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Device {
  id: string;
  model: string;
  deviceType: string;
  serialNo: string | null;
  imei: string | null;
  condition: string | null;
  buyPrice: number;
  sellPrice: number | null;
  repairCost: number | null;
  status: string;
  sellerId: string | null;
  sellerIdCard: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  incoming: "รับเข้า",
  repairing: "กำลังซ่อม",
  ready: "พร้อมขาย",
  listed: "ลงขายแล้ว",
  sold: "ขายแล้ว",
};

const STATUS_COLORS: Record<string, string> = {
  incoming: "bg-gray-100 text-gray-600",
  repairing: "bg-blue-50 text-blue-600",
  ready: "bg-green-50 text-green-600",
  listed: "bg-yellow-50 text-yellow-600",
  sold: "bg-purple-50 text-purple-600",
};

export function DeviceTable({ devices: initial, defaultShopId }: { devices: Device[]; defaultShopId: string }) {
  const [devices, setDevices] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const router = useRouter();

  async function addDevice(form: FormData) {
    const body = {
      shopId: defaultShopId,
      model: form.get("model") as string,
      deviceType: form.get("deviceType") as string,
      serialNo: (form.get("serialNo") as string) || null,
      imei: (form.get("imei") as string) || null,
      condition: (form.get("condition") as string) || null,
      buyPrice: parseFloat(form.get("buyPrice") as string) || 0,
      sellPrice: form.get("sellPrice") ? parseFloat(form.get("sellPrice") as string) : null,
      sellerId: (form.get("sellerId") as string) || null,
      sellerIdCard: (form.get("sellerIdCard") as string) || null,
    };
    const res = await fetch("/api/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const device = await res.json();
    setDevices((d) => [device, ...d]);
    setShowAdd(false);
    router.refresh();
  }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/devices", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setDevices((d) => d.map((x) => (x.id === id ? { ...x, status } : x)));
  }

  return (
    <div>
      <button onClick={() => setShowAdd(!showAdd)} className="mb-4 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium">
        + รับซื้อเครื่องใหม่
      </button>

      {showAdd && (
        <form action={addDevice} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-gray-500">รุ่น</label>
            <input name="model" required placeholder="iPhone 15 Pro" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">ประเภท</label>
            <select name="deviceType" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="iphone">iPhone</option>
              <option value="macbook">MacBook</option>
              <option value="ipad">iPad</option>
              <option value="watch">Apple Watch</option>
              <option value="airpods">AirPods</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">S/N</label>
            <input name="serialNo" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">IMEI</label>
            <input name="imei" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">สภาพ/อาการ</label>
            <input name="condition" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">ราคาซื้อ</label>
            <input name="buyPrice" type="number" required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">ราคาขาย (ถ้ามี)</label>
            <input name="sellPrice" type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">ชื่อคนขาย</label>
            <input name="sellerId" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">เลขบัตรคนขาย</label>
            <input name="sellerIdCard" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
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
              <th className="p-3">รุ่น</th>
              <th className="p-3">S/N</th>
              <th className="p-3">สภาพ</th>
              <th className="p-3 text-right">ซื้อ</th>
              <th className="p-3 text-right">ขาย</th>
              <th className="p-3 text-right">กำไร</th>
              <th className="p-3">สถานะ</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => {
              const profit = d.sellPrice ? d.sellPrice - d.buyPrice - (d.repairCost || 0) : null;
              return (
                <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-3 font-medium">{d.model}</td>
                  <td className="p-3 font-mono text-xs text-gray-400">{d.serialNo || "—"}</td>
                  <td className="p-3 text-gray-500 max-w-32 truncate">{d.condition || "—"}</td>
                  <td className="p-3 text-right">฿{d.buyPrice.toLocaleString()}</td>
                  <td className="p-3 text-right">{d.sellPrice ? `฿${d.sellPrice.toLocaleString()}` : "—"}</td>
                  <td className="p-3 text-right">
                    {profit !== null ? (
                      <span className={profit >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                        {profit >= 0 ? "+" : ""}฿{profit.toLocaleString()}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[d.status] || "bg-gray-100"}`}>
                      {STATUS_LABELS[d.status] || d.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <select
                      value={d.status}
                      onChange={(e) => updateStatus(d.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded px-1 py-0.5"
                    >
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
            {devices.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-gray-400">ยังไม่มีเครื่องในสต็อค</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
