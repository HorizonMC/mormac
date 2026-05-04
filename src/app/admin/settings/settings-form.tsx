"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BrandConfig } from "@/lib/brand";

export function SettingsForm({ initial }: { initial: BrandConfig }) {
  const [config, setConfig] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  function set(field: string, value: string) {
    if (field.startsWith("colors.")) {
      const colorKey = field.replace("colors.", "") as keyof BrandConfig["colors"];
      setConfig((c) => ({ ...c, colors: { ...c.colors, [colorKey]: value } }));
    } else {
      setConfig((c) => ({ ...c, [field]: value }));
    }
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Brand Info */}
      <Section title="ข้อมูลร้าน">
        <Field label="ชื่อร้าน (EN)" value={config.name} onChange={(v) => set("name", v)} />
        <Field label="ชื่อร้าน (TH)" value={config.nameTh} onChange={(v) => set("nameTh", v)} />
        <Field label="Tagline" value={config.tagline} onChange={(v) => set("tagline", v)} />
        <Field label="เบอร์โทร" value={config.phone} onChange={(v) => set("phone", v)} />
        <Field label="ที่อยู่" value={config.address} onChange={(v) => set("address", v)} />
        <Field label="Logo URL" value={config.logo} onChange={(v) => set("logo", v)} />
      </Section>

      {/* Colors */}
      <Section title="สีแบรนด์">
        <div className="grid grid-cols-2 gap-4">
          <ColorField label="Dark (หลัก)" value={config.colors.dark} onChange={(v) => set("colors.dark", v)} />
          <ColorField label="Teal (รอง)" value={config.colors.teal} onChange={(v) => set("colors.teal", v)} />
          <ColorField label="Mint (อ่อน)" value={config.colors.mint} onChange={(v) => set("colors.mint", v)} />
          <ColorField label="Accent (เน้น)" value={config.colors.accent} onChange={(v) => set("colors.accent", v)} />
          <ColorField label="Background" value={config.colors.bg} onChange={(v) => set("colors.bg", v)} />
        </div>
      </Section>

      {/* Preview */}
      <Section title="Preview">
        <div className="rounded-xl overflow-hidden">
          <div className="p-4 text-white" style={{ background: config.colors.dark }}>
            <p className="font-bold text-lg">{config.name}</p>
            <p className="text-sm" style={{ color: config.colors.mint }}>{config.nameTh} — {config.tagline}</p>
          </div>
          <div className="p-4" style={{ background: config.colors.bg }}>
            <div className="flex gap-2 mb-2">
              <span className="text-xs px-3 py-1 rounded-full text-white" style={{ background: config.colors.teal }}>สถานะ</span>
              <span className="text-xs px-3 py-1 rounded-full text-white" style={{ background: config.colors.accent }}>Active</span>
            </div>
            <div className="bg-white rounded-lg p-3" style={{ borderColor: `${config.colors.mint}33`, borderWidth: 1 }}>
              <p className="font-bold text-sm" style={{ color: config.colors.dark }}>MOR-2605-0001</p>
              <p className="text-xs" style={{ color: config.colors.teal }}>iPhone 15 Pro — จอแตก</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-lg text-white font-medium transition disabled:opacity-50"
          style={{ background: config.colors.dark }}
        >
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
        {saved && <span className="text-sm text-green-600 font-medium">บันทึกแล้ว!</span>}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <p className="font-bold text-sm mb-4">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
      />
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
      </div>
    </div>
  );
}
