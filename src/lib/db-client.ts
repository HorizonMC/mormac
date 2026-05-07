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
  shopId: string;
  customerId: string;
  techId: string | null;
  deviceModel: string;
  deviceType: string;
  serialNo: string | null;
  imei: string | null;
  symptoms: string;
  diagnosis: string | null;
  status: string;
  quotedPrice: number | null;
  finalPrice: number | null;
  partsCost: number | null;
  laborCost: number | null;
  photos: string | null;
  qcPhotos: string | null;
  shippingMethod: string | null;
  trackingNo: string | null;
  warrantyDays: number;
  warrantyExpiry: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  completedAt: string | Date | null;
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
  serialNo: string | null;
  imei: string | null;
  condition: string | null;
  buyPrice: number;
  sellPrice: number | null;
  repairCost: number | null;
  status: string;
  sellerId: string | null;
  sellerIdCard: string | null;
  photos: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  shop?: DbShop;
}

export interface DbShop {
  id: string;
  name: string;
}

export interface DbPart {
  id: string;
  shopId: string;
  name: string;
  sku: string | null;
  category: string | null;
  quantity: number;
  costPrice: number;
  alertAt: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface DbNotification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string | Date;
}

export interface DbAppointment {
  id: string;
  customerId: string;
  date: string;
  time: string;
  deviceType: string;
  symptoms: string;
  status: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  customer?: Pick<DbUser, "id" | "name" | "phone" | "lineUserId"> | null;
}

export interface DbStaff {
  id: string;
  userId: string;
  shopId: string;
  role: string;
  username: string | null;
  password: string | null;
  perms: string;
  user?: Pick<DbUser, "id" | "name" | "phone">;
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

export interface DbRating {
  id: string;
  repairId: string;
  score: number;
  comment: string | null;
  createdAt: string | Date;
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
  avgRating: number | null;
  totalRatings: number;
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

export interface TechPerformanceRow {
  techId: string;
  name: string;
  jobs: number;
  avgRepairDays: number;
  warrantyClaims: number;
  revenue: number;
  avgRating: number | null;
  ratingCount: number;
}

export interface TechPerformanceReport {
  period: string;
  techs: TechPerformanceRow[];
}

export interface PnlMonth {
  month: string;
  revenue: number;
  cogs: number;
  labor: number;
  grossProfit: number;
  jobs: number;
}

export interface PnlReport {
  months: PnlMonth[];
  current: PnlMonth;
  previous: PnlMonth | null;
  momRevenuePct: number | null;
  momProfitPct: number | null;
  totals: {
    revenue: number;
    cogs: number;
    labor: number;
    grossProfit: number;
    jobs: number;
  };
}

export interface CustomerLtvReport {
  customer: Omit<DbUser, "repairs"> & { repairs: DbRepair[] };
  totalRepairs: number;
  completedRepairs: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  avgTicket: number;
  avgRating: number | null;
}

export interface TopCustomerReport {
  id: string;
  name: string;
  phone: string | null;
  totalRepairs: number;
  completedRepairs: number;
  totalRevenue: number;
  avgTicket: number;
  lastRepairAt: string | null;
}

export interface FailurePatternsReport {
  totalRepairs: number;
  topModels: {
    model: string;
    deviceType: string;
    count: number;
    topSymptom: { label: string; count: number };
  }[];
  topSymptoms: {
    symptom: string;
    count: number;
    topDeviceType: { label: string; count: number };
  }[];
  matrix: {
    deviceType: string;
    symptoms: { symptom: string; count: number }[];
  }[];
  stockSuggestions: {
    symptom: string;
    demandScore: number;
    suggestion: string;
  }[];
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

function query(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const value = search.toString();
  return value ? `?${value}` : "";
}

export const db = {
  repairs: {
    list: (status?: string, shopId?: string) => dbFetch<DbRepair[]>(`/repairs${query({ status, shopId })}`),
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
  notifications: {
    list: (unread?: boolean) => dbFetch<DbNotification[]>(`/notifications${unread ? "?unread=true" : ""}`),
    markRead: (id: string) => dbFetch<DbNotification>(`/notifications/${id}/read`, { method: "PATCH" }),
  },
  appointments: {
    list: () => dbFetch<DbAppointment[]>("/appointments"),
    updateStatus: (id: string, status: string) => dbFetch<DbAppointment>(`/appointments/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
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
  staff: {
    list: () => dbFetch<DbStaff[]>("/staff"),
    create: (data: Partial<DbStaff>) => dbFetch<DbStaff>("/staff", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<DbStaff>) => dbFetch<DbStaff>(`/staff/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => dbFetch<void>(`/staff/${id}`, { method: "DELETE" }),
  },
  tech: {
    auth: (username: string, password: string) => dbFetch<{ staffId: string; name: string; shopId: string; role: string; perms: string }>("/tech/auth", { method: "POST", body: JSON.stringify({ username, password }) }),
    repairs: (staffId: string) => dbFetch<DbRepair[]>(`/tech/${staffId}/repairs`),
    repairDetail: (staffId: string, repairId: string) => dbFetch<DbRepair>(`/tech/${staffId}/repairs/${repairId}`),
    updateStatus: (staffId: string, repairId: string, data: Record<string, unknown>) => dbFetch<DbRepair>(`/tech/${staffId}/repairs/${repairId}/status`, { method: "PATCH", body: JSON.stringify(data) }),
    requisition: (staffId: string, repairId: string, data: { partId: string; quantity: number; cost: number }) => dbFetch<unknown>(`/tech/${staffId}/repairs/${repairId}/requisition`, { method: "POST", body: JSON.stringify(data) }),
  },
  customer: {
    register: (data: { name: string; phone: string; password: string }) => dbFetch<{ userId: string; name: string; phone: string }>("/customers/register", { method: "POST", body: JSON.stringify(data) }),
    auth: (phone: string, password: string) => dbFetch<{ userId: string; name: string; phone: string }>("/customers/auth", { method: "POST", body: JSON.stringify({ phone, password }) }),
    repairs: (userId: string) => dbFetch<DbRepair[]>(`/customers/${userId}/repairs`),
    appointments: (userId: string) => dbFetch<DbAppointment[]>(`/customers/${userId}/appointments`),
    ltv: (userId: string) => dbFetch<CustomerLtvReport>(`/customers/${userId}/ltv`),
  },
  ratings: {
    get: (repairId: string) => dbFetch<DbRating | null>(`/repairs/${repairId}/rating`),
    create: (repairId: string, data: { score: number; comment?: string }) => dbFetch<DbRating>(`/repairs/${repairId}/rating`, { method: "POST", body: JSON.stringify(data) }),
  },
  stats: () => dbFetch<DbStats>("/stats"),
  ai: {
    parse: (message: string) => dbFetch<DbRecord>("/ai/parse", { method: "POST", body: JSON.stringify({ message }) }),
  },
  reports: {
    summary: (period?: string, shopId?: string) => dbFetch<ReportSummary>(`/reports/summary${query({ period, shopId })}`),
    byDevice: (shopId?: string) => dbFetch<DeviceReport[]>(`/reports/by-device${query({ shopId })}`),
    byStatus: (shopId?: string) => dbFetch<StatusReport[]>(`/reports/by-status${query({ shopId })}`),
    topParts: (shopId?: string) => dbFetch<TopPartReport[]>(`/reports/top-parts${query({ shopId })}`),
    monthlyTrend: (shopId?: string) => dbFetch<MonthlyTrendReport[]>(`/reports/monthly-trend${query({ shopId })}`),
    techPerformance: (period?: string) => dbFetch<TechPerformanceReport>(`/reports/tech-performance${period ? `?period=${period}` : ""}`),
    pnl: (shopId?: string) => dbFetch<PnlReport>(`/reports/pnl${query({ shopId })}`),
    topCustomers: (shopId?: string) => dbFetch<TopCustomerReport[]>(`/reports/top-customers${query({ shopId })}`),
    failurePatterns: (shopId?: string) => dbFetch<FailurePatternsReport>(`/reports/failure-patterns${query({ shopId })}`),
  },
};
