import { NextRequest, NextResponse } from "next/server";

const SECRET = process.env.LINE_CHANNEL_SECRET || "mormac-auth-secret";

async function verifyToken(token: string): Promise<boolean> {
  try {
    const [payloadB64, sig] = token.split(".");
    if (!payloadB64 || !sig) return false;
    const payload = atob(payloadB64);
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", encoder.encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sigBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const expected = Array.from(new Uint8Array(sigBytes)).map(b => b.toString(16).padStart(2, "0")).join("");
    if (sig !== expected) return false;
    const data = JSON.parse(payload);
    return Date.now() - data.iat < 7 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/admin")) {
    const auth = req.cookies.get("admin_token");
    if (!auth || !(await verifyToken(auth.value))) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }
  if (req.nextUrl.pathname.startsWith("/tech") && !req.nextUrl.pathname.startsWith("/tech-login")) {
    const auth = req.cookies.get("tech_token");
    if (!auth || !(await verifyToken(auth.value))) {
      return NextResponse.redirect(new URL("/tech-login", req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/tech/:path*"],
};
