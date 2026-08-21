import { cookies } from "next/headers";
import { setAtlasSession } from "../../../../../lib/atlas-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lvkrvqpoajzpcqnlvqaj.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2a3J2cXBvYWp6cGNxbmx2cWFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczNjMyODMsImV4cCI6MjA2MjkzOTI4M30.2-E5O83zYda26AFD81Uxxg395KDP0hyJ5-yWrqlp7M0";
const PKCE_COOKIE = "atlas_google_pkce";
const PROVIDER_COOKIE = "atlas_google_provider_token";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error") ?? url.searchParams.get("error_description");
  const origin = url.origin;
  if (error || !code) return Response.redirect(`${origin}/invite?error=google-auth`, 302);

  const jar = await cookies();
  const verifier = jar.get(PKCE_COOKIE)?.value;
  if (!verifier) return Response.redirect(`${origin}/invite?error=expired-auth`, 302);

  const tokenResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "content-type": "application/json" },
    body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
    cache: "no-store",
  });

  const session = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !session?.access_token) {
    return Response.redirect(`${origin}/invite?error=google-token`, 302);
  }

  await setAtlasSession(session);
  jar.set(PKCE_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  if (session.provider_token) {
    jar.set(PROVIDER_COOKIE, session.provider_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 55,
    });
  }

  return Response.redirect(`${origin}/first-scan`, 302);
}
