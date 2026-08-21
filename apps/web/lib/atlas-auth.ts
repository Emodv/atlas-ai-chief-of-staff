import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lvkrvqpoajzpcqnlvqaj.supabase.co";
// Supabase publishable/anon keys are intentionally public client credentials, not secrets.
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2a3J2cXBvYWp6cGNxbmx2cWFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczNjMyODMsImV4cCI6MjA2MjkzOTI4M30.2-E5O83zYda26AFD81Uxxg395KDP0hyJ5-yWrqlp7M0";
const ACCESS_COOKIE = "atlas_access_token";
const REFRESH_COOKIE = "atlas_refresh_token";

function authHeaders(token?: string) {
  return {
    apikey: SUPABASE_ANON_KEY,
    "content-type": "application/json",
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };
}

export async function setAtlasSession(session: any) {
  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";
  if (session?.access_token) jar.set(ACCESS_COOKIE, session.access_token, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: Math.max(60, Number(session.expires_in ?? 3600)) });
  if (session?.refresh_token) jar.set(REFRESH_COOKIE, session.refresh_token, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
}

export async function clearAtlasSession() {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  jar.set(REFRESH_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

async function userFor(token: string) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: authHeaders(token), cache: "no-store" });
  if (!r.ok) return null;
  return await r.json();
}

async function refresh(refreshToken: string) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ refresh_token: refreshToken }), cache: "no-store" });
  if (!r.ok) return null;
  const session = await r.json();
  await setAtlasSession(session);
  return session;
}

export async function getAtlasSession() {
  const jar = await cookies();
  let accessToken = jar.get(ACCESS_COOKIE)?.value ?? null;
  const refreshToken = jar.get(REFRESH_COOKIE)?.value ?? null;
  if (accessToken) {
    const user = await userFor(accessToken);
    if (user?.id) return { accessToken, user };
  }
  if (!refreshToken) return null;
  const session = await refresh(refreshToken);
  accessToken = session?.access_token ?? null;
  if (!accessToken) return null;
  const user = await userFor(accessToken);
  return user?.id ? { accessToken, user } : null;
}

export async function signUp(email: string, password: string, fullName?: string) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ email, password, data: { full_name: fullName || undefined } }), cache: "no-store" });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) return { ok: false, status: r.status, error: data?.msg ?? data?.message ?? data?.error_description ?? "signup-failed" };
  if (data?.access_token) await setAtlasSession(data);
  return { ok: true, user: data?.user ?? null, session: Boolean(data?.access_token), confirmEmail: !data?.access_token };
}

export async function signIn(email: string, password: string) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ email, password }), cache: "no-store" });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) return { ok: false, status: r.status, error: data?.msg ?? data?.message ?? data?.error_description ?? "signin-failed" };
  await setAtlasSession(data);
  return { ok: true, user: data?.user ?? null };
}
