import { getBrand } from "@/lib/brand";
import { RegisterForm } from "./register-form";
import Link from "next/link";

export default async function RegisterPage() {
  const brand = await getBrand();
  const c = brand.colors;

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-12" style={{ background: c.dark }}>
      <div className="fixed inset-0 pointer-events-none opacity-[0.04]"
        style={{ background: `radial-gradient(ellipse at 50% 20%, ${c.accent}, transparent 70%)` }}
      />

      <div className="relative w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link href="/">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-black mx-auto mb-4 shadow-lg" style={{ background: c.accent, color: c.dark }}>
              D
            </div>
          </Link>
          <h1 className="text-2xl font-black text-white">{brand.name}</h1>
          <p className="text-sm mt-1" style={{ color: c.mint }}>
            สมัครสมาชิก
          </p>
        </div>

        <RegisterForm colors={{ dark: c.dark, accent: c.accent, mint: c.mint, teal: c.teal }} />

        <p className="text-center text-sm" style={{ color: c.mint }}>
          มีบัญชีแล้ว?{" "}
          <Link href="/login" className="font-bold underline" style={{ color: c.accent }}>
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}
