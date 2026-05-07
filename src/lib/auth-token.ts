import crypto from "crypto";

const DEV_SECRET = "mormac-dev-auth-secret";

export interface AuthPayload {
  iat: number;
  role: string;
  user?: string;
  userId?: string;
  staffId?: string;
  name?: string;
  perms?: string;
}

export function authSecret(): string {
  return process.env.LINE_CHANNEL_SECRET || (process.env.NODE_ENV === "production" ? "" : DEV_SECRET);
}

export function signToken(payload: AuthPayload): string {
  const secret = authSecret();
  if (!secret) throw new Error("Auth secret is not configured");
  const body = JSON.stringify(payload);
  const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return `${Buffer.from(body).toString("base64")}.${sig}`;
}

export function verifySignedToken(token: string, role?: string): AuthPayload | null {
  try {
    const secret = authSecret();
    if (!secret) return null;
    const [payloadB64, sig] = token.split(".");
    if (!payloadB64 || !sig) return null;

    const payload = Buffer.from(payloadB64, "base64").toString();
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    const sigBuffer = Buffer.from(sig);
    const expectedBuffer = Buffer.from(expected);
    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null;

    const data = JSON.parse(payload) as AuthPayload;
    if (!data.iat || Date.now() - data.iat > 7 * 24 * 60 * 60 * 1000) return null;
    if (role && data.role !== role) return null;
    return data;
  } catch {
    return null;
  }
}
