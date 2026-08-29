import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lvkrvqpoajzpcqnlvqaj.supabase.co";

export async function GET() {
  const discoveryUrl = `${supabaseUrl}/.well-known/oauth-authorization-server/auth/v1`;
  try {
    const response = await fetch(discoveryUrl, { cache: "no-store" });
    const data = response.ok ? await response.json().catch(() => ({})) : {};
    const issuer = typeof data?.issuer === "string" ? data.issuer : null;
    const authorizationEndpoint = typeof data?.authorization_endpoint === "string" ? data.authorization_endpoint : null;
    const tokenEndpoint = typeof data?.token_endpoint === "string" ? data.token_endpoint : null;
    const registrationEndpoint = typeof data?.registration_endpoint === "string" ? data.registration_endpoint : null;
    const scopes = Array.isArray(data?.scopes_supported) ? data.scopes_supported.filter((x: unknown) => typeof x === "string") : [];
    const ready = response.ok && Boolean(issuer && authorizationEndpoint && tokenEndpoint);
    return NextResponse.json({
      ok: ready,
      oauthServerEnabled: ready,
      status: response.status,
      issuer,
      authorizationEndpoint,
      tokenEndpoint,
      dynamicClientRegistration: Boolean(registrationEndpoint),
      openidReady: scopes.includes("openid"),
      emailReady: scopes.includes("email"),
    }, { status: ready ? 200 : 503, headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, oauthServerEnabled: false, error: "oauth-discovery-unreachable" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
