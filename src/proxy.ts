import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const attempts = new Map<string, { count: number; resetAt: number }>();
const windowMs = 15 * 60 * 1000;
const maxAttempts = 10;

export function proxy(request: NextRequest) {
  const passwordHash = process.env.EDITOR_PASSWORD_HASH;
  const clientKey = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const record = attempts.get(clientKey);
  if (record && record.resetAt > now && record.count >= maxAttempts) return unauthorized("Too many authentication attempts");
  if (!passwordHash) return new NextResponse("Editor authentication is not configured", { status: 503, headers: securityHeaders() });
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Basic ")) {
    try {
      const decoded = atob(authorization.slice(6));
      const separator = decoded.indexOf(":");
      const password = separator > -1 ? decoded.slice(separator + 1) : "";
      if (separator > -1 && bcrypt.compareSync(password, passwordHash)) { attempts.delete(clientKey); return NextResponse.next(); }
    } catch { /* Treat malformed credentials as a failed attempt. */ }
  }
  if (record && record.resetAt > now) attempts.set(clientKey, { count: record.count + 1, resetAt: record.resetAt });
  else attempts.set(clientKey, { count: 1, resetAt: now + windowMs });
  return unauthorized("Authentication required");
}

function unauthorized(message: string) { return new NextResponse(message, { status: 401, headers: { ...securityHeaders(), "WWW-Authenticate": 'Basic realm="Field / Notes editor", charset="UTF-8"' } }); }
function securityHeaders() { return { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer" }; }

export const config = { matcher: ["/private-editor/:path*", "/api/admin/:path*"] };
