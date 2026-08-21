import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.9.6";

const TEAM_SLUG = "emodvs-projects";
const PROJECT_NAME = "atlas-ai-chief-of-staff";
const ISSUER = `https://oidc.vercel.com/${TEAM_SLUG}`;
const AUDIENCE = `https://vercel.com/${TEAM_SLUG}`;
const SUBJECT = `owner:${TEAM_SLUG}:project:${PROJECT_NAME}:environment:production`;
const JWKS = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks`));

export type WorkspaceIdentity = {
  userKey: string;
  workspaceId: string | null;
  authUserId: string | null;
  autonomyLevel: "suggest" | "approval" | "autonomous";
  executionEnabled: boolean;
  killSwitch: boolean;
  source: "supabase-user" | "trusted-internal";
};

async function rest(path: string, serviceKey: string) {
  const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/${path}`, {
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      "content-type": "application/json",
    },
  });
  if (!response.ok) throw new Error(`workspace_lookup_${response.status}`);
  return await response.json();
}

async function trySupabaseUser(token: string, serviceKey: string): Promise<WorkspaceIdentity | null> {
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || serviceKey;
  const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
    headers: { apikey: anonKey, authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  const user = await response.json();
  if (!user?.id) return null;

  const memberships = await rest(
    `atlas_workspace_members?select=workspace_id,role&auth_user_id=eq.${encodeURIComponent(user.id)}&order=created_at.asc&limit=1`,
    serviceKey,
  );
  const membership = memberships?.[0];
  if (!membership?.workspace_id) throw new Error("workspace_membership_missing");

  const workspaces = await rest(
    `atlas_workspaces?select=id,user_key,autonomy_level,execution_enabled,kill_switch&id=eq.${encodeURIComponent(membership.workspace_id)}&limit=1`,
    serviceKey,
  );
  const workspace = workspaces?.[0];
  if (!workspace?.user_key) throw new Error("workspace_missing");

  return {
    userKey: workspace.user_key,
    workspaceId: workspace.id,
    authUserId: user.id,
    autonomyLevel: workspace.autonomy_level ?? "suggest",
    executionEnabled: Boolean(workspace.execution_enabled),
    killSwitch: Boolean(workspace.kill_switch),
    source: "supabase-user",
  };
}

async function tryTrustedInternal(token: string): Promise<WorkspaceIdentity | null> {
  try {
    await jwtVerify(token, JWKS, { issuer: ISSUER, audience: AUDIENCE, subject: SUBJECT });
    return {
      userKey: "primary",
      workspaceId: null,
      authUserId: null,
      autonomyLevel: "approval",
      executionEnabled: true,
      killSwitch: false,
      source: "trusted-internal",
    };
  } catch {
    return null;
  }
}

export async function resolveWorkspace(req: Request, serviceKey: string): Promise<WorkspaceIdentity> {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new Error("missing_token");

  const userIdentity = await trySupabaseUser(token, serviceKey);
  if (userIdentity) return userIdentity;

  const internalIdentity = await tryTrustedInternal(token);
  if (internalIdentity) return internalIdentity;

  throw new Error("unauthorized");
}
