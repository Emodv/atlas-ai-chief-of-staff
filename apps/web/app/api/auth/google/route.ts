import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { ATLAS_GOOGLE_READONLY_SCOPE_STRING } from "./scopes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lvkrvqpoajzpcqnlvqaj.supabase.co";
const PKCE_COOKIE = "atlas_google_pkce";

function base64url(input: Buffer) {
  return input.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export async function GET(request: Request) {
  const verifier = base64url(randomBytes(48));
  const challenge = base64url(createHash("sha256").update(verifier).digest());
  const jar = await cookies();
  jar.set(PKCE_COOKIE, verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  const origin = new URL(request.url).origin;
  const redirectTo = `${origin}/api/auth/google/callback`;

  const auth = new URL(`${SUPABASE_URL}/auth/v1/authorize`);
  auth.searchParams.set("provider", "google");
  auth.searchParams.set("redirect_to", redirectTo);
  auth.searchParams.set("code_challenge", challenge);
  auth.searchParams.set("code_challenge_method", "s256");
  auth.searchParams.set("scopes", ATLAS_GOOGLE_READONLY_SCOPE_STRING);
  auth.searchParams.set("access_type", "offline");
  auth.searchParams.set("prompt", "consent");
  auth.searchParams.set("include_granted_scopes", "true");

  try {
    const probe = await fetch(auth.toString(), { redirect: "manual", cache: "no-store" });
    const location = probe.headers.get("location");
    if (probe.status >= 300 && probe.status < 400 && location) {
      return Response.redirect(location, 302);
    }
    return Response.redirect(`${origin}/google-unavailable`, 302);
  } catch {
    return Response.redirect(`${origin}/google-unavailable`, 302);
  }
}
