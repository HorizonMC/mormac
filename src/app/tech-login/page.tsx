import { getBrand } from "@/lib/brand";
import { TechLoginForm } from "./tech-login-form";

export const metadata = {
  title: "Tech Login",
};

export default async function TechLoginPage() {
  const brand = await getBrand();

  return (
    <div
      className="min-h-dvh flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: brand.colors.dark }}
    >
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">{brand.name}</h1>
          <p className="mt-1 text-sm" style={{ color: brand.colors.mint }}>
            {brand.tagline}
          </p>
          <p className="mt-4 text-lg font-medium text-white">
            ช่างเข้าสู่ระบบ
          </p>
        </div>

        <TechLoginForm
          colors={{
            dark: brand.colors.dark,
            teal: brand.colors.teal,
            accent: brand.colors.accent,
            mint: brand.colors.mint,
            bg: brand.colors.bg,
          }}
        />

        <p className="text-center text-sm" style={{ color: brand.colors.teal }}>
          เป็นเจ้าของร้าน? <a href="/login" className="underline font-medium" style={{ color: brand.colors.accent }}>เข้าระบบ Admin</a>
        </p>
      </div>
    </div>
  );
}
