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

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  incoming: { bg: "#0F172008", color: "#4A7A8A" },
  repairing: { bg: "#3B82F618", color: "#3B82F6" },
  ready: { bg: "#28EF3318", color: "#28EF33" },
  listed: { bg: "#F59E0B18", color: "#F59E0B" },
  sold: { bg: "#8B5CF618", color: "#8B5CF6" },
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
      <button
        onClick={() => setShowAdd(!showAdd)}
        className="mb-5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
        style={{ background: "#28EF33", color: "#0F1720" }}
      >
        + รับซื้อเครื่องใหม่
      </button>

      {showAdd && (
        <form action={addDevice} className="bg-white rounded-2xl shadow-sm p-5 mb-5 grid grid-cols-2 md:grid-cols-4 gap-4" style={{ border: "1px solid #0F172008" }}>
          <div className="col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#4A7A8A" }}>รุ่น</label>
            <input name="model" required placeholder="iPhone 15 Pro" className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ border: "1px solid #0F172012" }} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#4A7A8A" }}>ประเภท</label>
            <select name="deviceType" className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ border: "1px solid #0F172012" }}>
              <option value="iphone">iPhone</option>
              <option value="macbook">MacBook</option>
              <option value="ipad">iPad</option>
              <option value="watch">Apple Watch</option>
              <option value="airpods">AirPods</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#4A7A8A" }}>S/N</label>
            <input name="serialNo" className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ border: "1px solid #0F172012" }} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#4A7A8A" }}>IMEI</label>
            <input name="imei" className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ border: "1px solid #0F172012" }} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#4A7A8A" }}>สภาพ/อาการ</label>
            <input name="condition" className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ border: "1px solid #0F172012" }} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#4A7A8A" }}>ราคาซื้อ</label>
            <input name="buyPrice" type="number" required className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ border: "1px solid #0F172012" }} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#4A7A8A" }}>ราคาขาย (ถ้ามี)</label>
            <input name="sellPrice" type="number" className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ border: "1px solid #0F172012" }} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#4A7A8A" }}>ชื่อคนขาย</label>
            <input name="sellerId" className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ border: "1px solid #0F172012" }} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#4A7A8A" }}>เลขบัตรคนขาย</label>
            <input name="sellerIdCard" className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ border: "1px solid #0F172012" }} />
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
              <th className="p-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "#4A7A8A" }}>รุ่น</th>
              <th className="p-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "#4A7A8A" }}>S/N</th>
              <th className="p-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "#4A7A8A" }}>สภาพ</th>
              <th className="p-4 text-right text-xs font-bold uppercase tracking-wider" style={{ color: "#4A7A8A" }}>ซื้อ</th>
              <th className="p-4 text-right text-xs font-bold uppercase tracking-wider" style={{ color: "#4A7A8A" }}>ขาย</th>
              <th className="p-4 text-right text-xs font-bold uppercase tracking-wider" style={{ color: "#4A7A8A" }}>กำไร</th>
              <th className="p-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "#4A7A8A" }}>สถานะ</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => {
              const profit = d.sellPrice ? d.sellPrice - d.buyPrice - (d.repairCost || 0) : null;
              const ss = STATUS_STYLES[d.status] || STATUS_STYLES.incoming;
              return (
                <tr key={d.id} className="transition-colors hover:bg-gray-50" style={{ borderBottom: "1px solid #0F172006" }}>
                  <td className="p-4 font-bold" style={{ color: "#0F1720" }}>{d.model}</td>
                  <td className="p-4 font-mono text-xs" style={{ color: "#85C1B2" }}>{d.serialNo || "—"}</td>
                  <td className="p-4 max-w-32 truncate" style={{ color: "#4A7A8A" }}>{d.condition || "—"}</td>
                  <td className="p-4 text-right" style={{ color: "#0F1720" }}>฿{d.buyPrice.toLocaleString()}</td>
                  <td className="p-4 text-right" style={{ color: "#0F1720" }}>{d.sellPrice ? `฿${d.sellPrice.toLocaleString()}` : "—"}</td>
                  <td className="p-4 text-right">
                    {profit !== null ? (
                      <span className="font-bold" style={{ color: profit >= 0 ? "#28EF33" : "#EF4444" }}>
                        {profit >= 0 ? "+" : ""}฿{profit.toLocaleString()}
                      </span>
                    ) : <span style={{ color: "#4A7A8A" }}>—</span>}
                  </td>
                  <td className="p-4">
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: ss.bg, color: ss.color }}>
                      {STATUS_LABELS[d.status] || d.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <select
                      value={d.status}
                      onChange={(e) => updateStatus(d.id, e.target.value)}
                      className="text-xs rounded-lg px-2 py-1"
                      style={{ border: "1px solid #0F172012", color: "#0F1720" }}
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
              <tr><td colSpan={8} className="p-12 text-center" style={{ color: "#4A7A8A" }}>ยังไม่มีเครื่องในสต็อค</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {devices.map((d) => {
          const profit = d.sellPrice ? d.sellPrice - d.buyPrice - (d.repairCost || 0) : null;
          const ss = STATUS_STYLES[d.status] || STATUS_STYLES.incoming;
          return (
            <div key={d.id} className="bg-white rounded-2xl shadow-sm p-4" style={{ border: "1px solid #0F172008" }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold" style={{ color: "#0F1720" }}>{d.model}</p>
                  {d.serialNo && <p className="font-mono text-xs mt-0.5" style={{ color: "#85C1B2" }}>{d.serialNo}</p>}
                  {d.condition && <p className="text-xs mt-0.5" style={{ color: "#4A7A8A" }}>{d.condition}</p>}
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-bold shrink-0" style={{ background: ss.bg, color: ss.color }}>
                  {STATUS_LABELS[d.status] || d.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3" style={{ borderTop: "1px solid #0F172006" }}>
                <div>
                  <p className="text-xs" style={{ color: "#4A7A8A" }}>ซื้อ</p>
                  <p className="font-bold text-sm" style={{ color: "#0F1720" }}>฿{d.buyPrice.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "#4A7A8A" }}>ขาย</p>
                  <p className="font-bold text-sm" style={{ color: "#0F1720" }}>{d.sellPrice ? `฿${d.sellPrice.toLocaleString()}` : "—"}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "#4A7A8A" }}>กำไร</p>
                  <p className="font-bold text-sm" style={{ color: profit !== null ? (profit >= 0 ? "#28EF33" : "#EF4444") : "#4A7A8A" }}>
                    {profit !== null ? `${profit >= 0 ? "+" : ""}฿${profit.toLocaleString()}` : "—"}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3" style={{ borderTop: "1px solid #0F172006" }}>
                <select
                  value={d.status}
                  onChange={(e) => updateStatus(d.id, e.target.value)}
                  className="w-full text-xs rounded-xl px-3 py-2"
                  style={{ border: "1px solid #0F172012", color: "#0F1720" }}
                >
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
        {devices.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center" style={{ border: "1px solid #0F172008", color: "#4A7A8A" }}>
            ยังไม่มีเครื่องในสต็อค
          </div>
        )}
      </div>
    </div>
  );
}
