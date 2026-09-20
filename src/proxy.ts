import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const configuredPassword = process.env.EDITOR_PASSWORD;
  if (!configuredPassword) return NextResponse.next();
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Basic ")) {
    const decoded = atob(authorization.slice(6));
    const separator = decoded.indexOf(":");
    if (separator > -1 && decoded.slice(separator + 1) === configuredPassword) return NextResponse.next();
  }
  return new NextResponse("Authentication required", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Field / Notes editor"' } });
}

export const config = { matcher: ["/private-editor/:path*", "/api/admin/:path*"] };
