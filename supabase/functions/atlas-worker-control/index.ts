import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.9.6";

const TEAM_SLUG = "emodvs-projects";
const PROJECT_NAME = "atlas-ai-chief-of-staff";
const ISSUER = `https://oidc.vercel.com/${TEAM_SLUG}`;
const AUDIENCE = `https://vercel.com/${TEAM_SLUG}`;
const SUBJECT = `owner:${TEAM_SLUG}:project:${PROJECT_NAME}:environment:production`;
const JWKS = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks`));
const USER_KEY = "primary";

const headers = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
  "access-control-allow-methods": "POST, OPTIONS",
};

type ExecutionPlan = {
  connector?: string;
  action_type?: string;
  description?: string;
  payload?: Record<string, unknown>;
  reversible?: boolean;
  requires_approval?: boolean;
  scheduled_for?: string;
  idempotency_key?: string;
  plan_version?: string | number;
  metrics?: {
    human_minutes_saved?: number;
    revenue_influenced?: number;
    money_saved?: number;
    opportunity_advanced?: boolean;
    relationship_protected?: boolean;
    metric_quality?: "estimated" | "measured" | "mixed";
  };
};

async function authorize(req: Request) {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new Error("missing_token");
  await jwtVerify(token, JWKS, { issuer: ISSUER, audience: AUDIENCE, subject: SUBJECT });
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
  const url = `${Deno.env.get("SUPABASE_URL")}/rest/v1/${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Database ${response.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers });
}

function score(row: any) {
  return Number(row.value_score ?? 0) + Number(row.probability_score ?? 0) + Number(row.speed_score ?? 0) + Number(row.urgency_score ?? 0) + Number(row.leverage_score ?? 0) + Number(row.effort_efficiency_score ?? 0);
}

function priority(master: number) {
  if (master >= 90) return "P0";
  if (master >= 75) return "P1";
  if (master >= 60) return "P2";
  if (master >= 40) return "P3";
  return "P4";
}

function reviewDelayMs(p: string) {
  if (p === "P0") return 60 * 60 * 1000;
  if (p === "P1") return 2 * 60 * 60 * 1000;
  if (p === "P2") return 6 * 60 * 60 * 1000;
  return 24 * 60 * 60 * 1000;
}

function objectOrEmpty(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function history(key: string, opportunityId: string, actionId: string | null, fromStage: string | null, toStage: string, reason: string, evidence: Record<string, unknown> = {}) {
  if (fromStage === toStage) return;
  try {
    await db("atlas_opportunity_history", key, {
      method: "POST",
      body: JSON.stringify({ user_key: USER_KEY, opportunity_id: opportunityId, action_id: actionId, from_stage: fromStage, to_stage: toStage, transition_reason: reason, evidence }),
    });
  } catch {}
}

async function setLifecycle(key: string, row: any, toStage: string, patch: Record<string, unknown> = {}, actionId: string | null = null, reason = "worker lifecycle transition") {
  const fromStage = row.lifecycle_stage ?? "detected";
  const updated = await db(`atlas_opportunities?id=eq.${encodeURIComponent(row.id)}&user_key=eq.${USER_KEY}`, key, {
    method: "PATCH",
    body: JSON.stringify({ lifecycle_stage: toStage, ...patch, updated_at: new Date().toISOString() }),
  });
  if (Array.isArray(updated) && updated.length === 1) {
    await history(key, row.id, actionId, fromStage, toStage, reason, patch);
    return updated[0];
  }
  return row;
}

function planEligibility(row: any, plan: ExecutionPlan) {
  if (!row.atlas_can_execute) return "atlas_execution_not_authorized";
  if (row.emod_required) return "human_judgment_required";
  if (Number(row.confidence ?? 0) < 0.85) return "confidence_below_autonomy_threshold";
  if ((row.action_risk ?? "low") !== "low") return "action_risk_not_low";
  if (!plan.connector) return "missing_connector";
  if (!plan.action_type) return "missing_action_type";
  if (plan.reversible === false) return "action_not_reversible";
  if (plan.requires_approval === true) return "approval_required";
  return null;
}

async function ensureAction(key: string, row: any, plan: ExecutionPlan) {
  const blocker = planEligibility(row, plan);
  if (blocker) return { queued: false, blocker, action: null };

  const connector = String(plan.connector);
  const actionType = String(plan.action_type);
  const idempotencyKey = plan.idempotency_key ?? await sha256(`${USER_KEY}|${row.id}|${plan.plan_version ?? "1"}|${connector}|${actionType}|${JSON.stringify(plan.payload ?? {})}`);
  const existingRows = await db(`atlas_actions?select=*&user_key=eq.${USER_KEY}&idempotency_key=eq.${encodeURIComponent(idempotencyKey)}&limit=1`, key, { method: "GET" });
  const existing = Array.isArray(existingRows) ? existingRows[0] ?? null : null;
  if (existing) {
    const targetStage = ["verification_pending", "verifying"].includes(existing.status) ? "acted" : existing.status === "completed" ? "learned" : "assigned";
    if ((row.lifecycle_stage ?? "detected") !== targetStage) {
      await setLifecycle(key, row, targetStage, { assigned_action_id: existing.id, last_action_at: existing.started_at ?? existing.created_at }, existing.id, `Synchronized from action ${existing.status}`);
    }
    return { queued: existing.status === "queued", blocker: null, action: existing, idempotent: true };
  }

  const payload = {
    ...objectOrEmpty(plan.payload),
    connector,
    opportunity_id: row.id,
    opportunity_external_key: row.external_key ?? null,
    metrics: plan.metrics ?? {},
  };
  const now = new Date().toISOString();
  let action: any = null;
  try {
    const rows = await db("atlas_actions", key, {
      method: "POST",
      body: JSON.stringify({
        user_key: USER_KEY,
        opportunity_id: row.id,
        action_type: actionType,
        description: plan.description ?? row.next_action ?? row.opportunity ?? `${row.category} opportunity`,
        decision: "execute",
        status: "queued",
        confidence: Number(row.confidence ?? 0),
        risk_level: "low",
        reversible: true,
        requires_approval: false,
        reason: `Opportunity ${row.priority ?? "unranked"} ${row.master_score ?? 0}/100; safe verified-execution plan`,
        payload,
        connector,
        idempotency_key: idempotencyKey,
        scheduled_for: plan.scheduled_for ?? now,
        verification_status: "pending",
        updated_at: now,
      }),
    });
    action = Array.isArray(rows) ? rows[0] ?? null : rows;
  } catch (error) {
    const rows = await db(`atlas_actions?select=*&user_key=eq.${USER_KEY}&idempotency_key=eq.${encodeURIComponent(idempotencyKey)}&limit=1`, key, { method: "GET" });
    action = Array.isArray(rows) ? rows[0] ?? null : null;
    if (!action) throw error;
  }

  if (action) {
    await setLifecycle(key, row, "assigned", { assigned_action_id: action.id, last_action_at: now }, action.id, "Safe action queued for autonomous worker");
  }
  return { queued: Boolean(action), blocker: null, action, idempotent: false };
}

export default {
  async fetch(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response("ok", { headers });
    if (req.method !== "POST") return json({ error: "POST required" }, 405);
    try { await authorize(req); } catch { return json({ error: "unauthorized" }, 401); }
    const key = await secretKey();
    if (!key) return json({ error: "Server persistence key unavailable" }, 503);

    const input = await req.json().catch(() => ({}));
    const action = input.action ?? "scan";
    if (action === "status") {
      const rows = await db(`atlas_opportunities?select=priority,status,lifecycle_stage&user_key=eq.${USER_KEY}`, key, { method: "GET" });
      const counts: Record<string, number> = {};
      const lifecycle: Record<string, number> = {};
      for (const row of rows ?? []) {
        counts[row.priority ?? "unscored"] = (counts[row.priority ?? "unscored"] ?? 0) + 1;
        lifecycle[row.lifecycle_stage ?? "detected"] = (lifecycle[row.lifecycle_stage ?? "detected"] ?? 0) + 1;
      }
      return json({ ok: true, service: "atlas-worker-control", opportunity_counts: counts, lifecycle_counts: lifecycle, protocol: "closed-loop-v1" });
    }
    if (action !== "scan") return json({ error: "Unsupported action" }, 400);

    const now = new Date();
    const nowIso = now.toISOString();
    const due = await db(
      `atlas_opportunities?select=*&user_key=eq.${USER_KEY}&status=eq.open&or=(next_review_at.is.null,next_review_at.lte.${encodeURIComponent(nowIso)})&order=deadline.asc.nullslast,updated_at.asc&limit=100`,
      key,
      { method: "GET" },
    );

    let rescored = 0;
    let queued = 0;
    let p0 = 0;
    let p1 = 0;
    const surfaced: Array<Record<string, unknown>> = [];
    const blockers: Array<Record<string, unknown>> = [];

    for (const original of due ?? []) {
      const master = score(original);
      const p = priority(master);
      const nextReview = new Date(now.getTime() + reviewDelayMs(p)).toISOString();
      const stage = original.lifecycle_stage === "detected" ? "ranked" : original.lifecycle_stage ?? "ranked";
      const patch = { next_review_at: nextReview, lifecycle_stage: stage, updated_at: nowIso };
      const updated = await db(`atlas_opportunities?id=eq.${encodeURIComponent(original.id)}&user_key=eq.${USER_KEY}`, key, { method: "PATCH", body: JSON.stringify(patch) });
      const row = Array.isArray(updated) && updated.length === 1 ? updated[0] : { ...original, ...patch };
      if (Array.isArray(updated) && updated.length === 1) {
        rescored++;
        if (original.lifecycle_stage === "detected") await history(key, row.id, null, "detected", "ranked", "Opportunity rescored by worker", { master_score: master, priority: p });
      }
      if (p === "P0") p0++;
      if (p === "P1") p1++;

      const plan = objectOrEmpty(row.execution_plan) as ExecutionPlan;
      if (Object.keys(plan).length) {
        const outcome = await ensureAction(key, row, plan);
        if (outcome.queued) queued++;
        if (outcome.blocker && blockers.length < 20) blockers.push({ id: row.id, priority: p, blocker: outcome.blocker });
      }

      if ((p === "P0" || p === "P1") && surfaced.length < 10) {
        surfaced.push({ id: row.id, person_company: row.person_company, category: row.category, priority: p, score: master, lifecycle_stage: row.lifecycle_stage, next_action: row.next_action, deadline: row.deadline, emod_required: row.emod_required });
      }
    }

    return json({ ok: true, scanned: Array.isArray(due) ? due.length : 0, rescored, queued, p0, p1, surfaced, blockers, protocol: "closed-loop-v1" });
  },
};
