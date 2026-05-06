import { db } from "@/lib/db-client";
import { repairStatusText } from "@/lib/line";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const PERIODS = ["week", "month", "year", "all"] as const;
const REPAIR_STATUSES = [
  "pending_customer_info",
  "submitted",
  "received",
  "diagnosing",
  "quoted",
  "confirmed",
  "repairing",
  "qc",
  "done",
  "shipped",
  "returned",
  "cancelled",
] as const;
type Period = (typeof PERIODS)[number];

interface RepairForCsv {
  id?: string | null;
  repairCode?: string | null;
  createdAt?: string | Date | null;
  deviceModel?: string | null;
  deviceType?: string | null;
  symptoms?: string | null;
  status?: string | null;
  quotedPrice?: number | null;
  finalPrice?: number | null;
  partsCost?: number | null;
  laborCost?: number | null;
  customer?: {
    name?: string | null;
    phone?: string | null;
  } | null;
  partsUsed?: { cost?: number | null }[];
}

export async function GET(req: NextRequest) {
  const period = parsePeriod(req.nextUrl.searchParams.get("period"));
  const cutoff = getPeriodCutoff(period);
  const repairs = (await loadRepairs())
    .filter((repair) => isInPeriod(repair.createdAt, cutoff))
    .sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));

  const rows = [
    ["เลขซ่อม", "วันที่", "ลูกค้า", "อุปกรณ์", "อาการ", "สถานะ", "ราคาประเมิน", "ค่าอะไหล่", "ค่าแรง", "กำไร"],
    ...repairs.map((repair) => {
      const partsCost = getPartsCost(repair);
      const laborCost = repair.laborCost ?? 0;
      const revenue = repair.finalPrice ?? repair.quotedPrice ?? 0;
      const profit = revenue - partsCost - laborCost;

      return [
        repair.repairCode || "",
        formatDate(repair.createdAt),
        formatCustomer(repair),
        formatDevice(repair),
        repair.symptoms || "",
        repair.status ? repairStatusText(repair.status) : "",
        formatNumber(repair.quotedPrice),
        formatNumber(partsCost),
        formatNumber(laborCost),
        formatNumber(profit),
      ];
    }),
  ];

  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  const filename = `ipartstore-repairs-${formatFilenameDate(new Date())}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

async function loadRepairs(): Promise<RepairForCsv[]> {
  const batches = await Promise.all([
    db.repairs.list() as Promise<RepairForCsv[]>,
    ...REPAIR_STATUSES.map((status) => db.repairs.list(status) as Promise<RepairForCsv[]>),
  ]);
  const repairs = new Map<string, RepairForCsv>();

  for (const repair of batches.flat()) {
    const key = repair.id || repair.repairCode;
    if (key) repairs.set(key, repair);
  }

  return Array.from(repairs.values());
}

function parsePeriod(value: string | null): Period {
  return PERIODS.includes(value as Period) ? (value as Period) : "all";
}

function getPeriodCutoff(period: Period): Date | null {
  const now = new Date();
  if (period === "week") {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 7);
    return cutoff;
  }
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === "year") return new Date(now.getFullYear(), 0, 1);
  return null;
}

function isInPeriod(value: RepairForCsv["createdAt"], cutoff: Date | null): boolean {
  if (!cutoff) return true;
  return getTime(value) >= cutoff.getTime();
}

function getTime(value: RepairForCsv["createdAt"]): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function formatDate(value: RepairForCsv["createdAt"]): string {
  const time = getTime(value);
  if (!time) return "";
  return new Date(time).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatFilenameDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatCustomer(repair: RepairForCsv): string {
  const name = repair.customer?.name || "";
  const phone = repair.customer?.phone || "";
  if (name && phone) return `${name} (${phone})`;
  return name || phone;
}

function formatDevice(repair: RepairForCsv): string {
  const model = repair.deviceModel || "";
  const type = repair.deviceType || "";
  if (model && type) return `${model} (${type})`;
  return model || type;
}

function getPartsCost(repair: RepairForCsv): number {
  if (typeof repair.partsCost === "number") return repair.partsCost;
  return (repair.partsUsed || []).reduce((sum, part) => sum + (part.cost || 0), 0);
}

function formatNumber(value: number | null | undefined): string {
  return typeof value === "number" ? String(Math.round(value * 100) / 100) : "";
}

function csvCell(value: string): string {
  if (!/[",\r\n]/.test(value)) return value;
  return `"${value.replaceAll("\"", "\"\"")}"`;
}
