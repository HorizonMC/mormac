import { getBrand } from "@/lib/brand";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const brand = await getBrand();

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: brand.colors.bg }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {brand.logo && <img src={brand.logo} alt={brand.name} className="h-16 mx-auto mb-3" />}
          <h1 className="text-2xl font-bold" style={{ color: brand.colors.dark }}>{brand.name}</h1>
          <p className="text-sm" style={{ color: brand.colors.teal }}>Admin Login</p>
        </div>
        <LoginForm brandDark={brand.colors.dark} />
        <p className="text-center mt-6 text-sm" style={{ color: brand.colors.teal }}>
          เป็นช่างซ่อม? <a href="/tech-login" className="underline font-medium" style={{ color: brand.colors.accent }}>เข้าระบบช่าง</a>
        </p>
      </div>
    </div>
  );
}
