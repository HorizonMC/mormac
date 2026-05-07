import { cookies } from "next/headers";

const SECRET = process.env.LINE_CHANNEL_SECRET || "mormac-auth-secret";

interface CustomerSession {
  userId: string;
  name: string;
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("customer_token")?.value;
    if (!token) return null;

    const [payloadB64, sig] = token.split(".");
    if (!payloadB64 || !sig) return null;

    const payload = Buffer.from(payloadB64, "base64").toString();
    const crypto = await import("crypto");
    const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
    if (sig !== expected) return null;

    const data = JSON.parse(payload);
    if (Date.now() - data.iat > 7 * 24 * 60 * 60 * 1000) return null;
    if (data.role !== "customer") return null;

    return { userId: data.userId, name: data.name };
  } catch {
    return null;
  }
}
