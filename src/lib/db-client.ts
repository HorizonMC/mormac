const DB_URL = process.env.DB_API_URL || "http://localhost:4100";
const DB_KEY = process.env.DB_API_KEY || "mormac-artron-2026";

export const isRemoteDB = !!process.env.DB_API_URL;

export type DbRecord = Record<string, unknown>;

export interface DbUser {
  id: string;
  lineUserId?: string | null;
  name: string;
  phone?: string | null;
  memberTier: string;
  memberPoints: number;
  repairs?: Pick<DbRepair, "id" | "status">[];
}

export interface DbRepairEvent {
  id: string;
  status: string;
  note?: string | null;
  actor?: string | null;
  createdAt: string | Date;
}

export interface DbRepair {
  id: string;
  repairCode: string;
  customerId: string;
  deviceModel: string;
  deviceType: string;
  symptoms: string;
  status: string;
  createdAt: string | Date;
  quotedPrice?: number | null;
  finalPrice?: number | null;
  partsCost?: number | null;
  laborCost?: number | null;
  photos?: string | null;
  shippingMethod?: string | null;
  trackingNo?: string | null;
  customer?: DbUser | null;
  shop?: DbShop | null;
  tech?: { user?: Pick<DbUser, "name"> | null } | null;
  timeline?: DbRepairEvent[];
  partsUsed?: DbRecord[];
}

export interface DbDevice {
  id: string;
  shopId: string;
  model: string;
  deviceType: string;
  buyPrice: number;
  sellPrice?: number | null;
  repairCost?: number | null;
  status: string;
  createdAt?: string | Date;
}

export interface DbShop {
  id: string;
  name: string;
}

export interface DbPart {
  id: string;
  name: string;
  quantity: number;
  costPrice?: number;
}

export interface DbStats {
  totalRepairs: number;
  activeRepairs: number;
  completedRepairs: number;
  totalDevices: number;
  readyDevices: number;
  lowStockParts?: DbPart[];
  recentRepairs?: DbRepair[];
}

export interface ReportSummary {
  totalJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  activeJobs: number;
  totalRevenue: number;
  totalPartsCost: number;
  totalLaborCost: number;
  totalCost: number;
  totalProfit: number;
  avgTicket: number;
  avgTurnaroundDays: number;
  margin: number;
}

export interface DeviceReport {
  type: string;
  count: number;
  revenue: number;
  completed: number;
}

export interface StatusReport {
  status: string;
  count: number;
}

export interface TopPartReport {
  name: string;
  totalQty: number;
  totalCost: number;
}

export interface MonthlyTrendReport {
  month: string;
  jobs: number;
  revenue: number;
  cost: number;
}

async function dbFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${DB_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": DB_KEY,
      ...options?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`DB API error: ${res.status} ${await res.text()}`);
  return res.json();
}

export const db = {
  repairs: {
    list: (status?: string) => dbFetch<DbRepair[]>(`/repairs${status ? `?status=${status}` : ""}`),
    get: (id: string) => dbFetch<DbRepair>(`/repairs/${id}`),
    getByCode: (code: string) => dbFetch<DbRepair | null>(`/repairs/code/${code}`),
    create: (data: DbRecord) => dbFetch<DbRepair>("/repairs", { method: "POST", body: JSON.stringify(data) }),
    updateStatus: (id: string, data: DbRecord) => dbFetch<DbRepair>(`/repairs/${id}/status`, { method: "PATCH", body: JSON.stringify(data) }),
    addPart: (id: string, data: DbRecord) => dbFetch<DbRecord>(`/repairs/${id}/parts`, { method: "POST", body: JSON.stringify(data) }),
    generateCode: () => dbFetch<{ code: string }>("/generate-repair-code"),
  },
  users: {
    list: (role?: string) => dbFetch<DbUser[]>(`/users${role ? `?role=${role}` : ""}`),
    create: (data: DbRecord) => dbFetch<DbUser>("/users", { method: "POST", body: JSON.stringify(data) }),
    getByLine: (lineUserId: string) => dbFetch<DbUser | null>(`/users/line/${lineUserId}`),
  },
  parts: {
    list: () => dbFetch<DbPart[]>("/parts"),
    create: (data: DbRecord) => dbFetch<DbPart>("/parts", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: DbRecord) => dbFetch<DbPart>(`/parts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  },
  devices: {
    list: () => dbFetch<DbDevice[]>("/devices"),
    create: (data: DbRecord) => dbFetch<DbDevice>("/devices", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: DbRecord) => dbFetch<DbDevice>(`/devices/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  },
  shops: {
    list: () => dbFetch<DbShop[]>("/shops"),
  },
  config: {
    get: () => dbFetch<{ key: string; value: string }[]>("/config"),
    save: (entries: { key: string; value: string }[]) => dbFetch<{ ok: boolean }>("/config", { method: "PUT", body: JSON.stringify(entries) }),
  },
  stats: () => dbFetch<DbStats>("/stats"),
  ai: {
    parse: (message: string) => dbFetch<DbRecord>("/ai/parse", { method: "POST", body: JSON.stringify({ message }) }),
  },
  reports: {
    summary: (period?: string) => dbFetch<ReportSummary>(`/reports/summary${period ? `?period=${period}` : ""}`),
    byDevice: () => dbFetch<DeviceReport[]>("/reports/by-device"),
    byStatus: () => dbFetch<StatusReport[]>("/reports/by-status"),
    topParts: () => dbFetch<TopPartReport[]>("/reports/top-parts"),
    monthlyTrend: () => dbFetch<MonthlyTrendReport[]>("/reports/monthly-trend"),
  },
};
