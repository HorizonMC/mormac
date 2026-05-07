import { cookies } from "next/headers";
import { verifySignedToken } from "@/lib/auth-token";

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

    const payload = verifySignedToken(token, "tech");
    if (!payload?.staffId || !payload.name) return null;

    return {
      staffId: payload.staffId,
      name: payload.name,
      perms: payload.perms || "",
    };
  } catch {
    return null;
  }
}
