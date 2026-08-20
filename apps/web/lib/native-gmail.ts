const GMAIL_URL = "https://lvkrvqpoajzpcqnlvqaj.supabase.co/functions/v1/atlas-gmail";

export type NativeGmailStatus = {
  ok: boolean;
  provider?: "gmail";
  oauth_client_configured?: boolean;
  connected?: boolean;
  ready?: boolean;
  blocker?: string | null;
  account_email?: string | null;
  scopes?: string[];
  [key: string]: unknown;
};

async function call(token: string, payload: Record<string, unknown>) {
  const response = await fetch(GMAIL_URL, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const text = await response.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  return { response, data };
}

export async function nativeGmailStatus(token: string, probe = true): Promise<NativeGmailStatus> {
  try {
    const { response, data } = await call(token, { action: "status", probe });
    if (!response.ok) return { ok: false, ready: false, blocker: data?.error ?? `gmail-status-http-${response.status}` };
    return data as NativeGmailStatus;
  } catch (error) {
    return { ok: false, ready: false, blocker: error instanceof Error ? error.message : String(error) };
  }
}

export async function nativeGmailExecute(token: string, actionRow: any) {
  const { response, data } = await call(token, { action: "execute", action_row: actionRow });
  if (!response.ok || data?.ok !== true) {
    const sideEffectStarted = data?.side_effect_started;
    return {
      ok: false as const,
      error: data?.error ?? `gmail-executor-http-${response.status}`,
      retryable: data?.retryable === true || (sideEffectStarted === false && (response.status === 429 || response.status >= 500)),
      uncertain: sideEffectStarted !== false && response.status >= 500,
      receipt: data?.receipt ?? {},
    };
  }
  if (!data?.receipt || Object.keys(data.receipt).length === 0) {
    return { ok: false as const, error: "gmail-executor-missing-receipt", retryable: false, uncertain: true, receipt: {} };
  }
  return { ok: true as const, receipt: data.receipt, result: data.result ?? {} };
}

export async function nativeGmailVerify(token: string, actionRow: any) {
  const { response, data } = await call(token, {
    action: "verify",
    action_row: actionRow,
    execution_receipt: actionRow?.execution_receipt ?? {},
  });
  if (!response.ok || data?.ok !== true || data?.verified !== true) {
    return {
      ok: false as const,
      error: data?.error ?? (data?.verified === false ? "gmail-source-of-truth-not-confirmed" : `gmail-verifier-http-${response.status}`),
      retryable: data?.retryable === true || response.status === 429 || response.status >= 500,
      receipt: data?.receipt ?? {},
      result: data?.result ?? {},
    };
  }
  if (!data?.receipt || Object.keys(data.receipt).length === 0) {
    return { ok: false as const, error: "gmail-verifier-missing-receipt", retryable: false, receipt: {}, result: data?.result ?? {} };
  }
  return { ok: true as const, receipt: data.receipt, result: { ...(data.result ?? {}), verified: true } };
}

export async function nativeGmailConnectStart(token: string) {
  const { response, data } = await call(token, { action: "connect_start" });
  return response.ok ? data : { ok: false, error: data?.error ?? `gmail-connect-http-${response.status}` };
}

export async function nativeGmailDisconnect(token: string) {
  const { response, data } = await call(token, { action: "disconnect" });
  return response.ok ? data : { ok: false, error: data?.error ?? `gmail-disconnect-http-${response.status}` };
}
