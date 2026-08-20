import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.9.6";

type DecisionInput = {
  external_key?: string;
  person_company?: string;
  category: string;
  relationship_type?: string;
  opportunity?: string;
  risk?: string;
  estimated_value?: number;
  value_score: number;
  probability_score: number;
  speed_score: number;
  urgency_score: number;
  leverage_score: number;
  effort_efficiency_score: number;
  confidence: number;
  action_risk?: "low" | "medium" | "high" | "critical";
  reversible?: boolean;
  atlas_can_execute?: boolean;
  emod_required?: boolean;
  next_action?: string;
  action_type?: string;
  connector?: string;
  deadline?: string;
  evidence?: unknown[];
  estimated_human_minutes?: number;
  metrics?: {
    human_minutes_saved?: number;
    revenue_influenced?: number;
    money_saved?: number;
    opportunity_advanced?: boolean;
    relationship_protected?: boolean;
    metric_quality?: "estimated" | "measured" | "mixed";
  };
  action_payload?: Record<string, unknown>;
};

const TEAM_SLUG = "emodvs-projects";
const PROJECT_NAME = "atlas-ai-chief-of-staff";
const USER_KEY = "primary";
const ISSUER = `https://oidc.vercel.com/${TEAM_SLUG}`;
const AUDIENCE = `https://vercel.com/${TEAM_SLUG}`;
const SUBJECT = `owner:${TEAM_SLUG}:project:${PROJECT_NAME}:environment:production`;
const JWKS = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks`));
const headers = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
  "access-control-allow-methods": "POST, OPTIONS",
};
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Number(n) || 0));

async function authorize(req: Request) {
  const h = req.headers.get("authorization") || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!t) throw new Error("missing_token");
  await jwtVerify(t, JWKS, { issuer: ISSUER, audience: AUDIENCE, subject: SUBJECT });
}

async function serviceKey(): Promise<string | null> {
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

async function rest(path: string, key: string, init: RequestInit = {}) {
  const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      prefer: "return=representation,resolution=merge-duplicates",
      ...(init.headers ?? {}),
    },
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`Database ${r.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function trustMaturity(key: string) {
  const [stateRows, evidenceRows, corrections, events] = await Promise.all([
    rest(`atlas_runtime_state?select=connected_sources,shadow_mode&user_key=eq.${USER_KEY}&limit=1`, key, { method: "GET" }),
    rest(`atlas_evidence?select=id&user_key=eq.${USER_KEY}`, key, { method: "GET" }),
    rest(`atlas_corrections?select=outcome&user_key=eq.${USER_KEY}&limit=100`, key, { method: "GET" }),
    rest(`atlas_learning_events?select=event_type&user_key=eq.${USER_KEY}&limit=100`, key, { method: "GET" }),
  ]);
  const state = stateRows?.[0] ?? {};
  const sources = Array.isArray(state.connected_sources) ? state.connected_sources : [];
  const evidenceCount = Array.isArray(evidenceRows) ? evidenceRows.length : 0;
  const cs = corrections ?? [];
  const ev = events ?? [];
  const accepted = cs.filter((x: any) => x.outcome === "accepted").length;
  const correctionCount = cs.length;
  const acceptanceRate = correctionCount ? accepted / correctionCount : 0;
  const successCount = ev.filter((x: any) => x.event_type === "success").length;
  const failureCount = ev.filter((x: any) => x.event_type === "failure" || x.event_type === "exception").length;
  const autonomousReady = sources.length >= 4 && evidenceCount >= 50 && correctionCount >= 10 && acceptanceRate >= 0.85 && successCount >= 5 && failureCount === 0;
  const assisted = sources.length >= 3 && evidenceCount >= 25 && correctionCount >= 5 && acceptanceRate >= 0.7 && failureCount <= 1;
  const shadow = sources.length >= 2 && evidenceCount >= 10;
  return {
    stage: autonomousReady ? "autonomous-ready" : assisted ? "assisted" : shadow ? "shadow" : "learning",
    autonomyAllowed: autonomousReady,
    sourceCount: sources.length,
    evidenceCount,
    correctionCount,
    acceptanceRate: Number(acceptanceRate.toFixed(3)),
    successCount,
    failureCount,
    shadowMode: state.shadow_mode ?? "off",
  };
}

function executionPlan(input: DecisionInput, reversible: boolean) {
  if (!input.connector || !input.action_type) return {};
  return {
    connector: input.connector,
    action_type: input.action_type,
    description: input.next_action ?? input.opportunity ?? `${input.category} opportunity`,
    payload: input.action_payload ?? {},
    reversible,
    requires_approval: Boolean(input.emod_required),
    plan_version: "1",
    metrics: {
      human_minutes_saved: input.metrics?.human_minutes_saved ?? input.estimated_human_minutes ?? 0,
      revenue_influenced: input.metrics?.revenue_influenced,
      money_saved: input.metrics?.money_saved,
      opportunity_advanced: input.metrics?.opportunity_advanced,
      relationship_protected: input.metrics?.relationship_protected,
      metric_quality: input.metrics?.metric_quality ?? "estimated",
    },
  };
}

export default {
  async fetch(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response("ok", { headers });
    if (req.method !== "POST") return new Response(JSON.stringify({ error: "POST required" }), { status: 405, headers });
    try { await authorize(req); } catch { return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers }); }
    let input: DecisionInput;
    try { input = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers }); }
    if (!input.category) return new Response(JSON.stringify({ error: "category is required" }), { status: 400, headers });

    const scores = {
      value_score: clamp(input.value_score, 0, 25),
      probability_score: clamp(input.probability_score, 0, 20),
      speed_score: clamp(input.speed_score, 0, 15),
      urgency_score: clamp(input.urgency_score, 0, 15),
      leverage_score: clamp(input.leverage_score, 0, 15),
      effort_efficiency_score: clamp(input.effort_efficiency_score, 0, 10),
    };
    const score = Object.values(scores).reduce((a, b) => a + b, 0);
    const priority = score >= 90 ? "P0" : score >= 75 ? "P1" : score >= 60 ? "P2" : score >= 40 ? "P3" : "P4";
    const confidence = clamp(input.confidence, 0, 1);
    const riskLevel = input.action_risk ?? "low";
    const reversible = input.reversible ?? true;
    const requestedExecute = input.atlas_can_execute ?? false;
    const emodRequired = input.emod_required ?? false;
    const key = await serviceKey();
    if (!key) return new Response(JSON.stringify({ error: "Server persistence key unavailable" }), { status: 503, headers });

    try {
      const maturity = await trustMaturity(key);
      const requiresApproval = emodRequired || ["high", "critical"].includes(riskLevel) || !reversible || confidence < 0.8;
      let decision: "ignore" | "track" | "surface" | "recommend" | "draft" | "execute" | "ask";
      if (score < 40) decision = "ignore";
      else if (score < 60) decision = "track";
      else if (requiresApproval) decision = "ask";
      else if (requestedExecute && maturity.autonomyAllowed && confidence >= 0.9 && riskLevel === "low" && reversible) decision = "execute";
      else if (requestedExecute && confidence >= 0.8 && ["low", "medium"].includes(riskLevel) && reversible) decision = "draft";
      else if (score >= 75) decision = "recommend";
      else decision = "surface";

      const plan = executionPlan(input, reversible);
      const now = new Date().toISOString();
      const executionAuthorized = decision === "execute" && Object.keys(plan).length > 0;
      const opportunityRows = await rest(`atlas_opportunities?on_conflict=user_key,external_key`, key, {
        method: "POST",
        body: JSON.stringify({
          user_key: USER_KEY,
          external_key: input.external_key ?? null,
          person_company: input.person_company ?? null,
          category: input.category,
          relationship_type: input.relationship_type ?? null,
          opportunity: input.opportunity ?? null,
          risk: input.risk ?? null,
          evidence: input.evidence ?? [],
          estimated_value: input.estimated_value ?? null,
          ...scores,
          master_score: score,
          priority,
          confidence,
          action_risk: riskLevel,
          next_action: input.next_action ?? null,
          atlas_can_execute: executionAuthorized,
          emod_required: emodRequired,
          deadline: input.deadline ?? null,
          lifecycle_stage: "ranked",
          execution_plan: plan,
          estimated_human_minutes: Math.max(0, Math.min(1440, Math.round(input.estimated_human_minutes ?? input.metrics?.human_minutes_saved ?? 0))),
          attention_measurement_basis: input.metrics?.metric_quality ?? "estimated",
          next_review_at: executionAuthorized ? now : null,
          source_updated_at: now,
          updated_at: now,
        }),
      });
      const opportunity = Array.isArray(opportunityRows) ? opportunityRows[0] : opportunityRows;

      try {
        await rest("atlas_opportunity_history", key, {
          method: "POST",
          body: JSON.stringify({
            user_key: USER_KEY,
            opportunity_id: opportunity?.id,
            action_id: null,
            from_stage: "detected",
            to_stage: "ranked",
            transition_reason: `Decision ${decision}; score ${score}/100; trust ${maturity.stage}`,
            evidence: { priority, confidence, risk_level: riskLevel, executionAuthorized },
          }),
        });
      } catch {}

      return new Response(JSON.stringify({
        ok: true,
        decision: {
          score,
          priority,
          decision,
          requires_approval: requiresApproval,
          confidence,
          risk_level: riskLevel,
          reversible,
          trust: maturity,
          executionRequested: requestedExecute,
          executionAuthorized,
        },
        opportunity_id: opportunity?.id ?? null,
        lifecycle_stage: opportunity?.lifecycle_stage ?? "ranked",
        assignment: executionAuthorized ? "worker-scan" : "none",
        action_id: opportunity?.assigned_action_id ?? null,
      }), { status: 200, headers });
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), { status: 500, headers });
    }
  },
};
