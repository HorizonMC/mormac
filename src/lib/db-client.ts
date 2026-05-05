const DB_URL = process.env.DB_API_URL || "http://localhost:4100";
const DB_KEY = process.env.DB_API_KEY || "mormac-artron-2026";

export const isRemoteDB = !!process.env.DB_API_URL;

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
    list: (status?: string) => dbFetch<any[]>(`/repairs${status ? `?status=${status}` : ""}`),
    get: (id: string) => dbFetch<any>(`/repairs/${id}`),
    getByCode: (code: string) => dbFetch<any>(`/repairs/code/${code}`),
    create: (data: any) => dbFetch<any>("/repairs", { method: "POST", body: JSON.stringify(data) }),
    updateStatus: (id: string, data: any) => dbFetch<any>(`/repairs/${id}/status`, { method: "PATCH", body: JSON.stringify(data) }),
    addPart: (id: string, data: any) => dbFetch<any>(`/repairs/${id}/parts`, { method: "POST", body: JSON.stringify(data) }),
    generateCode: () => dbFetch<{ code: string }>("/generate-repair-code"),
  },
  users: {
    list: (role?: string) => dbFetch<any[]>(`/users${role ? `?role=${role}` : ""}`),
    create: (data: any) => dbFetch<any>("/users", { method: "POST", body: JSON.stringify(data) }),
    getByLine: (lineUserId: string) => dbFetch<any | null>(`/users/line/${lineUserId}`),
  },
  parts: {
    list: () => dbFetch<any[]>("/parts"),
    create: (data: any) => dbFetch<any>("/parts", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => dbFetch<any>(`/parts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  },
  devices: {
    list: () => dbFetch<any[]>("/devices"),
    create: (data: any) => dbFetch<any>("/devices", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => dbFetch<any>(`/devices/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  },
  shops: {
    list: () => dbFetch<any[]>("/shops"),
  },
  config: {
    get: () => dbFetch<any[]>("/config"),
    save: (entries: { key: string; value: string }[]) => dbFetch<any>("/config", { method: "PUT", body: JSON.stringify(entries) }),
  },
  stats: () => dbFetch<any>("/stats"),
  ai: {
    parse: (message: string) => dbFetch<any>("/ai/parse", { method: "POST", body: JSON.stringify({ message }) }),
  },
  reports: {
    summary: (period?: string) => dbFetch<any>(`/reports/summary${period ? `?period=${period}` : ""}`),
    byDevice: () => dbFetch<any[]>("/reports/by-device"),
    byStatus: () => dbFetch<any[]>("/reports/by-status"),
    topParts: () => dbFetch<any[]>("/reports/top-parts"),
    monthlyTrend: () => dbFetch<any[]>("/reports/monthly-trend"),
  },
};
