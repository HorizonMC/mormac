import Link from "next/link";
import { db } from "@/lib/db-client";
import { getBrand } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default async function TopCustomersReportPage({
  searchParams,
}: {
  searchParams: Promise<{ shopId?: string }>;
}) {
  const { shopId } = await searchParams;
  const [brand, customers] = await Promise.all([getBrand(), db.reports.topCustomers(shopId)]);
  const c = brand.colors;
  const topRevenue = Math.max(...customers.map((customer) => customer.totalRevenue), 1);

  return (
    <div style={{ background: c.bg }} className="min-h-screen -m-4 p-4 sm:-m-6 sm:p-6">
      <div className="mb-8">
        <Link href="/admin/reports" className="text-xs font-bold" style={{ color: c.teal }}>กลับไปรายงาน</Link>
        <h1 className="mt-2 text-2xl font-black tracking-tight" style={{ color: c.dark }}>Top Customers</h1>
        <p className="text-sm mt-0.5" style={{ color: c.teal }}>จัดอันดับลูกค้าตาม lifetime revenue</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: `1px solid ${c.dark}08` }}>
        {customers.map((customer, index) => (
          <Link key={customer.id} href={`/admin/customers/${customer.id}`} className="block px-5 py-4 transition hover:bg-gray-50" style={{ borderBottom: `1px solid ${c.dark}06` }}>
            <div className="flex items-center gap-4">
              <div className="w-8 text-center font-black" style={{ color: c.teal }}>#{index + 1}</div>
              <div className="min-w-0 flex-1">
                <p className="font-bold" style={{ color: c.dark }}>{customer.name}</p>
                <p className="text-xs mt-1" style={{ color: c.teal }}>{customer.completedRepairs}/{customer.totalRepairs} งานเสร็จ | เฉลี่ย ฿{fmt(customer.avgTicket)}</p>
              </div>
              <div className="hidden sm:block h-2 w-32 rounded-full" style={{ background: `${c.dark}08` }}>
                <div className="h-2 rounded-full" style={{ width: `${Math.max(4, (customer.totalRevenue / topRevenue) * 100)}%`, background: c.accent }} />
              </div>
              <p className="text-right font-black" style={{ color: c.dark }}>฿{fmt(customer.totalRevenue)}</p>
            </div>
          </Link>
        ))}
        {customers.length === 0 && <div className="px-5 py-16 text-center" style={{ color: c.teal }}>ยังไม่มีข้อมูลลูกค้า</div>}
      </div>
    </div>
  );
}

function fmt(value: number): string {
  return Math.round(value).toLocaleString();
}
