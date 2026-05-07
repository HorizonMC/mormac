import { cookies } from "next/headers";
import { verifySignedToken } from "@/lib/auth-token";

interface CustomerSession {
  userId: string;
  name: string;
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("customer_token")?.value;
    if (!token) return null;

    const data = verifySignedToken(token, "customer");
    if (!data?.userId || !data.name) return null;

    return { userId: data.userId, name: data.name };
  } catch {
    return null;
  }
}
