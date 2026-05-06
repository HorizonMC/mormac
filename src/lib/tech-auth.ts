import { cookies } from "next/headers";

export interface TechSession {
  staffId: string;
  name: string;
  perms: string;
}

export async function getTechSession(): Promise<TechSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("tech_token")?.value;
    if (!token) return null;

    const [payloadB64] = token.split(".");
    if (!payloadB64) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, "base64").toString());

    // Check expiry: 7 days
    if (Date.now() - payload.iat > 7 * 24 * 60 * 60 * 1000) return null;

    return {
      staffId: payload.staffId,
      name: payload.name,
      perms: payload.perms,
    };
  } catch {
    return null;
  }
}
