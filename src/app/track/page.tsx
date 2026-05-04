import { redirect } from "next/navigation";
import { getBrand } from "@/lib/brand";

interface Props {
  searchParams: Promise<{ code?: string }>;
}

export default async function TrackSearchPage({ searchParams }: Props) {
  const { code } = await searchParams;
  if (code) redirect(`/track/${code}`);

  const brand = await getBrand();
  const c = brand.colors;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: c.bg }}>
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-1" style={{ color: c.dark }}>{brand.name}</h1>
        <p className="text-sm mb-6" style={{ color: c.teal }}>{brand.nameTh} — เช็คสถานะการซ่อม</p>

        <form className="space-y-3">
          <input
            name="code"
            placeholder="กรอกเลขซ่อม เช่น MOR-2605-0001"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-center font-mono text-lg"
          />
          <button
            type="submit"
            className="w-full px-4 py-3 rounded-xl font-medium text-white"
            style={{ background: c.dark }}
          >
            ค้นหา
          </button>
        </form>

        <p className="text-xs mt-6" style={{ color: c.teal }}>หรือสแกน QR Code บนใบปะหน้าซอง</p>
      </div>
    </div>
  );
}
