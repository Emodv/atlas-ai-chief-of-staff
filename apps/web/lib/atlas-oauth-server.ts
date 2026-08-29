import { getAtlasSession } from "./atlas-auth";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lvkrvqpoajzpcqnlvqaj.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

async function oauthRequest(path: string, init: RequestInit = {}) {
  const session = await getAtlasSession();
  if (!session) return { ok: false, status: 401, data: null, error: "authentication-required" };
  const response = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      authorization: `Bearer ${session.accessToken}`,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  const text = await response.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { ok: response.ok, status: response.status, data, error: response.ok ? null : String(data?.message ?? data?.error_description ?? data?.error ?? text ?? response.statusText) };
}

export async function getOAuthAuthorizationDetails(authorizationId: string) {
  return oauthRequest(`/oauth/authorizations/${encodeURIComponent(authorizationId)}`);
}

export async function decideOAuthAuthorization(authorizationId: string, decision: "approve" | "deny") {
  return oauthRequest(`/oauth/authorizations/${encodeURIComponent(authorizationId)}/consent`, {
    method: "POST",
    body: JSON.stringify({ action: decision }),
  });
}
