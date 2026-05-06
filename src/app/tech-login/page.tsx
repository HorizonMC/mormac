import { getBrand } from "@/lib/brand";
import { TechLoginForm } from "./tech-login-form";
import Link from "next/link";

export const metadata = {
  title: "Tech Login",
};

export default async function TechLoginPage() {
  const brand = await getBrand();
  const c = brand.colors;

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-12" style={{ background: c.dark }}>
      {/* Decorative gradient */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.04]"
        style={{ background: `radial-gradient(ellipse at 50% 20%, ${c.teal}, transparent 70%)` }}
      />

      <div className="relative w-full max-w-sm space-y-8">
        {/* Logo + Brand */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-black mx-auto mb-4 shadow-lg" style={{ background: c.accent, color: c.dark }}>
            iP
          </div>
          <h1 className="text-2xl font-black text-white">{brand.name}</h1>
          <p className="text-sm mt-1" style={{ color: c.mint }}>
            {brand.tagline}
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mt-4" style={{ background: `${c.teal}20`, color: c.mint }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
            ช่างซ่อม
          </div>
        </div>

        {/* Login Form */}
        <TechLoginForm
          colors={{
            dark: c.dark,
            teal: c.teal,
            accent: c.accent,
            mint: c.mint,
            bg: c.bg,
          }}
        />

        {/* Footer link */}
        <p className="text-center text-sm" style={{ color: c.teal }}>
          เป็นเจ้าของร้าน?{" "}
          <Link href="/login" className="font-medium transition hover:opacity-80" style={{ color: c.accent }}>
            เข้าระบบ Admin
          </Link>
        </p>
      </div>
    </div>
  );
}
