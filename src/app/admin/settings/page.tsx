import { getBrand } from "@/lib/brand";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const config = await getBrand();

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-1" style={{ color: config.colors.dark }}>ตั้งค่าร้าน</h1>
      <p className="text-sm mb-6" style={{ color: config.colors.teal }}>แก้ไขข้อมูลร้าน สี โลโก้ — มีผลทั้งระบบทันที</p>
      <SettingsForm initial={config} />
    </div>
  );
}
