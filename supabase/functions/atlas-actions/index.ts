import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.9.6";

type ActionRequest =
  | { action: "next"; worker_id?: string; connectors?: string[] }
  | { action: "next_verify"; worker_id?: string; connectors?: string[] }
  | { action: "status" }
  | { action: "reap" }
  | { action: "executed"; action_id: string; connector: string; receipt?: Record<string, unknown>; result?: Record<string, unknown>; note?: string }
  | { action: "verified"; action_id: string; connector: string; verification_receipt?: Record<string, unknown>; verification_result?: Record<string, unknown>; note?: string }
  | { action: "complete"; action_id: string; connector: string; receipt?: Record<string, unknown>; result?: Record<string, unknown>; note?: string }
  | { action: "fail"; action_id: string; connector?: string; error: string; receipt?: Record<string, unknown>; retryable?: boolean; uncertain_external_outcome?: boolean; phase?: "execute" | "verify" };

const TEAM_SLUG = "emodvs-projects";
const PROJECT_NAME = "atlas-ai-chief-of-staff";
const USER_KEY = "primary";
const ISSUER = `https://oidc.vercel.com/${TEAM_SLUG}`;
const AUDIENCE = `https://vercel.com/${TEAM_SLUG}`;
const SUBJECT = `owner:${TEAM_SLUG}:project:${PROJECT_NAME}:environment:production`;
const JWKS = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks`));
const LEASE_MS = 4 * 60 * 1000;
const headers = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
  "access-control-allow-methods": "POST, OPTIONS",
};

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
      const p = JSON.parse(raw);
      const k = p.default ?? Object.values(p)[0];
      if (typeof k === "string") return k;
    } catch {}
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
}

async function db(path: string, key: string, init: RequestInit = {}) {
  const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`Database ${r.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers });
}

function objectOrEmpty(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function numeric(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function getAction(key: string, id: string) {
  const rows = await db(`atlas_actions?select=*&id=eq.${encodeURIComponent(id)}&user_key=eq.${USER_KEY}&limit=1`, key, { method: "GET" });
  return Array.isArray(rows) ? rows[0] ?? null : null;
}

async function getOpportunity(key: string, id: string | null | undefined) {
  if (!id) return null;
  const rows = await db(`atlas_opportunities?select=*&id=eq.${encodeURIComponent(id)}&user_key=eq.${USER_KEY}&limit=1`, key, { method: "GET" });
  return Array.isArray(rows) ? rows[0] ?? null : null;
}

async function autonomyMaturity(key: string) {
  const [stateRows, evidence, corrections, events] = await Promise.all([
    db(`atlas_runtime_state?select=connected_sources,shadow_mode&user_key=eq.${USER_KEY}&limit=1`, key, { method: "GET" }),
    db(`atlas_evidence?select=id&user_key=eq.${USER_KEY}`, key, { method: "GET" }),
    db(`atlas_corrections?select=outcome&user_key=eq.${USER_KEY}&limit=100`, key, { method: "GET" }),
    db(`atlas_learning_events?select=event_type&user_key=eq.${USER_KEY}&limit=100`, key, { method: "GET" }),
  ]);
  const state = stateRows?.[0] ?? {};
  const sources = Array.isArray(state.connected_sources) ? state.connected_sources : [];
  const correctionCount = (corrections ?? []).length;
  const accepted = (corrections ?? []).filter((x: any) => x.outcome === "accepted").length;
  const acceptanceRate = correctionCount ? accepted / correctionCount : 0;
  const successCount = (events ?? []).filter((x: any) => x.event_type === "success").length;
  const failureCount = (events ?? []).filter((x: any) => x.event_type === "failure" || x.event_type === "exception").length;
  const evidenceCount = (evidence ?? []).length;
  const autonomyAllowed = sources.length >= 4 && evidenceCount >= 50 && correctionCount >= 10 && acceptanceRate >= 0.85 && successCount >= 5 && failureCount === 0;
  return {
    autonomyAllowed,
    stage: autonomyAllowed ? "autonomous-ready" : sources.length >= 3 && evidenceCount >= 25 && correctionCount >= 5 && acceptanceRate >= 0.7 && failureCount <= 1 ? "assisted" : sources.length >= 2 && evidenceCount >= 10 ? "shadow" : "learning",
    sourceCount: sources.length,
    evidenceCount,
    correctionCount,
    acceptanceRate: Number(acceptanceRate.toFixed(3)),
    successCount,
    failureCount,
    shadowMode: state.shadow_mode ?? "off",
  };
}

async function writeLearning(key: string, row: any, eventType: "success" | "failure" | "outcome" | "exception", observed: string, evidence: Record<string, unknown>) {
  try {
    await db("atlas_learning_events", key, {
      method: "POST",
      body: JSON.stringify({ user_key: USER_KEY, event_type: eventType, subject_type: "action", subject_id: row.id, observed, learned_rule: null, evidence }),
    });
  } catch {}
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

async function transitionOpportunity(key: string, opportunity: any, toStage: string, actionId: string | null, reason: string, patch: Record<string, unknown> = {}, evidence: Record<string, unknown> = {}) {
  if (!opportunity) return null;
  const fromStage = opportunity.lifecycle_stage ?? "detected";
  if (fromStage === toStage) return opportunity;
  const now = new Date().toISOString();
  const rows = await db(`atlas_opportunities?id=eq.${encodeURIComponent(opportunity.id)}&user_key=eq.${USER_KEY}&lifecycle_stage=eq.${encodeURIComponent(fromStage)}`, key, {
    method: "PATCH",
    body: JSON.stringify({ lifecycle_stage: toStage, ...patch, updated_at: now }),
  });
  const updated = Array.isArray(rows) ? rows[0] ?? null : null;
  if (updated) await history(key, opportunity.id, actionId, fromStage, toStage, reason, evidence);
  return updated ?? opportunity;
}

async function finishAttempt(key: string, actionId: string, attempt: number, patch: Record<string, unknown>) {
  try {
    await db(`atlas_action_attempts?action_id=eq.${encodeURIComponent(actionId)}&attempt_number=eq.${attempt}&status=eq.claimed`, key, {
      method: "PATCH",
      body: JSON.stringify({ ...patch, finished_at: new Date().toISOString() }),
    });
  } catch {}
}

function backoffMs(attempt: number) {
  const s = [60000, 300000, 1800000, 7200000, 28800000];
  return s[Math.min(Math.max(attempt - 1, 0), s.length - 1)];
}

function connectorFor(row: any) {
  const explicit = row.connector ?? row.payload?.connector;
  return typeof explicit === "string" && explicit.length ? explicit : "internal";
}

async function recordAttentionOutcome(key: string, action: any, opportunity: any, connector: string, verificationReceipt: Record<string, unknown>, verificationResult: Record<string, unknown>) {
  if (!opportunity) return;
  const plan = objectOrEmpty(opportunity.execution_plan);
  const plannedMetrics = objectOrEmpty(plan.metrics);
  const verifiedMetrics = objectOrEmpty(verificationResult.metrics);
  const measured = Object.keys(verifiedMetrics).length > 0;
  const humanMinutes = Math.max(0, Math.min(1440, Math.round(numeric(verifiedMetrics.human_minutes_saved) ?? numeric(plannedMetrics.human_minutes_saved) ?? numeric(opportunity.estimated_human_minutes) ?? 0)));
  const revenue = numeric(verifiedMetrics.revenue_influenced) ?? numeric(plannedMetrics.revenue_influenced);
  const moneySaved = numeric(verifiedMetrics.money_saved) ?? numeric(plannedMetrics.money_saved);
  const opportunityAdvanced = Boolean(verifiedMetrics.opportunity_advanced ?? plannedMetrics.opportunity_advanced ?? true);
  const relationshipProtected = Boolean(verifiedMetrics.relationship_protected ?? plannedMetrics.relationship_protected ?? false);
  const metricQuality = (verifiedMetrics.metric_quality ?? plannedMetrics.metric_quality ?? (measured ? "measured" : opportunity.attention_measurement_basis ?? "estimated")) as string;
  try {
    await db("atlas_attention_outcomes?on_conflict=user_key,action_id", key, {
      method: "POST",
      headers: { prefer: "return=representation,resolution=merge-duplicates" },
      body: JSON.stringify({
        user_key: USER_KEY,
        opportunity_id: opportunity.id,
        action_id: action.id,
        connector,
        human_minutes_saved: humanMinutes,
        revenue_influenced: revenue,
        money_saved: moneySaved,
        opportunity_advanced: opportunityAdvanced,
        relationship_protected: relationshipProtected,
        autonomous_actions: 1,
        human_decisions: 0,
        metric_quality: ["estimated", "measured", "mixed"].includes(metricQuality) ? metricQuality : "estimated",
        verification_evidence: { receipt: verificationReceipt, result: verificationResult },
      }),
    });
  } catch {}
}

async function reapExpired(key: string) {
  const now = new Date();
  const rows = await db(`atlas_actions?select=*&user_key=eq.${USER_KEY}&status=in.(executing,verifying)&lease_expires_at=lt.${encodeURIComponent(now.toISOString())}&limit=50`, key, { method: "GET" });
  let requeued = 0;
  let verificationRequeued = 0;
  let deadLettered = 0;
  for (const row of rows ?? []) {
    const executing = row.status === "executing";
    const attempts = executing ? Number(row.attempt_count ?? 0) : Number(row.verification_attempt_count ?? 0);
    const maxAttempts = Number(row.max_attempts ?? 3);
    const dead = attempts >= maxAttempts;
    const next = new Date(now.getTime() + backoffMs(Math.max(attempts, 1))).toISOString();
    const nextStatus = dead ? "dead_letter" : executing ? "queued" : "verification_pending";
    const patch = dead
      ? { status: "dead_letter", dead_lettered_at: now.toISOString(), lease_expires_at: null, error_message: row.error_message ?? `${executing ? "Execution" : "Verification"} lease expired after maximum attempts`, updated_at: now.toISOString() }
      : { status: nextStatus, next_attempt_at: next, started_at: executing ? null : row.started_at, lease_expires_at: null, error_message: row.error_message ?? `${executing ? "Execution" : "Verification"} lease expired; safely requeued`, updated_at: now.toISOString() };
    const updated = await db(`atlas_actions?id=eq.${encodeURIComponent(row.id)}&user_key=eq.${USER_KEY}&status=eq.${row.status}&lease_expires_at=lt.${encodeURIComponent(now.toISOString())}`, key, { method: "PATCH", body: JSON.stringify(patch) });
    if (Array.isArray(updated) && updated.length === 1) {
      if (executing) await finishAttempt(key, row.id, Number(row.attempt_count ?? 0), { status: dead ? "dead_letter" : "retrying", error_message: patch.error_message, result: { reason: "lease_expired" } });
      if (dead) deadLettered++;
      else if (executing) requeued++;
      else verificationRequeued++;
    }
  }
  return { requeued, verificationRequeued, deadLettered };
}

async function claimExecution(key: string, input: Extract<ActionRequest, { action: "next" }>) {
  const trust = await autonomyMaturity(key);
  if (!trust.autonomyAllowed) return { ok: true, claimed: false, action: null, blocked_by_trust: true, trust };
  const ready = new Set((input.connectors ?? []).map(String));
  if (!ready.size) return { ok: true, claimed: false, action: null, ready_connectors: [], trust };
  const now = new Date();
  const nowIso = now.toISOString();
  const candidates = await db(`atlas_actions?select=*&user_key=eq.${USER_KEY}&status=eq.queued&decision=eq.execute&risk_level=eq.low&reversible=eq.true&requires_approval=eq.false&or=(scheduled_for.is.null,scheduled_for.lte.${encodeURIComponent(nowIso)})&or=(next_attempt_at.is.null,next_attempt_at.lte.${encodeURIComponent(nowIso)})&order=scheduled_for.asc.nullsfirst,created_at.asc&limit=50`, key, { method: "GET" });
  for (const candidate of candidates ?? []) {
    const connector = connectorFor(candidate);
    if (!ready.has(connector)) continue;
    const attempts = Number(candidate.attempt_count ?? 0);
    const maxAttempts = Number(candidate.max_attempts ?? 3);
    if (attempts >= maxAttempts) {
      await db(`atlas_actions?id=eq.${encodeURIComponent(candidate.id)}&user_key=eq.${USER_KEY}&status=eq.queued`, key, { method: "PATCH", body: JSON.stringify({ status: "dead_letter", dead_lettered_at: nowIso, error_message: "Maximum attempts exceeded before claim", updated_at: nowIso }) });
      continue;
    }
    const attemptNumber = attempts + 1;
    const leaseExpires = new Date(now.getTime() + LEASE_MS).toISOString();
    const claimed = await db(`atlas_actions?id=eq.${encodeURIComponent(candidate.id)}&user_key=eq.${USER_KEY}&status=eq.queued&attempt_count=eq.${attempts}`, key, { method: "PATCH", body: JSON.stringify({ status: "executing", connector, attempt_count: attemptNumber, started_at: nowIso, lease_expires_at: leaseExpires, next_attempt_at: null, updated_at: nowIso }) });
    if (Array.isArray(claimed) && claimed.length === 1) {
      const row = claimed[0];
      try { await db("atlas_action_attempts", key, { method: "POST", body: JSON.stringify({ action_id: row.id, user_key: USER_KEY, attempt_number: attemptNumber, connector, status: "claimed", result: { worker_id: input.worker_id ?? null, trust_stage: trust.stage }, receipt: {} }) }); } catch {}
      return { ok: true, claimed: true, action: { ...row, connector, attempt_number: attemptNumber, lease_expires_at: leaseExpires }, trust };
    }
  }
  return { ok: true, claimed: false, action: null, ready_connectors: [...ready], trust };
}

async function claimVerification(key: string, input: Extract<ActionRequest, { action: "next_verify" }>) {
  const ready = new Set((input.connectors ?? []).map(String));
  if (!ready.size) return { ok: true, claimed: false, action: null, ready_connectors: [] };
  const now = new Date();
  const nowIso = now.toISOString();
  const candidates = await db(`atlas_actions?select=*&user_key=eq.${USER_KEY}&status=eq.verification_pending&or=(next_attempt_at.is.null,next_attempt_at.lte.${encodeURIComponent(nowIso)})&order=updated_at.asc&limit=50`, key, { method: "GET" });
  for (const candidate of candidates ?? []) {
    const connector = connectorFor(candidate);
    if (!ready.has(connector)) continue;
    const attempts = Number(candidate.verification_attempt_count ?? 0);
    const maxAttempts = Number(candidate.max_attempts ?? 3);
    if (attempts >= maxAttempts) continue;
    const attemptNumber = attempts + 1;
    const leaseExpires = new Date(now.getTime() + LEASE_MS).toISOString();
    const claimed = await db(`atlas_actions?id=eq.${encodeURIComponent(candidate.id)}&user_key=eq.${USER_KEY}&status=eq.verification_pending&verification_attempt_count=eq.${attempts}`, key, { method: "PATCH", body: JSON.stringify({ status: "verifying", verification_attempt_count: attemptNumber, lease_expires_at: leaseExpires, next_attempt_at: null, updated_at: nowIso }) });
    if (Array.isArray(claimed) && claimed.length === 1) return { ok: true, claimed: true, action: { ...claimed[0], connector, verification_attempt_number: attemptNumber, lease_expires_at: leaseExpires } };
  }
  return { ok: true, claimed: false, action: null, ready_connectors: [...ready] };
}

async function markExecuted(key: string, input: Extract<ActionRequest, { action: "executed" }>) {
  const current = await getAction(key, input.action_id);
  if (!current) return { error: "Action not found", status: 404 };
  if (["verification_pending", "verifying", "completed"].includes(current.status)) return { ok: true, idempotent: true, action: current };
  if (current.status !== "executing") return { error: `Action is ${current.status}, not executing`, status: 409 };
  if (current.requires_approval || current.risk_level !== "low" || !current.reversible || current.decision !== "execute") return { error: "Safety gate rejected execution result", status: 409 };
  const receipt = input.receipt ?? {};
  if (Object.keys(receipt).length === 0) return { error: "Connector execution receipt required", status: 409 };
  const now = new Date().toISOString();
  const rows = await db(`atlas_actions?id=eq.${encodeURIComponent(input.action_id)}&user_key=eq.${USER_KEY}&status=eq.executing&attempt_count=eq.${current.attempt_count}`, key, { method: "PATCH", body: JSON.stringify({ status: "verification_pending", connector: input.connector, execution_receipt: receipt, execution_result: { connector: input.connector, verified: false, receipt, result: input.result ?? {}, note: input.note ?? null, attempt: current.attempt_count }, verification_status: "pending", error_message: null, lease_expires_at: null, next_attempt_at: now, updated_at: now }) });
  const executed = Array.isArray(rows) ? rows[0] ?? null : null;
  if (!executed) return { error: "Action execution race lost", status: 409 };
  await finishAttempt(key, executed.id, Number(executed.attempt_count), { status: "executed", connector: input.connector, receipt, result: input.result ?? {} });
  let opportunity = await getOpportunity(key, executed.opportunity_id);
  if (opportunity) opportunity = await transitionOpportunity(key, opportunity, "acted", executed.id, "External action executed; awaiting source-of-truth verification", { assigned_action_id: executed.id, last_action_at: now }, { connector: input.connector, receipt });
  await writeLearning(key, executed, "outcome", `Executed ${executed.action_type} through ${input.connector}; verification pending`, { connector: input.connector, receipt, result: input.result ?? {}, opportunity_id: executed.opportunity_id });
  return { ok: true, action: executed, opportunity, verification_required: true };
}

async function finalizeVerified(key: string, input: Extract<ActionRequest, { action: "verified" }>) {
  const current = await getAction(key, input.action_id);
  if (!current) return { error: "Action not found", status: 404 };
  if (current.status === "completed" && current.verification_status === "verified") return { ok: true, idempotent: true, action: current };
  if (!["verification_pending", "verifying"].includes(current.status)) return { error: `Action is ${current.status}, not awaiting verification`, status: 409 };
  const verificationReceipt = input.verification_receipt ?? {};
  const verificationResult = input.verification_result ?? {};
  if (Object.keys(verificationReceipt).length === 0) return { error: "Source-of-truth verification receipt required", status: 409 };
  if (verificationResult.verified !== true) return { error: "Verifier must explicitly return verified=true", status: 409 };
  const now = new Date().toISOString();
  const rows = await db(`atlas_actions?id=eq.${encodeURIComponent(input.action_id)}&user_key=eq.${USER_KEY}&status=in.(verification_pending,verifying)`, key, { method: "PATCH", body: JSON.stringify({ status: "completed", connector: input.connector, verification_status: "verified", verification_receipt: verificationReceipt, verification_result: verificationResult, verified_at: now, completed_at: now, lease_expires_at: null, next_attempt_at: null, error_message: null, updated_at: now }) });
  const completed = Array.isArray(rows) ? rows[0] ?? null : null;
  if (!completed) return { error: "Action verification race lost", status: 409 };
  let opportunity = await getOpportunity(key, completed.opportunity_id);
  if (opportunity) {
    opportunity = await transitionOpportunity(key, opportunity, "verified", completed.id, "Authoritative connector read verified external outcome", { last_verified_at: now, verification_evidence: [{ connector: input.connector, receipt: verificationReceipt, result: verificationResult, verified_at: now }] }, { connector: input.connector, receipt: verificationReceipt, result: verificationResult });
    opportunity = await transitionOpportunity(key, opportunity, "closed", completed.id, "Verified opportunity action closed the open loop", { status: "closed", closed_at: now }, { action_id: completed.id });
    opportunity = await transitionOpportunity(key, opportunity, "learned", completed.id, "Verified outcome recorded as learning evidence", { learned_at: now }, { action_id: completed.id, connector: input.connector });
    await recordAttentionOutcome(key, completed, opportunity, input.connector, verificationReceipt, verificationResult);
  }
  await writeLearning(key, completed, "success", `Verified ${completed.action_type} completed through ${input.connector}`, { connector: input.connector, execution_receipt: completed.execution_receipt ?? {}, verification_receipt: verificationReceipt, verification_result: verificationResult, idempotency_key: completed.idempotency_key, attempt: completed.attempt_count, opportunity_id: completed.opportunity_id });
  return { ok: true, action: completed, opportunity, closed_loop: true };
}

async function failAction(key: string, input: Extract<ActionRequest, { action: "fail" }>) {
  const current = await getAction(key, input.action_id);
  if (!current) return { error: "Action not found", status: 404 };
  if (current.status === "completed") return { error: "Completed actions cannot be failed", status: 409 };
  if (["failed", "dead_letter"].includes(current.status)) return { ok: true, idempotent: true, action: current };
  const phase = input.phase ?? (current.status === "verifying" || current.status === "verification_pending" ? "verify" : "execute");
  const now = new Date();
  const uncertain = Boolean(input.uncertain_external_outcome);
  const receipt = input.receipt ?? {};

  if (phase === "verify") {
    if (!["verification_pending", "verifying"].includes(current.status)) return { error: `Action is ${current.status}, not in verification`, status: 409 };
    const attempts = Number(current.verification_attempt_count ?? 1);
    const maxAttempts = Number(current.max_attempts ?? 3);
    const retryAllowed = Boolean(input.retryable) && attempts < maxAttempts;
    const nextStatus = retryAllowed ? "verification_pending" : "dead_letter";
    const nextAttemptAt = retryAllowed ? new Date(now.getTime() + backoffMs(Math.max(attempts, 1))).toISOString() : null;
    const rows = await db(`atlas_actions?id=eq.${encodeURIComponent(input.action_id)}&user_key=eq.${USER_KEY}&status=in.(verification_pending,verifying)`, key, { method: "PATCH", body: JSON.stringify({ status: nextStatus, verification_status: retryAllowed ? "pending" : "failed", error_message: input.error, next_attempt_at: nextAttemptAt, lease_expires_at: null, dead_lettered_at: retryAllowed ? null : now.toISOString(), updated_at: now.toISOString() }) });
    const failed = Array.isArray(rows) ? rows[0] ?? null : null;
    if (!failed) return { error: "Verification failure race lost", status: 409 };
    if (!retryAllowed && failed.opportunity_id) {
      const opportunity = await getOpportunity(key, failed.opportunity_id);
      if (opportunity) await db(`atlas_opportunities?id=eq.${encodeURIComponent(opportunity.id)}&user_key=eq.${USER_KEY}`, key, { method: "PATCH", body: JSON.stringify({ emod_required: true, next_review_at: now.toISOString(), updated_at: now.toISOString() }) });
    }
    await writeLearning(key, failed, retryAllowed ? "outcome" : "exception", `${failed.action_type} verification ${retryAllowed ? "scheduled for retry" : "requires human review"}`, { error: input.error, connector: input.connector ?? failed.connector ?? null, phase: "verify", retryable: retryAllowed, receipt, verification_attempt: attempts });
    return { ok: true, action: failed, phase: "verify", requires_human: !retryAllowed };
  }

  if (current.status !== "executing") return { error: `Action is ${current.status}, not executing`, status: 409 };
  const attempts = Number(current.attempt_count ?? 1);
  const maxAttempts = Number(current.max_attempts ?? 3);
  const retryAllowed = Boolean(input.retryable) && !uncertain && attempts < maxAttempts;
  const dead = uncertain || (Boolean(input.retryable) && attempts >= maxAttempts);
  const nextStatus = retryAllowed ? "queued" : dead ? "dead_letter" : "failed";
  const nextAttemptAt = retryAllowed ? new Date(now.getTime() + backoffMs(attempts)).toISOString() : null;
  const rows = await db(`atlas_actions?id=eq.${encodeURIComponent(input.action_id)}&user_key=eq.${USER_KEY}&status=eq.executing&attempt_count=eq.${attempts}`, key, { method: "PATCH", body: JSON.stringify({ status: nextStatus, connector: input.connector ?? current.connector ?? null, execution_receipt: Object.keys(receipt).length ? receipt : current.execution_receipt, execution_result: { connector: input.connector ?? null, verified: false, receipt, uncertain_external_outcome: uncertain, attempt: attempts }, error_message: input.error, next_attempt_at: nextAttemptAt, started_at: retryAllowed ? null : current.started_at, lease_expires_at: null, dead_lettered_at: dead ? now.toISOString() : null, updated_at: now.toISOString() }) });
  const failed = Array.isArray(rows) ? rows[0] ?? null : null;
  if (!failed) return { error: "Action failure race lost", status: 409 };
  await finishAttempt(key, failed.id, attempts, { status: retryAllowed ? "retrying" : dead ? "dead_letter" : "failed", connector: input.connector ?? null, error_message: input.error, receipt, result: { uncertain_external_outcome: uncertain, next_attempt_at: nextAttemptAt } });
  await writeLearning(key, failed, dead ? "exception" : retryAllowed ? "outcome" : "failure", `${failed.action_type} ${retryAllowed ? "scheduled for retry" : dead ? "moved to dead letter" : "failed"}${input.connector ? ` via ${input.connector}` : ""}`, { error: input.error, connector: input.connector ?? null, retryable: retryAllowed, uncertain_external_outcome: uncertain, receipt, attempt: attempts });
  return { ok: true, action: failed, phase: "execute" };
}

export default {
  async fetch(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response("ok", { headers });
    if (req.method !== "POST") return json({ error: "POST required" }, 405);
    try { await authorize(req); } catch { return json({ error: "unauthorized" }, 401); }
    const key = await secretKey();
    if (!key) return json({ error: "Server persistence key unavailable" }, 503);
    let input: ActionRequest;
    try { input = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }

    try {
      if (input.action === "status") {
        const [rows, trust, outcomes] = await Promise.all([
          db(`atlas_actions?select=status,connector,payload&user_key=eq.${USER_KEY}`, key, { method: "GET" }),
          autonomyMaturity(key),
          db(`atlas_attention_outcomes?select=human_minutes_saved,revenue_influenced,money_saved,autonomous_actions,human_decisions&user_key=eq.${USER_KEY}`, key, { method: "GET" }).catch(() => []),
        ]);
        const counts: Record<string, number> = {};
        const connectorCounts: Record<string, number> = {};
        for (const row of rows ?? []) {
          counts[row.status] = (counts[row.status] ?? 0) + 1;
          const c = connectorFor(row);
          connectorCounts[c] = (connectorCounts[c] ?? 0) + 1;
        }
        const attention = (outcomes ?? []).reduce((acc: any, row: any) => ({
          human_minutes_saved: acc.human_minutes_saved + Number(row.human_minutes_saved ?? 0),
          revenue_influenced: acc.revenue_influenced + Number(row.revenue_influenced ?? 0),
          money_saved: acc.money_saved + Number(row.money_saved ?? 0),
          autonomous_actions: acc.autonomous_actions + Number(row.autonomous_actions ?? 0),
          human_decisions: acc.human_decisions + Number(row.human_decisions ?? 0),
        }), { human_minutes_saved: 0, revenue_influenced: 0, money_saved: 0, autonomous_actions: 0, human_decisions: 0 });
        return json({ ok: true, counts, connector_counts: connectorCounts, worker_protocol: "closed-loop-v1", lease_seconds: LEASE_MS / 1000, trust, human_attention_returned: attention });
      }
      if (input.action === "reap") return json({ ok: true, ...(await reapExpired(key)) });
      if (input.action === "next") return json(await claimExecution(key, input));
      if (input.action === "next_verify") return json(await claimVerification(key, input));
      if (input.action === "executed") {
        const result = await markExecuted(key, input);
        return json(result, (result as any).status ?? 200);
      }
      if (input.action === "verified") {
        const result = await finalizeVerified(key, input);
        return json(result, (result as any).status ?? 200);
      }
      if (input.action === "complete") {
        const receipt = input.receipt ?? {};
        const result = input.result ?? {};
        const executed = await markExecuted(key, { action: "executed", action_id: input.action_id, connector: input.connector, receipt, result, note: input.note });
        if (!(executed as any).ok) return json(executed, (executed as any).status ?? 409);
        if (result.verified === true || receipt.verified === true) {
          const verified = await finalizeVerified(key, { action: "verified", action_id: input.action_id, connector: input.connector, verification_receipt: receipt, verification_result: { ...result, verified: true }, note: input.note });
          return json(verified, (verified as any).status ?? 200);
        }
        return json({ ...executed, compatibility_mode: true, verification_required: true });
      }
      if (input.action === "fail") {
        const result = await failAction(key, input);
        return json(result, (result as any).status ?? 200);
      }
      return json({ error: "Unsupported action" }, 400);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : String(error) }, 500);
    }
  },
};
