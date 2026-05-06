import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const SECRET = process.env.LINE_CHANNEL_SECRET || "mormac-auth-secret";

function verifyToken(token: string): boolean {
  try {
    const [payloadB64, sig] = token.split(".");
    if (!payloadB64 || !sig) return false;
    const payload = Buffer.from(payloadB64, "base64").toString();
    const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
    if (sig.length !== expected.length) return false;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
    const data = JSON.parse(payload);
    const age = Date.now() - data.iat;
    return age < 7 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/admin")) {
    const auth = req.cookies.get("admin_token");
    if (!auth || !verifyToken(auth.value)) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
