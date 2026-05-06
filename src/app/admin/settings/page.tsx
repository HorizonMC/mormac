import { getBrand } from "@/lib/brand";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const config = await getBrand();
  const c = config.colors;

  return (
    <div style={{ background: c.bg }} className="min-h-screen -m-4 p-4 sm:-m-6 sm:p-6">
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-black tracking-tight" style={{ color: c.dark }}>ตั้งค่าร้าน</h1>
          <p className="text-sm mt-0.5" style={{ color: c.teal }}>
            แก้ไขข้อมูลร้าน สี โลโก้ — มีผลทั้งระบบทันที
          </p>
        </div>
        <SettingsForm initial={config} />
      </div>
    </div>
  );
}
