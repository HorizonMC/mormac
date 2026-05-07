import { NextRequest, NextResponse } from "next/server";

const SECRET = process.env.LINE_CHANNEL_SECRET || "mormac-auth-secret";
const PUBLIC_API_PREFIXES = [
  "/api/auth",
  "/api/customer/auth",
  "/api/customer/register",
  "/api/line/webhook",
  "/api/ratings",
  "/api/repairs/cover",
  "/api/repairs/jobsheet",
  "/api/tech/auth",
];

async function verifyToken(token: string, role?: string): Promise<boolean> {
  try {
    if (!SECRET) return false;
    const [payloadB64, sig] = token.split(".");
    if (!payloadB64 || !sig) return false;
    const payload = atob(payloadB64);
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", encoder.encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sigBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const expected = Array.from(new Uint8Array(sigBytes)).map(b => b.toString(16).padStart(2, "0")).join("");
    if (sig !== expected) return false;
    const data = JSON.parse(payload);
    if (role && data.role !== role) return false;
    return Date.now() - data.iat < 7 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function unauthorized(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", req.url));
}

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/")) {
    if (PUBLIC_API_PREFIXES.some((prefix) => req.nextUrl.pathname.startsWith(prefix))) {
      return NextResponse.next();
    }
    const tokenName = req.nextUrl.pathname.startsWith("/api/tech/") ? "tech_token" : "admin_token";
    const role = tokenName === "tech_token" ? "tech" : "admin";
    const auth = req.cookies.get(tokenName);
    if (!auth || !(await verifyToken(auth.value, role))) return unauthorized(req);
    return NextResponse.next();
  }

  if (req.nextUrl.pathname.startsWith("/admin")) {
    const auth = req.cookies.get("admin_token");
    if (!auth || !(await verifyToken(auth.value, "admin"))) return unauthorized(req);
  }
  if (req.nextUrl.pathname.startsWith("/tech") && !req.nextUrl.pathname.startsWith("/tech-login")) {
    const auth = req.cookies.get("tech_token");
    if (!auth || !(await verifyToken(auth.value, "tech"))) return unauthorized(req);
  }
  if (req.nextUrl.pathname.startsWith("/my-repairs") || req.nextUrl.pathname.startsWith("/my-appointments")) {
    const auth = req.cookies.get("customer_token");
    if (!auth || !(await verifyToken(auth.value, "customer"))) return unauthorized(req);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/tech/:path*", "/my-repairs/:path*", "/my-appointments/:path*", "/api/:path*"],
};
