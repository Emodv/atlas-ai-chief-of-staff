const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lvkrvqpoajzpcqnlvqaj.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export type AtlasTenant = {
  userId: string;
  userKey: string | null;
  workspaceId: string | null;
  workspaceName: string | null;
  autonomyLevel: string | null;
  executionEnabled: boolean;
  killSwitch: boolean;
};

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const segment = token.split(".")[1];
    if (!segment) return {};
    const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch {
    return {};
  }
}

async function supabaseFetch(path: string, token: string, init: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
}

export async function resolveAtlasTenant(token: string): Promise<AtlasTenant | null> {
  if (!token || !SUPABASE_ANON_KEY) return null;

  // This endpoint validates the token with Supabase Auth. JWT decoding below is
  // used only for non-authoritative metadata after this validation succeeds.
  const userResponse = await supabaseFetch("/auth/v1/user", token);
  if (!userResponse.ok) return null;
  const user = await userResponse.json().catch(() => null);
  if (!user?.id) return null;

  const members = await supabaseFetch(
    `/rest/v1/atlas_workspace_members?select=workspace_id,role&auth_user_id=eq.${encodeURIComponent(user.id)}&order=created_at.asc&limit=1`,
    token,
  );
  const memberRows = members.ok ? await members.json().catch(() => []) : [];
  const workspaceId = memberRows?.[0]?.workspace_id ?? null;

  if (!workspaceId) {
    return {
      userId: user.id,
      userKey: null,
      workspaceId: null,
      workspaceName: null,
      autonomyLevel: null,
      executionEnabled: false,
      killSwitch: true,
    };
  }

  const workspaces = await supabaseFetch(
    `/rest/v1/atlas_workspaces?select=id,user_key,name,autonomy_level,execution_enabled,kill_switch&id=eq.${encodeURIComponent(workspaceId)}&limit=1`,
    token,
  );
  const workspaceRows = workspaces.ok ? await workspaces.json().catch(() => []) : [];
  const workspace = workspaceRows?.[0];
  if (!workspace?.user_key) return null;

  return {
    userId: user.id,
    userKey: workspace.user_key,
    workspaceId: workspace.id,
    workspaceName: workspace.name ?? null,
    autonomyLevel: workspace.autonomy_level ?? "suggest",
    executionEnabled: Boolean(workspace.execution_enabled),
    killSwitch: workspace.kill_switch !== false,
  };
}

export async function verifyAtlasMcpToken(_req: Request, token?: string) {
  if (!token) return undefined;
  const tenant = await resolveAtlasTenant(token);
  if (!tenant) return undefined;
  const payload = decodeJwtPayload(token);
  const rawScope = typeof payload.scope === "string" ? payload.scope : "";
  const scopes = rawScope.split(/\s+/).filter(Boolean);
  const clientId = typeof payload.client_id === "string" ? payload.client_id : `supabase:${tenant.userId}`;

  return {
    token,
    clientId,
    scopes,
    extra: {
      atlasTenant: tenant,
      oauthClientId: typeof payload.client_id === "string" ? payload.client_id : null,
      subject: tenant.userId,
    },
  };
}

export function tenantFromToolContext(ctx: any): AtlasTenant | null {
  return (ctx?.http?.authInfo?.extra?.atlasTenant as AtlasTenant | undefined) ?? null;
}

export function tokenFromToolContext(ctx: any): string | null {
  return typeof ctx?.http?.authInfo?.token === "string" ? ctx.http.authInfo.token : null;
}

export async function atlasTenantRest(token: string, path: string, init: RequestInit = {}) {
  const response = await supabaseFetch(`/rest/v1/${path}`, token, {
    ...init,
    headers: { prefer: "return=representation", ...(init.headers ?? {}) },
  });
  const text = await response.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { ok: response.ok, status: response.status, data, error: response.ok ? null : String(text || response.statusText) };
}
