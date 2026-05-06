"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Shop {
  id: string;
  name: string;
}

interface StaffItem {
  id: string;
  userId: string;
  username: string | null;
  role: string;
  perms: string;
  shopId: string;
  user?: { name?: string | null; phone?: string | null } | null;
}

const PERM_OPTIONS = [
  { key: "repairs", label: "ดูงานซ่อม" },
  { key: "parts_view", label: "ดูอะไหล่" },
  { key: "parts_requisition", label: "เบิกอะไหล่" },
  { key: "reports", label: "ดูรายงาน" },
  { key: "customers", label: "ดูข้อมูลลูกค้า" },
];

export function AddStaffForm({ shops }: { shops: Shop[] }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("tech");
  const [perms, setPerms] = useState<string[]>(["repairs"]);
  const [shopId, setShopId] = useState(shops[0]?.id || "");
  const router = useRouter();

  function togglePerm(key: string) {
    setPerms((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !username || !password || !shopId) return;
    setSaving(true);
    try {
      await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, username, password, role, perms, shopId }),
      });
      setName("");
      setPhone("");
      setUsername("");
      setPassword("");
      setRole("tech");
      setPerms(["repairs"]);
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg text-sm font-medium text-white"
        style={{ background: "#0F1720" }}
      >
        + เพิ่มช่าง
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
      <p className="font-bold text-sm">เพิ่มช่างใหม่</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500">ชื่อ *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500">เบอร์โทร</label>
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Username *</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Password *</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500">ตำแหน่ง</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="tech">ช่าง</option>
            <option value="senior_tech">ช่างอาวุโส</option>
            <option value="admin">แอดมิน</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">สาขา *</label>
          <select value={shopId} onChange={(e) => setShopId(e.target.value)} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            {shops.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 block mb-1">สิทธิ์การใช้งาน</label>
        <div className="flex flex-wrap gap-2">
          {PERM_OPTIONS.map((p) => (
            <label key={p.key} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={perms.includes(p.key)}
                onChange={() => togglePerm(p.key)}
                className="rounded"
                style={{ accentColor: "#4A9A8C" }}
              />
              {p.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ background: "#0F1720" }}>
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200">
          ยกเลิก
        </button>
      </div>
    </form>
  );
}

export function EditPermsForm({ staff }: { staff: StaffItem }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [perms, setPerms] = useState<string[]>(staff.perms ? staff.perms.split(",").filter(Boolean) : []);
  const router = useRouter();

  function togglePerm(key: string) {
    setPerms((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: staff.id, perms }),
      });
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs px-2 py-1 rounded-md hover:bg-gray-100" style={{ color: "#4A9A8C" }}>
        แก้ไขสิทธิ์
      </button>
    );
  }

  return (
    <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-2">
      <div className="flex flex-wrap gap-2">
        {PERM_OPTIONS.map((p) => (
          <label key={p.key} className="flex items-center gap-1.5 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={perms.includes(p.key)}
              onChange={() => togglePerm(p.key)}
              className="rounded"
              style={{ accentColor: "#4A9A8C" }}
            />
            {p.label}
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving} className="px-3 py-1 rounded-md text-xs text-white disabled:opacity-50" style={{ background: "#0F1720" }}>
          {saving ? "..." : "บันทึก"}
        </button>
        <button onClick={() => setOpen(false)} className="px-3 py-1 rounded-md text-xs bg-gray-200 hover:bg-gray-300">
          ยกเลิก
        </button>
      </div>
    </div>
  );
}

export function DeleteStaffButton({ staffId }: { staffId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch("/api/staff", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: staffId }),
      });
      router.refresh();
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex gap-1">
        <button onClick={handleDelete} disabled={deleting} className="text-xs px-2 py-1 rounded-md bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50">
          {deleting ? "..." : "ยืนยันลบ"}
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200">
          ไม่
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirming(true)} className="text-xs px-2 py-1 rounded-md text-red-500 hover:bg-red-50">
      ลบ
    </button>
  );
}
