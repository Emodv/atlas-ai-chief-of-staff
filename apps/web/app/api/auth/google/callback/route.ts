import { cookies } from "next/headers";
import { setAtlasSession } from "../../../../../lib/atlas-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lvkrvqpoajzpcqnlvqaj.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2a3J2cXBvYWp6cGNxbmx2cWFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczNjMyODMsImV4cCI6MjA2MjkzOTI4M30.2-E5O83zYda26AFD81Uxxg395KDP0hyJ5-yWrqlp7M0";
const PKCE_COOKIE = "atlas_google_pkce";
const STATE_COOKIE = "atlas_google_state";
const MODE_COOKIE = "atlas_google_auth_mode";
const RETURN_COOKIE = "atlas_google_return";
const PROVIDER_COOKIE = "atlas_google_provider_token";

function clearTransientCookies(jar: Awaited<ReturnType<typeof cookies>>) {
  for (const name of [PKCE_COOKIE, STATE_COOKIE, MODE_COOKIE, RETURN_COOKIE]) {
    jar.set(name, "", { httpOnly: true, path: "/", maxAge: 0 });
  }
}

function setProviderToken(jar: Awaited<ReturnType<typeof cookies>>, token: string) {
  jar.set(PROVIDER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 55,
  });
}

async function directGoogleSession(requestUrl: URL, code: string, verifier: string, expectedState: string | undefined) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;

  const returnedState = requestUrl.searchParams.get("state");
  if (!expectedState || !returnedState || returnedState !== expectedState) {
    return { ok: false as const, error: "google-state" };
  }

  const redirectUri = `${requestUrl.origin}/api/auth/google/callback`;
  const googleResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
    cache: "no-store",
  });
  const google = await googleResponse.json().catch(() => ({}));
  if (!googleResponse.ok || !google?.id_token || !google?.access_token) {
    return { ok: false as const, error: "google-token" };
  }

  const supabaseResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=id_token`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "content-type": "application/json" },
    body: JSON.stringify({
      provider: "google",
      id_token: google.id_token,
      access_token: google.access_token,
    }),
    cache: "no-store",
  });
  const session = await supabaseResponse.json().catch(() => ({}));
  if (!supabaseResponse.ok || !session?.access_token) {
    return { ok: false as const, error: "supabase-id-token" };
  }

  return { ok: true as const, session, providerToken: google.access_token as string };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error") ?? url.searchParams.get("error_description");
  const origin = url.origin;
  if (error || !code) return Response.redirect(`${origin}/invite?error=google-auth`, 302);

  const jar = await cookies();
  const verifier = jar.get(PKCE_COOKIE)?.value;
  const expectedState = jar.get(STATE_COOKIE)?.value;
  const mode = jar.get(MODE_COOKIE)?.value === "workspace" ? "workspace" : "login";
  const requestedReturn = jar.get(RETURN_COOKIE)?.value;
  if (!verifier) return Response.redirect(`${origin}/invite?error=expired-auth`, 302);

  const direct = await directGoogleSession(url, code, verifier, expectedState);
  if (!direct) return Response.redirect(`${origin}/google-unavailable`, 302);
  if (!direct.ok) return Response.redirect(`${origin}/invite?error=${direct.error}`, 302);

  await setAtlasSession(direct.session);
  setProviderToken(jar, direct.providerToken);
  clearTransientCookies(jar);

  if (requestedReturn === "onboarding") return Response.redirect(`${origin}/onboarding`, 302);
  if (requestedReturn === "first-scan") return Response.redirect(`${origin}/first-scan`, 302);
  return Response.redirect(mode === "workspace" ? `${origin}/first-scan` : `${origin}/onboarding`, 302);
}
