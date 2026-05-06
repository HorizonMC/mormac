import { getBrand } from "@/lib/brand";
import { LoginForm } from "./login-form";
import Link from "next/link";

export default async function LoginPage() {
  const brand = await getBrand();
  const c = brand.colors;

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-12" style={{ background: c.dark }}>
      {/* Decorative gradient */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.04]"
        style={{ background: `radial-gradient(ellipse at 50% 20%, ${c.accent}, transparent 70%)` }}
      />

      <div className="relative w-full max-w-sm space-y-8">
        {/* Logo + Brand */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-black mx-auto mb-4 shadow-lg" style={{ background: c.accent, color: c.dark }}>
            D
          </div>
          <h1 className="text-2xl font-black text-white">{brand.name}</h1>
          <p className="text-sm mt-1" style={{ color: c.mint }}>
            {brand.nameTh}
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mt-4" style={{ background: `${c.accent}15`, color: c.accent }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.accent }} />
            เจ้าของร้าน
          </div>
        </div>

        {/* Login Card */}
        <LoginForm colors={{ dark: c.dark, accent: c.accent, mint: c.mint, teal: c.teal }} />

        {/* Footer link */}
        <p className="text-center text-sm" style={{ color: c.teal }}>
          เป็นช่างซ่อม?{" "}
          <Link href="/tech-login" className="font-medium transition hover:opacity-80" style={{ color: c.accent }}>
            เข้าระบบช่าง
          </Link>
        </p>
      </div>
    </div>
  );
}
