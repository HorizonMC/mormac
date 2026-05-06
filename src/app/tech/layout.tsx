import { redirect } from "next/navigation";
import { getBrand } from "@/lib/brand";
import { getTechSession } from "@/lib/tech-auth";
import { TechNav } from "./tech-nav";

export default async function TechLayout({ children }: { children: React.ReactNode }) {
  const session = await getTechSession();
  if (!session) redirect("/tech/login");

  const brand = await getBrand();
  const c = brand.colors;

  return (
    <div className="min-h-screen pb-20" style={{ background: c.bg }}>
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ background: c.dark }}
      >
        <span className="font-bold text-lg text-white">{brand.name}</span>
        <span className="text-sm" style={{ color: c.mint }}>
          Tech: {session.name}
        </span>
      </header>
      <main className="p-4 max-w-2xl mx-auto">{children}</main>
      <TechNav dark={c.dark} teal={c.teal} accent={c.accent} mint={c.mint} />
    </div>
  );
}
