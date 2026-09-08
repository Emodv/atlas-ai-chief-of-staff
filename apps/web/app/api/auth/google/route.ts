import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import {
  ATLAS_GOOGLE_LOGIN_SCOPE_STRING,
  ATLAS_GOOGLE_READONLY_SCOPE_STRING,
} from "./scopes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PKCE_COOKIE = "atlas_google_pkce";
const STATE_COOKIE = "atlas_google_state";
const MODE_COOKIE = "atlas_google_auth_mode";
const RETURN_COOKIE = "atlas_google_return";
const DEFAULT_PRODUCTION_ORIGIN = "https://atlas.moda";

function base64url(input: Buffer) {
  return input.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function cookieOptions(maxAge = 60 * 10) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

function productionOrigin() {
  return (process.env.ATLAS_PUBLIC_ORIGIN?.trim() || DEFAULT_PRODUCTION_ORIGIN).replace(/\/$/, "");
}

function shouldDelegateToProduction(url: URL) {
  const canonical = productionOrigin();
  return url.origin !== canonical && (process.env.VERCEL_ENV === "preview" || url.hostname.endsWith(".vercel.app"));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const workspace = url.searchParams.get("workspace") === "1";
  const requestedReturn = url.searchParams.get("return");
  const returnTarget = requestedReturn === "onboarding" ? "onboarding" : requestedReturn === "first-scan" ? "first-scan" : "";
  const origin = url.origin;
  const redirectTo = `${origin}/api/auth/google/callback`;
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  // Vercel preview deployments often do not receive production OAuth secrets and
  // Google redirect URIs should remain stable. Instead of dead-ending users on a
  // preview-only error page, continue the connection flow on the canonical app.
  if ((!clientId || !clientSecret) && shouldDelegateToProduction(url)) {
    const canonicalAuth = new URL("/api/auth/google", productionOrigin());
    if (workspace) canonicalAuth.searchParams.set("workspace", "1");
    if (returnTarget) canonicalAuth.searchParams.set("return", returnTarget);
    return Response.redirect(canonicalAuth.toString(), 302);
  }

  if (!clientId || !clientSecret) {
    const fallback = new URL("/google-unavailable", origin);
    fallback.searchParams.set("from", workspace ? "workspace" : "login");
    return Response.redirect(fallback.toString(), 302);
  }

  const verifier = base64url(randomBytes(48));
  const challenge = base64url(createHash("sha256").update(verifier).digest());
  const state = base64url(randomBytes(32));
  const jar = await cookies();

  jar.set(PKCE_COOKIE, verifier, cookieOptions());
  jar.set(STATE_COOKIE, state, cookieOptions());
  jar.set(MODE_COOKIE, workspace ? "workspace" : "login", cookieOptions());
  if (returnTarget) jar.set(RETURN_COOKIE, returnTarget, cookieOptions());

  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.searchParams.set("client_id", clientId);
  auth.searchParams.set("redirect_uri", redirectTo);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("scope", workspace ? ATLAS_GOOGLE_READONLY_SCOPE_STRING : ATLAS_GOOGLE_LOGIN_SCOPE_STRING);
  auth.searchParams.set("state", state);
  auth.searchParams.set("code_challenge", challenge);
  auth.searchParams.set("code_challenge_method", "S256");
  auth.searchParams.set("include_granted_scopes", "true");
  auth.searchParams.set("access_type", "offline");
  auth.searchParams.set("prompt", workspace ? "consent" : "select_account");
  return Response.redirect(auth.toString(), 302);
}
