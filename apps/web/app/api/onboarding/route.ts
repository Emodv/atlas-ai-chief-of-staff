import { atlasUserRest, getAtlasSession } from "../../../lib/atlas-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function currentWorkspace() {
  const result = await atlasUserRest("atlas_workspaces?select=id,user_key,name,autonomy_level,execution_enabled,kill_switch,onboarding_completed&limit=1");
  if (!result.ok) return { result, workspace: null as any };
  const workspace = Array.isArray(result.data) ? result.data[0] ?? null : null;
  return { result, workspace };
}

export async function GET() {
  const session = await getAtlasSession();
  if (!session) return Response.json({ ok: false, error: "authentication-required" }, { status: 401 });
  const { result, workspace } = await currentWorkspace();
  if (!result.ok || !workspace) return Response.json({ ok: false, error: result.error ?? "workspace-missing" }, { status: result.status || 404 });
  return Response.json({ ok: true, workspace }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const session = await getAtlasSession();
  if (!session) return Response.json({ ok: false, error: "authentication-required" }, { status: 401 });
  let body: any;
  try { body = await request.json(); } catch { return Response.json({ ok: false, error: "invalid-json" }, { status: 400 }); }
  const { result, workspace } = await currentWorkspace();
  if (!result.ok || !workspace) return Response.json({ ok: false, error: result.error ?? "workspace-missing" }, { status: result.status || 404 });

  const autonomy = ["suggest", "approval", "autonomous"].includes(body?.autonomy_level) ? body.autonomy_level : "suggest";
  const profile = {
    role: String(body?.role ?? "").slice(0, 160),
    north_star: String(body?.north_star ?? "").slice(0, 500),
    priorities: Array.isArray(body?.priorities) ? body.priorities.slice(0, 8).map((x: unknown) => String(x).slice(0, 120)) : [],
    protected_time: String(body?.protected_time ?? "").slice(0, 240),
    communication_style: String(body?.communication_style ?? "concise").slice(0, 120),
  };

  const now = new Date().toISOString();
  const [workspaceUpdate, profileUpsert, runtimeUpsert] = await Promise.all([
    atlasUserRest(`atlas_workspaces?id=eq.${encodeURIComponent(workspace.id)}`, { method: "PATCH", body: JSON.stringify({ autonomy_level: autonomy, onboarding_completed: true, execution_enabled: false, kill_switch: true, updated_at: now }) }),
    atlasUserRest("atlas_profile?on_conflict=user_key", { method: "POST", headers: { prefer: "return=representation,resolution=merge-duplicates" }, body: JSON.stringify({ user_key: workspace.user_key, profile, preferences: { communication_style: profile.communication_style }, updated_at: now }) }),
    atlasUserRest("atlas_runtime_state?on_conflict=user_key", { method: "POST", headers: { prefer: "return=representation,resolution=merge-duplicates" }, body: JSON.stringify({ user_key: workspace.user_key, learning_mode: "learning", shadow_mode: "shadow", autonomy_enabled: false, connected_sources: [], updated_at: now }) }),
  ]);

  const failures = [workspaceUpdate, profileUpsert, runtimeUpsert].filter((x) => !x.ok);
  if (failures.length) return Response.json({ ok: false, error: failures.map((x) => x.error).join(" | ") }, { status: 500 });

  await atlasUserRest("atlas_alpha_events", {
    method: "POST",
    body: JSON.stringify({ user_key: workspace.user_key, event_type: "onboarding_completed", metadata: { autonomy_requested: autonomy, safe_mode: true } }),
  }).catch(() => null);

  return Response.json({ ok: true, safe_mode: true, execution_enabled: false, first_value_required: true, next: "/decisions" });
}
