"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BrandConfig } from "@/lib/brand";

export function SettingsForm({ initial, lineConfig }: { initial: BrandConfig; lineConfig?: Record<string, string> }) {
  const [config, setConfig] = useState(initial);
  const [line, setLine] = useState({
    channelAccessToken: lineConfig?.channelAccessToken || "",
    channelSecret: lineConfig?.channelSecret || "",
    oaId: lineConfig?.oaId || "",
  });
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
        body: JSON.stringify({ ...config, line }),
      });
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const c = config.colors;

  return (
    <div className="space-y-6">
      {/* Brand Info */}
      <Section title="ข้อมูลร้าน" dark={c.dark}>
        <Field label="ชื่อร้าน (EN)" value={config.name} onChange={(v) => set("name", v)} dark={c.dark} teal={c.teal} />
        <Field label="ชื่อร้าน (TH)" value={config.nameTh} onChange={(v) => set("nameTh", v)} dark={c.dark} teal={c.teal} />
        <Field label="Tagline" value={config.tagline} onChange={(v) => set("tagline", v)} dark={c.dark} teal={c.teal} />
        <Field label="เบอร์โทร" value={config.phone} onChange={(v) => set("phone", v)} dark={c.dark} teal={c.teal} />
        <Field label="ที่อยู่" value={config.address} onChange={(v) => set("address", v)} dark={c.dark} teal={c.teal} />
        <Field label="Logo URL" value={config.logo} onChange={(v) => set("logo", v)} dark={c.dark} teal={c.teal} />
      </Section>

      {/* Colors */}
      <Section title="สีแบรนด์" dark={c.dark}>
        <div className="grid grid-cols-2 gap-4">
          <ColorField label="Dark (หลัก)" value={c.dark} onChange={(v) => set("colors.dark", v)} teal={c.teal} dark={c.dark} />
          <ColorField label="Teal (รอง)" value={c.teal} onChange={(v) => set("colors.teal", v)} teal={c.teal} dark={c.dark} />
          <ColorField label="Mint (อ่อน)" value={c.mint} onChange={(v) => set("colors.mint", v)} teal={c.teal} dark={c.dark} />
          <ColorField label="Accent (เน้น)" value={c.accent} onChange={(v) => set("colors.accent", v)} teal={c.teal} dark={c.dark} />
          <ColorField label="Background" value={c.bg} onChange={(v) => set("colors.bg", v)} teal={c.teal} dark={c.dark} />
        </div>
      </Section>

      {/* LINE OA */}
      <Section title="LINE Official Account" dark={c.dark}>
        <div className="rounded-xl p-3 mb-4 text-xs leading-relaxed" style={{ background: `${c.accent}08`, color: c.teal }}>
          <p className="font-bold mb-1" style={{ color: c.dark }}>วิธีเชื่อมต่อ LINE OA</p>
          <ol className="list-decimal ml-4 space-y-0.5">
            <li>เข้า <span className="font-mono">developers.line.biz</span> → เลือก Channel</li>
            <li>เปิด Messaging API → คัดลอก Channel Secret</li>
            <li>Issue Channel Access Token (Long-lived) → คัดลอก</li>
            <li>ตั้ง Webhook URL: <span className="font-mono text-[10px]">https://dmc-notebook.vercel.app/api/line/webhook</span></li>
            <li>เปิด Use webhook = ON / ปิด Auto-reply</li>
          </ol>
        </div>
        <Field label="LINE OA ID (เช่น @mormac)" value={line.oaId} onChange={(v) => { setLine(l => ({ ...l, oaId: v })); setSaved(false); }} dark={c.dark} teal={c.teal} />
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: c.teal }}>Channel Access Token</label>
          <textarea
            value={line.channelAccessToken}
            onChange={(e) => { setLine(l => ({ ...l, channelAccessToken: e.target.value })); setSaved(false); }}
            rows={3}
            className="w-full rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 transition-all resize-none"
            style={{ border: `1px solid ${c.dark}12`, color: c.dark }}
            placeholder="กดวางจาก LINE Developers Console"
          />
        </div>
        <Field label="Channel Secret" value={line.channelSecret} onChange={(v) => { setLine(l => ({ ...l, channelSecret: v })); setSaved(false); }} dark={c.dark} teal={c.teal} />
        {line.channelAccessToken && line.channelSecret && (
          <div className="flex items-center gap-2 text-xs font-bold" style={{ color: c.accent }}>
            <span className="w-2 h-2 rounded-full" style={{ background: c.accent }} />
            LINE OA เชื่อมต่อแล้ว
          </div>
        )}
      </Section>

      {/* Preview */}
      <Section title="Preview" dark={c.dark}>
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${c.dark}10` }}>
          <div className="p-5" style={{ background: c.dark }}>
            <p className="font-black text-lg text-white">{config.name}</p>
            <p className="text-sm" style={{ color: c.mint }}>{config.nameTh} — {config.tagline}</p>
          </div>
          <div className="p-5" style={{ background: c.bg }}>
            <div className="flex gap-2 mb-3">
              <span className="text-xs px-3 py-1.5 rounded-full text-white font-bold" style={{ background: c.teal }}>สถานะ</span>
              <span className="text-xs px-3 py-1.5 rounded-full font-bold" style={{ background: c.accent, color: c.dark }}>Active</span>
            </div>
            <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${c.dark}08` }}>
              <p className="font-black text-sm" style={{ color: c.dark }}>MOR-2605-0001</p>
              <p className="text-xs" style={{ color: c.teal }}>iPhone 15 Pro — จอแตก</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 rounded-xl font-bold transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: c.accent, color: c.dark }}
        >
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
        {saved && (
          <span className="text-sm font-bold" style={{ color: c.accent }}>
            บันทึกแล้ว!
          </span>
        )}
      </div>
    </div>
  );
}

function Section({ title, dark, children }: { title: string; dark: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6" style={{ border: `1px solid ${dark}08` }}>
      <p className="font-black text-sm mb-5" style={{ color: dark }}>{title}</p>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, dark, teal }: { label: string; value: string; onChange: (v: string) => void; dark: string; teal: string }) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: teal }}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all"
        style={{ border: `1px solid ${dark}12`, color: dark }}
      />
    </div>
  );
}

function ColorField({ label, value, onChange, teal, dark }: { label: string; value: string; onChange: (v: string) => void; teal: string; dark: string }) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: teal }}>{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-11 h-11 rounded-xl cursor-pointer"
          style={{ border: `1px solid ${dark}12` }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 transition-all"
          style={{ border: `1px solid ${dark}12`, color: dark }}
        />
      </div>
    </div>
  );
}
