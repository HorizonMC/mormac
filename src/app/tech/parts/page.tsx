import { getTechSession } from "@/lib/tech-auth";
import { db } from "@/lib/db-client";
import { getBrand } from "@/lib/brand";
import { redirect } from "next/navigation";
import { PartsFilter } from "./parts-filter";

export const dynamic = "force-dynamic";

export default async function TechPartsPage() {
  const session = await getTechSession();
  if (!session) redirect("/tech/login");

  const brand = await getBrand();
  const c = brand.colors;

  let parts: Awaited<ReturnType<typeof db.parts.list>> = [];
  try {
    parts = await db.parts.list();
  } catch {
    // API might be down
  }

  const serialized = parts.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category || "",
    sku: p.sku || "",
    quantity: p.quantity,
    costPrice: p.costPrice,
    alertAt: p.alertAt,
  }));

  return (
    <div>
      <h1 className="text-xl font-bold mb-4" style={{ color: c.dark }}>อะไหล่ทั้งหมด</h1>
      <PartsFilter parts={serialized} dark={c.dark} teal={c.teal} accent={c.accent} />
    </div>
  );
}
