import { atlasUserRest, getAtlasSession } from "../../../lib/atlas-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sum(rows: any[], field: string) {
  return rows.reduce((total, row) => total + Number(row?.[field] ?? 0), 0);
}

export async function GET() {
  const session = await getAtlasSession();
  if (!session) return Response.json({ ok: false, error: "authentication-required" }, { status: 401, headers: { "cache-control": "no-store" } });

  const [actionsResult, outcomesResult, runtimeResult, workspaceResult, opportunitiesResult] = await Promise.all([
    atlasUserRest("atlas_actions?select=status,connector"),
    atlasUserRest("atlas_attention_outcomes?select=human_minutes_saved,revenue_influenced,money_saved,autonomous_actions,human_decisions"),
    atlasUserRest("atlas_runtime_state?select=connected_sources,autonomy_enabled,shadow_mode&limit=1"),
    atlasUserRest("atlas_workspaces?select=autonomy_level,execution_enabled,kill_switch,onboarding_completed&limit=1"),
    atlasUserRest("atlas_opportunities?select=id,master_score,priority,status"),
  ]);

  if (!actionsResult.ok) return Response.json({ ok: false, error: actionsResult.error }, { status: actionsResult.status, headers: { "cache-control": "no-store" } });
  const actions = Array.isArray(actionsResult.data) ? actionsResult.data : [];
  const outcomes = Array.isArray(outcomesResult.data) ? outcomesResult.data : [];
  const runtime = Array.isArray(runtimeResult.data) ? runtimeResult.data[0] ?? {} : {};
  const workspace = Array.isArray(workspaceResult.data) ? workspaceResult.data[0] ?? {} : {};
  const opportunities = Array.isArray(opportunitiesResult.data) ? opportunitiesResult.data : [];
  const counts: Record<string, number> = {};
  const connectorCounts: Record<string, number> = {};
  for (const action of actions) {
    counts[action.status] = (counts[action.status] ?? 0) + 1;
    if (action.connector) connectorCounts[action.connector] = (connectorCounts[action.connector] ?? 0) + 1;
  }
  const sources = Array.isArray(runtime.connected_sources) ? runtime.connected_sources : [];
  const connectedSources = sources.length;
  const meaningfulOpportunities = opportunities.filter((x: any) => Number(x.master_score ?? 0) >= 60 && x.status !== "closed");
  const safeToExecute = Boolean(workspace.execution_enabled) && !Boolean(workspace.kill_switch);
  const firstValueReached = connectedSources >= 1 && meaningfulOpportunities.length >= 1;

  return Response.json({
    ok: true,
    counts,
    connector_counts: connectorCounts,
    human_attention_returned: {
      human_minutes_saved: sum(outcomes, "human_minutes_saved"),
      revenue_influenced: sum(outcomes, "revenue_influenced"),
      money_saved: sum(outcomes, "money_saved"),
      autonomous_actions: sum(outcomes, "autonomous_actions"),
      human_decisions: sum(outcomes, "human_decisions"),
    },
    trust: {
      score: Math.min(100, connectedSources * 12 + (workspace.onboarding_completed ? 16 : 0) + (safeToExecute ? 12 : 0)),
      stage: workspace.kill_switch ? "safe-mode" : workspace.autonomy_level ?? "suggest",
      autonomyAllowed: safeToExecute && workspace.autonomy_level === "autonomous",
    },
    first_value: {
      reached: firstValueReached,
      connected_sources: sources,
      meaningful_opportunities: meaningfulOpportunities.length,
      next_gate: connectedSources < 1 ? "connect-real-source" : meaningfulOpportunities.length < 1 ? "complete-first-scan" : "complete",
    },
    workspace: {
      autonomy_level: workspace.autonomy_level ?? "suggest",
      execution_enabled: Boolean(workspace.execution_enabled),
      kill_switch: Boolean(workspace.kill_switch),
      onboarding_completed: Boolean(workspace.onboarding_completed),
    },
  }, { headers: { "cache-control": "no-store" } });
}

export async function POST() {
  return Response.json({ ok: false, error: "browser-execution-disabled-use-verified-worker" }, { status: 403, headers: { "cache-control": "no-store" } });
}
