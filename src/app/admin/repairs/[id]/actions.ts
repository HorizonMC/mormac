"use server";

const DB_URL = process.env.DB_API_URL || "http://localhost:4100";
const DB_KEY = process.env.DB_API_KEY || "mormac-artron-2026";

export async function uploadRepairPhoto(repairId: string, formData: FormData) {
  const res = await fetch(`${DB_URL}/repairs/${repairId}/photos`, {
    method: "POST",
    headers: { "x-api-key": DB_KEY },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Photo upload failed: ${res.status} ${await res.text()}`);
  }

  return res.json() as Promise<{ path: string; photos: string[] }>;
}

