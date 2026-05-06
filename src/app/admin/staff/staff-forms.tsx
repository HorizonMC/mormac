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
        className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
        style={{ background: "#28EF33", color: "#0F1720" }}
      >
        + เพิ่มช่าง
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-sm p-6 space-y-4"
      style={{ border: "1px solid #0F172008" }}
    >
      <p className="font-black text-sm" style={{ color: "#0F1720" }}>เพิ่มช่างใหม่</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#4A7A8A" }}>ชื่อ *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ border: "1px solid #0F172012" }} />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#4A7A8A" }}>เบอร์โทร</label>
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ border: "1px solid #0F172012" }} />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#4A7A8A" }}>Username *</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ border: "1px solid #0F172012" }} />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#4A7A8A" }}>Password *</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ border: "1px solid #0F172012" }} />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#4A7A8A" }}>ตำแหน่ง</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ border: "1px solid #0F172012" }}>
            <option value="tech">ช่าง</option>
            <option value="senior_tech">ช่างอาวุโส</option>
            <option value="admin">แอดมิน</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#4A7A8A" }}>สาขา *</label>
          <select value={shopId} onChange={(e) => setShopId(e.target.value)} required className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ border: "1px solid #0F172012" }}>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: "#4A7A8A" }}>สิทธิ์การใช้งาน</label>
        <div className="flex flex-wrap gap-2">
          {PERM_OPTIONS.map((p) => (
            <label
              key={p.key}
              className="flex items-center gap-2 text-sm cursor-pointer px-3 py-1.5 rounded-xl transition-all"
              style={{
                background: perms.includes(p.key) ? "#28EF3318" : "#0F172004",
                color: perms.includes(p.key) ? "#0F1720" : "#4A7A8A",
              }}
            >
              <input
                type="checkbox"
                checked={perms.includes(p.key)}
                onChange={() => togglePerm(p.key)}
                className="rounded"
                style={{ accentColor: "#28EF33" }}
              />
              {p.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all hover:opacity-90"
          style={{ background: "#0F1720" }}
        >
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-6 py-2.5 rounded-xl text-sm transition-all"
          style={{ background: "#0F172006", color: "#4A7A8A" }}
        >
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
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-3 py-1.5 rounded-xl font-bold transition-all"
        style={{ color: "#4A7A8A", background: "#0F172004" }}
      >
        แก้ไขสิทธิ์
      </button>
    );
  }

  return (
    <div className="mt-3 p-4 rounded-xl space-y-3" style={{ background: "#f8fafb", border: "1px solid #0F172006" }}>
      <div className="flex flex-wrap gap-2">
        {PERM_OPTIONS.map((p) => (
          <label
            key={p.key}
            className="flex items-center gap-2 text-xs cursor-pointer px-3 py-1.5 rounded-xl transition-all"
            style={{
              background: perms.includes(p.key) ? "#28EF3318" : "white",
              color: perms.includes(p.key) ? "#0F1720" : "#4A7A8A",
              border: "1px solid #0F172008",
            }}
          >
            <input
              type="checkbox"
              checked={perms.includes(p.key)}
              onChange={() => togglePerm(p.key)}
              className="rounded"
              style={{ accentColor: "#28EF33" }}
            />
            {p.label}
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 rounded-xl text-xs font-bold text-white disabled:opacity-50 transition-all hover:opacity-90"
          style={{ background: "#0F1720" }}
        >
          {saving ? "..." : "บันทึก"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="px-4 py-1.5 rounded-xl text-xs transition-all"
          style={{ background: "#0F172006", color: "#4A7A8A" }}
        >
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
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs px-3 py-1.5 rounded-xl font-bold disabled:opacity-50 transition-all"
          style={{ background: "#FEF2F2", color: "#DC2626" }}
        >
          {deleting ? "..." : "ยืนยันลบ"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs px-3 py-1.5 rounded-xl transition-all"
          style={{ background: "#0F172006", color: "#4A7A8A" }}
        >
          ไม่
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs px-3 py-1.5 rounded-xl font-bold transition-all hover:bg-red-50"
      style={{ color: "#DC2626" }}
    >
      ลบ
    </button>
  );
}
