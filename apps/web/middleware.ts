import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path === "/") {
    return NextResponse.redirect(new URL("/invite", request.url));
  }

  // The legacy MCP backend still targets the owner's `primary` workspace.
  // Never expose it to public Atlas.Moda users until MCP has per-user OAuth.
  if (path.startsWith("/api/mcp")) {
    const expected = process.env.ATLAS_MCP_ACCESS_TOKEN?.trim();
    const authorization = request.headers.get("authorization") ?? "";
    const authorized = Boolean(expected) && authorization === `Bearer ${expected}`;

    if (authorized) return NextResponse.next();

    return NextResponse.json(
      {
        error: "mcp-tenant-auth-required",
        message: "Atlas.Moda MCP is temporarily gated while per-user OAuth isolation is completed.",
      },
      {
        status: expected ? 401 : 503,
        headers: { "cache-control": "no-store" },
      },
    );
  }

  const protectedPath = path.startsWith("/decisions") || path.startsWith("/onboarding");
  if (!protectedPath) return NextResponse.next();

  const hasSession = Boolean(
    request.cookies.get("atlas_access_token")?.value ||
    request.cookies.get("atlas_refresh_token")?.value,
  );

  if (hasSession) return NextResponse.next();

  const login = new URL("/login", request.url);
  login.searchParams.set("next", path);
  return NextResponse.redirect(login);
}

export const config = { matcher: ["/", "/api/mcp/:path*", "/decisions/:path*", "/onboarding/:path*"] };
