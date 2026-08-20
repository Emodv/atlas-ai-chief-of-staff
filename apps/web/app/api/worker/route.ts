import { getVercelOidcToken } from "@vercel/oidc";
import { nativeGmailExecute, nativeGmailStatus, nativeGmailVerify } from "../../../lib/native-gmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ACTIONS_URL = "https://lvkrvqpoajzpcqnlvqaj.supabase.co/functions/v1/atlas-actions";
const CONTROL_URL = "https://lvkrvqpoajzpcqnlvqaj.supabase.co/functions/v1/atlas-worker-control";
const providers = ["gmail", "calendar", "contacts", "drive", "notion", "hubspot"] as const;
type Provider = (typeof providers)[number];
type ConnectorConfig = { provider: Provider; url: string; secret: string };
type ExecutionResult =
  | { ok: true; receipt: Record<string, unknown>; result: Record<string, unknown> }
  | { ok: false; error: string; retryable: boolean; uncertain: boolean; receipt: Record<string, unknown> };
type VerificationResult =
  | { ok: true; receipt: Record<string, unknown>; result: Record<string, unknown> }
  | { ok: false; error: string; retryable: boolean; receipt: Record<string, unknown>; result: Record<string, unknown> };

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store", "x-robots-tag": "noindex" } });
}

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`);
}

async function atlasCall(url: string, token: string, payload: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const text = await response.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!response.ok) throw new Error(data?.error ?? `atlas-http-${response.status}`);
  return data;
}

function connectorConfig(provider: Provider, kind: "EXECUTOR" | "VERIFIER"): ConnectorConfig | null {
  if (provider === "gmail") return null;
  const prefix = `ATLAS_${provider.toUpperCase()}_${kind}`;
  const url = process.env[`${prefix}_URL`]?.trim();
  const secret = process.env[`${prefix}_SECRET`]?.trim();
  return url && secret ? { provider, url, secret } : null;
}

async function parseResponse(response: Response) {
  const text = await response.text();
  try { return text ? JSON.parse(text) : {}; } catch { return { raw: text }; }
}

async function executeExternal(action: any, provider: Provider, config: ConnectorConfig): Promise<ExecutionResult> {
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.secret}`,
      "idempotency-key": action.idempotency_key ?? action.id,
      "x-atlas-action-id": action.id,
    },
    body: JSON.stringify({ action, provider }),
    cache: "no-store",
  });
  const data = await parseResponse(response);
  if (!response.ok || data?.ok !== true) {
    const sideEffectStarted = data?.side_effect_started;
    return {
      ok: false,
      error: data?.error ?? `executor-http-${response.status}`,
      retryable: sideEffectStarted === false && (response.status === 429 || response.status >= 500),
      uncertain: sideEffectStarted !== false && response.status >= 500,
      receipt: data?.receipt ?? {},
    };
  }
  if (!data?.receipt || Object.keys(data.receipt).length === 0) {
    return { ok: false, error: "executor-missing-receipt", retryable: false, uncertain: true, receipt: {} };
  }
  return { ok: true, receipt: data.receipt, result: data.result ?? {} };
}

async function verifyExternal(action: any, provider: Provider, config: ConnectorConfig): Promise<VerificationResult> {
  const executionReceipt = action.execution_receipt ?? action.receipt ?? {};
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.secret}`,
      "idempotency-key": `verify:${action.idempotency_key ?? action.id}`,
      "x-atlas-action-id": action.id,
    },
    body: JSON.stringify({ action, provider, execution_receipt: executionReceipt }),
    cache: "no-store",
  });
  const data = await parseResponse(response);
  if (!response.ok || data?.ok !== true || data?.verified !== true) {
    return {
      ok: false,
      error: data?.error ?? (data?.verified === false ? "source-of-truth-not-confirmed" : `verifier-http-${response.status}`),
      retryable: response.status === 429 || response.status >= 500 || data?.retryable === true,
      receipt: data?.receipt ?? {},
      result: data?.result ?? {},
    };
  }
  if (!data?.receipt || Object.keys(data.receipt).length === 0) {
    return { ok: false, error: "verifier-missing-receipt", retryable: false, receipt: {}, result: data?.result ?? {} };
  }
  return { ok: true, receipt: data.receipt, result: { ...(data.result ?? {}), verified: true } };
}

async function executeProvider(token: string, action: any, provider: Provider, external?: ConnectorConfig): Promise<ExecutionResult> {
  if (provider === "gmail") return nativeGmailExecute(token, action);
  if (!external) return { ok: false, error: "executor-not-configured", retryable: false, uncertain: false, receipt: {} };
  return executeExternal(action, provider, external);
}

async function verifyProvider(token: string, action: any, provider: Provider, external?: ConnectorConfig): Promise<VerificationResult> {
  if (provider === "gmail") return nativeGmailVerify(token, action);
  if (!external) return { ok: false, error: "verifier-not-configured", retryable: false, receipt: {}, result: {} };
  return verifyExternal(action, provider, external);
}

async function failVerification(token: string, action: any, provider: Provider, result: Extract<VerificationResult, { ok: false }>) {
  return atlasCall(ACTIONS_URL, token, {
    action: "fail",
    phase: "verify",
    action_id: action.id,
    connector: provider,
    error: result.error,
    receipt: result.receipt,
    retryable: result.retryable,
    uncertain_external_outcome: false,
  });
}

function countOutcome(summary: any, outcome: any) {
  const status = outcome?.action?.status;
  if (status === "queued") summary.retried++;
  else if (status === "verification_pending") summary.verification_retried++;
  else if (status === "dead_letter") summary.dead_lettered++;
  else if (status !== "completed") summary.failed++;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return json({ ok: false, error: process.env.CRON_SECRET ? "unauthorized" : "cron-secret-not-configured" }, process.env.CRON_SECRET ? 401 : 503);
  }

  const token = await getVercelOidcToken();
  if (!token) return json({ ok: false, error: "vercel-oidc-unavailable" }, 503);

  const runId = crypto.randomUUID();
  const externalExecutors = providers.map((p) => connectorConfig(p, "EXECUTOR")).filter(Boolean) as ConnectorConfig[];
  const externalVerifiers = providers.map((p) => connectorConfig(p, "VERIFIER")).filter(Boolean) as ConnectorConfig[];
  const executorByProvider = new Map(externalExecutors.map((x) => [x.provider, x]));
  const verifierByProvider = new Map(externalVerifiers.map((x) => [x.provider, x]));
  const gmail = await nativeGmailStatus(token, true);

  const readyExecutors = Array.from(new Set<Provider>([
    ...externalExecutors.map((x) => x.provider),
    ...(gmail.ready ? (["gmail"] as Provider[]) : []),
  ]));
  const readyVerifiers = Array.from(new Set<Provider>([
    ...externalVerifiers.map((x) => x.provider),
    ...(gmail.ready ? (["gmail"] as Provider[]) : []),
  ]));
  const readyVerifierSet = new Set(readyVerifiers);
  const closedLoopConnectors = readyExecutors.filter((p) => readyVerifierSet.has(p));

  const summary: any = {
    ok: true,
    run_id: runId,
    started_at: new Date().toISOString(),
    protocol: "closed-loop-v2",
    phases: {},
    native_connectors: { gmail },
    ready_executors: readyExecutors,
    ready_verifiers: readyVerifiers,
    ready_closed_loop_connectors: closedLoopConnectors,
    executed: 0,
    verified: 0,
    handled: 0,
    verification_retried: 0,
    retried: 0,
    dead_lettered: 0,
    failed: 0,
  };

  try { summary.phases.observe_score_assign = await atlasCall(CONTROL_URL, token, { action: "scan", worker_id: runId }); }
  catch (error) { summary.phases.observe_score_assign = { ok: false, error: error instanceof Error ? error.message : String(error) }; }

  try { summary.phases.reap = await atlasCall(ACTIONS_URL, token, { action: "reap" }); }
  catch (error) { summary.phases.reap = { ok: false, error: error instanceof Error ? error.message : String(error) }; }

  for (let i = 0; i < 10 && readyVerifiers.length; i++) {
    let claim: any;
    try { claim = await atlasCall(ACTIONS_URL, token, { action: "next_verify", worker_id: runId, connectors: readyVerifiers }); }
    catch (error) { summary.verification_worker_error = error instanceof Error ? error.message : String(error); break; }
    if (!claim?.claimed || !claim.action) break;

    const action = claim.action;
    const provider = action.connector as Provider;
    try {
      const checked = await verifyProvider(token, action, provider, verifierByProvider.get(provider));
      if (checked.ok) {
        await atlasCall(ACTIONS_URL, token, {
          action: "verified",
          action_id: action.id,
          connector: provider,
          verification_receipt: checked.receipt,
          verification_result: checked.result,
          note: `Always-on verifier ${runId}`,
        });
        summary.verified++;
        summary.handled++;
      } else {
        countOutcome(summary, await failVerification(token, action, provider, checked));
      }
    } catch (error) {
      const failure: Extract<VerificationResult, { ok: false }> = { ok: false, error: error instanceof Error ? error.message : String(error), retryable: true, receipt: {}, result: {} };
      try { countOutcome(summary, await failVerification(token, action, provider, failure)); }
      catch { summary.failed++; }
    }
  }

  if (!closedLoopConnectors.length) {
    summary.blocker = gmail.blocker ?? "no-provider-has-both-executor-and-verifier";
    summary.finished_at = new Date().toISOString();
    return json(summary);
  }

  for (let i = 0; i < 10; i++) {
    let claim: any;
    try { claim = await atlasCall(ACTIONS_URL, token, { action: "next", worker_id: runId, connectors: closedLoopConnectors }); }
    catch (error) { summary.worker_error = error instanceof Error ? error.message : String(error); break; }
    if (!claim?.claimed || !claim.action) break;

    const action = claim.action;
    const provider = action.connector as Provider;
    let executionRecorded = false;

    try {
      const executed = await executeProvider(token, action, provider, executorByProvider.get(provider));
      if (!executed.ok) {
        const outcome = await atlasCall(ACTIONS_URL, token, {
          action: "fail",
          phase: "execute",
          action_id: action.id,
          connector: provider,
          error: executed.error,
          receipt: executed.receipt,
          retryable: executed.retryable,
          uncertain_external_outcome: executed.uncertain,
        });
        countOutcome(summary, outcome);
        continue;
      }

      const staged = await atlasCall(ACTIONS_URL, token, {
        action: "executed",
        action_id: action.id,
        connector: provider,
        receipt: executed.receipt,
        result: executed.result,
        note: `Always-on executor ${runId}`,
      });
      executionRecorded = true;
      summary.executed++;

      const actionForVerification = staged?.action ?? { ...action, execution_receipt: executed.receipt };
      const checked = await verifyProvider(token, actionForVerification, provider, verifierByProvider.get(provider));
      if (checked.ok) {
        await atlasCall(ACTIONS_URL, token, {
          action: "verified",
          action_id: action.id,
          connector: provider,
          verification_receipt: checked.receipt,
          verification_result: checked.result,
          note: `Always-on verifier ${runId}`,
        });
        summary.verified++;
        summary.handled++;
      } else {
        countOutcome(summary, await failVerification(token, actionForVerification, provider, checked));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      try {
        if (executionRecorded) {
          const failure: Extract<VerificationResult, { ok: false }> = { ok: false, error: message, retryable: true, receipt: {}, result: {} };
          countOutcome(summary, await failVerification(token, action, provider, failure));
        } else {
          countOutcome(summary, await atlasCall(ACTIONS_URL, token, {
            action: "fail",
            phase: "execute",
            action_id: action.id,
            connector: provider,
            error: message,
            receipt: {},
            retryable: false,
            uncertain_external_outcome: true,
          }));
        }
      } catch { summary.failed++; }
    }
  }

  try { summary.phases.outcomes = await atlasCall(ACTIONS_URL, token, { action: "status" }); }
  catch (error) { summary.phases.outcomes = { ok: false, error: error instanceof Error ? error.message : String(error) }; }

  summary.finished_at = new Date().toISOString();
  return json(summary);
}
