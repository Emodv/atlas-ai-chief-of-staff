import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.9.6";

const TEAM_SLUG = "emodvs-projects";
const PROJECT_NAME = "atlas-ai-chief-of-staff";
const USER_KEY = "primary";
const ISSUER = `https://oidc.vercel.com/${TEAM_SLUG}`;
const AUDIENCE = `https://vercel.com/${TEAM_SLUG}`;
const SUBJECT = `owner:${TEAM_SLUG}:project:${PROJECT_NAME}:environment:production`;
const JWKS = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks`));
const headers = { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, apikey, content-type", "access-control-allow-methods": "POST, OPTIONS" };

type Input = { action: "list" } | { action: "approve" | "reject"; action_id: string; note?: string };

async function authorize(req: Request) {
  const h = req.headers.get("authorization") || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!t) throw new Error("missing_token");
  await jwtVerify(t, JWKS, { issuer: ISSUER, audience: AUDIENCE, subject: SUBJECT });
}

async function secretKey(): Promise<string | null> {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const key = parsed.default ?? Object.values(parsed)[0];
      if (typeof key === "string") return key;
    } catch {}
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
}

async function db(path: string, key: string, init: RequestInit = {}) {
  const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json", prefer: "return=representation", ...(init.headers ?? {}) },
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`Database ${r.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers }); }

async function getAction(key: string, id: string) {
  const rows = await db(`atlas_actions?select=*&user_key=eq.${USER_KEY}&id=eq.${encodeURIComponent(id)}&limit=1`, key, { method: "GET" });
  return rows?.[0] ?? null;
}

async function listApprovals(key: string) {
  const actions = await db(`atlas_actions?select=*&user_key=eq.${USER_KEY}&status=eq.awaiting_approval&order=created_at.asc`, key, { method: "GET" });
  const oppIds = Array.from(new Set((actions ?? []).map((x: any) => x.opportunity_id).filter(Boolean)));
  let opportunities: any[] = [];
  if (oppIds.length) opportunities = await db(`atlas_opportunities?select=id,person_company,category,opportunity,risk,estimated_value,master_score,priority,deadline,lifecycle_stage&id=in.(${oppIds.join(",")})&user_key=eq.${USER_KEY}`, key, { method: "GET" });
  const byId = new Map(opportunities.map((x: any) => [x.id, x]));
  return (actions ?? []).map((action: any) => ({ ...action, opportunity: byId.get(action.opportunity_id) ?? null }));
}

async function recordDecision(key: string, row: any, decision: "approved" | "rejected", note?: string) {
  const residualRisk = decision === "approved" ? "low" : row.risk_level;
  await db("atlas_approval_decisions", key, {
    method: "POST",
    body: JSON.stringify({ user_key: USER_KEY, action_id: row.id, opportunity_id: row.opportunity_id, decision, original_risk_level: row.risk_level, residual_risk_level: residualRisk, note: note ?? null, decided_by: "user", metadata: { action_type: row.action_type, connector: row.connector ?? row.payload?.connector ?? null } }),
  });
  await db("atlas_corrections", key, {
    method: "POST",
    body: JSON.stringify({ user_key: USER_KEY, task_type: row.action_type, outcome: decision === "approved" ? "accepted" : "rejected", predicted: row.description ?? row.action_type, actual: decision, reason: note ?? `Decision Inbox ${decision}`, relationship_key: row.opportunity_id ?? null }),
  }).catch(() => null);
  await db("atlas_attention_outcomes?on_conflict=user_key,action_id", key, {
    method: "POST",
    headers: { prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ user_key: USER_KEY, opportunity_id: row.opportunity_id, action_id: row.id, connector: row.connector ?? row.payload?.connector ?? "internal", human_minutes_saved: 0, revenue_influenced: null, money_saved: null, opportunity_advanced: false, relationship_protected: false, autonomous_actions: 0, human_decisions: 1, metric_quality: "measured", verification_evidence: { decision, decided_at: new Date().toISOString() } }),
  }).catch(() => null);
}

async function approve(key: string, id: string, note?: string) {
  const row = await getAction(key, id);
  if (!row) return { ok: false, status: 404, error: "action-not-found" };
  if (row.status !== "awaiting_approval") return { ok: false, status: 409, error: "action-not-awaiting-approval", action: row };
  if (!row.reversible || !["low", "medium"].includes(row.risk_level)) return { ok: false, status: 409, error: "action-requires-direct-human-execution", action: row };
  await recordDecision(key, row, "approved", note);
  const updated = await db(`atlas_actions?id=eq.${encodeURIComponent(id)}&user_key=eq.${USER_KEY}&status=eq.awaiting_approval`, key, {
    method: "PATCH",
    body: JSON.stringify({ decision: "execute", status: "queued", requires_approval: false, risk_level: "low", reason: `${row.reason ?? ""}${row.reason ? " · " : ""}Human approved via Decision Inbox`, updated_at: new Date().toISOString() }),
  });
  return { ok: true, decision: "approved", action: updated?.[0] ?? row, execution_ready: true };
}

async function reject(key: string, id: string, note?: string) {
  const row = await getAction(key, id);
  if (!row) return { ok: false, status: 404, error: "action-not-found" };
  if (row.status !== "awaiting_approval") return { ok: false, status: 409, error: "action-not-awaiting-approval", action: row };
  await recordDecision(key, row, "rejected", note);
  const updated = await db(`atlas_actions?id=eq.${encodeURIComponent(id)}&user_key=eq.${USER_KEY}&status=eq.awaiting_approval`, key, {
    method: "PATCH",
    body: JSON.stringify({ decision: "ignore", status: "cancelled", requires_approval: false, reason: `${row.reason ?? ""}${row.reason ? " · " : ""}Human rejected via Decision Inbox`, updated_at: new Date().toISOString() }),
  });
  return { ok: true, decision: "rejected", action: updated?.[0] ?? row };
}

export default { async fetch(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);
  try { await authorize(req); } catch { return json({ error: "unauthorized" }, 401); }
  const key = await secretKey();
  if (!key) return json({ error: "Server persistence key unavailable" }, 503);
  let input: Input;
  try { input = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
  try {
    if (input.action === "list") {
      const items = await listApprovals(key);
      return json({ ok: true, count: items.length, items });
    }
    if (input.action === "approve") {
      const result = await approve(key, input.action_id, input.note);
      return json(result, (result as any).status ?? 200);
    }
    if (input.action === "reject") {
      const result = await reject(key, input.action_id, input.note);
      return json(result, (result as any).status ?? 200);
    }
    return json({ error: "Unsupported action" }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
} };
