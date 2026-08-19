import { getVercelOidcToken } from "@vercel/oidc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ACTIONS_URL = "https://lvkrvqpoajzpcqnlvqaj.supabase.co/functions/v1/atlas-actions";
const CONTROL_URL = "https://lvkrvqpoajzpcqnlvqaj.supabase.co/functions/v1/atlas-worker-control";
const providers = ["gmail", "calendar", "contacts", "drive", "notion", "hubspot"] as const;
type Provider = (typeof providers)[number];

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store", "x-robots-tag": "noindex" } });
}

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
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

function executorConfig(provider: Provider) {
  const prefix = `ATLAS_${provider.toUpperCase()}_EXECUTOR`;
  const url = process.env[`${prefix}_URL`]?.trim();
  const secret = process.env[`${prefix}_SECRET`]?.trim();
  return url && secret ? { provider, url, secret } : null;
}

async function executeExternal(action: any, provider: Provider, config: { url: string; secret: string }) {
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
  const text = await response.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!response.ok || data?.ok !== true) {
    const error = data?.error ?? `executor-http-${response.status}`;
    const sideEffectStarted = data?.side_effect_started;
    const safeRetry = sideEffectStarted === false && (response.status === 429 || response.status >= 500);
    return { ok: false, error, retryable: safeRetry, uncertain: sideEffectStarted !== false && response.status >= 500, receipt: data?.receipt ?? {} };
  }
  if (!data?.receipt || Object.keys(data.receipt).length === 0) {
    return { ok: false, error: "executor-missing-verifiable-receipt", retryable: false, uncertain: true, receipt: {} };
  }
  return { ok: true, receipt: data.receipt, result: data.result ?? {} };
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return json({ ok: false, error: process.env.CRON_SECRET ? "unauthorized" : "cron-secret-not-configured" }, process.env.CRON_SECRET ? 401 : 503);
  }

  const token = await getVercelOidcToken();
  if (!token) return json({ ok: false, error: "vercel-oidc-unavailable" }, 503);

  const runId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const configs = providers.map(executorConfig).filter(Boolean) as Array<{ provider: Provider; url: string; secret: string }>;
  const readyConnectors = configs.map((x) => x.provider);
  const configByProvider = new Map(configs.map((x) => [x.provider, x]));

  const summary: any = {
    ok: true,
    run_id: runId,
    started_at: startedAt,
    phases: {},
    ready_connectors: readyConnectors,
    handled: 0,
    retried: 0,
    dead_lettered: 0,
    failed: 0,
  };

  try {
    summary.phases.scan_score = await atlasCall(CONTROL_URL, token, { action: "scan", worker_id: runId });
  } catch (error) {
    summary.phases.scan_score = { ok: false, error: error instanceof Error ? error.message : String(error) };
  }

  try {
    summary.phases.reap = await atlasCall(ACTIONS_URL, token, { action: "reap" });
  } catch (error) {
    summary.phases.reap = { ok: false, error: error instanceof Error ? error.message : String(error) };
  }

  if (!readyConnectors.length) {
    summary.blocker = "no-cloud-executors-configured";
    summary.finished_at = new Date().toISOString();
    return json(summary);
  }

  for (let i = 0; i < 10; i++) {
    let claim: any;
    try {
      claim = await atlasCall(ACTIONS_URL, token, { action: "next", worker_id: runId, connectors: readyConnectors });
    } catch (error) {
      summary.worker_error = error instanceof Error ? error.message : String(error);
      break;
    }
    if (!claim?.claimed || !claim.action) break;

    const action = claim.action;
    const provider = action.connector as Provider;
    const config = configByProvider.get(provider);
    if (!config) break;

    try {
      const executed = await executeExternal(action, provider, config);
      if (executed.ok) {
        await atlasCall(ACTIONS_URL, token, { action: "complete", action_id: action.id, connector: provider, receipt: executed.receipt, result: executed.result, note: `Always-on worker ${runId}` });
        summary.handled++;
      } else {
        const outcome = await atlasCall(ACTIONS_URL, token, {
          action: "fail",
          action_id: action.id,
          connector: provider,
          error: executed.error,
          receipt: executed.receipt,
          retryable: executed.retryable,
          uncertain_external_outcome: executed.uncertain,
        });
        const status = outcome?.action?.status;
        if (status === "queued") summary.retried++;
        else if (status === "dead_letter") summary.dead_lettered++;
        else summary.failed++;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      try {
        const outcome = await atlasCall(ACTIONS_URL, token, {
          action: "fail",
          action_id: action.id,
          connector: provider,
          error: message,
          receipt: {},
          retryable: false,
          uncertain_external_outcome: true,
        });
        if (outcome?.action?.status === "dead_letter") summary.dead_lettered++;
        else summary.failed++;
      } catch {
        summary.failed++;
      }
    }
  }

  summary.finished_at = new Date().toISOString();
  return json(summary);
}
