import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const protectedPath = path.startsWith("/decisions") || path.startsWith("/onboarding");
  if (!protectedPath) return NextResponse.next();
  const hasSession = Boolean(request.cookies.get("atlas_access_token")?.value || request.cookies.get("atlas_refresh_token")?.value);
  if (hasSession) return NextResponse.next();
  const login = new URL("/login", request.url);
  login.searchParams.set("next", path);
  return NextResponse.redirect(login);
}

export const config = { matcher: ["/decisions/:path*", "/onboarding/:path*"] };
