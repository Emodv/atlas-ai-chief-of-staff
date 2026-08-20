import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.9.6";

const TEAM_SLUG = "emodvs-projects";
const PROJECT_NAME = "atlas-ai-chief-of-staff";
const USER_KEY = "primary";
const ISSUER = `https://oidc.vercel.com/${TEAM_SLUG}`;
const AUDIENCE = `https://vercel.com/${TEAM_SLUG}`;
const SUBJECT = `owner:${TEAM_SLUG}:project:${PROJECT_NAME}:environment:production`;
const JWKS = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks`));
const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.modify openid email profile";

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function html(body: string, status = 200) {
  return new Response(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Atlas Gmail</title></head><body style="font-family:system-ui;max-width:640px;margin:64px auto;padding:0 24px"><h1>${status < 400 ? "Atlas Gmail connected" : "Atlas Gmail connection failed"}</h1><p>${body}</p></body></html>`, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

async function authorize(req: Request) {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new Error("missing_token");
  await jwtVerify(token, JWKS, { issuer: ISSUER, audience: AUDIENCE, subject: SUBJECT });
}

async function serviceKey(): Promise<string | null> {
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

function googleConfig() {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID")?.trim() ?? "";
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")?.trim() ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "") ?? "";
  return {
    clientId,
    clientSecret,
    redirectUri: `${supabaseUrl}/functions/v1/atlas-gmail`,
    configured: Boolean(clientId && clientSecret && supabaseUrl),
  };
}

async function db(path: string, key: string, init: RequestInit = {}) {
  const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/${path}`, {
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

async function rpc(name: string, key: string, payload: Record<string, unknown>) {
  return db(`rpc/${name}`, key, { method: "POST", body: JSON.stringify(payload) });
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomState() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function refreshAccessToken(key: string) {
  const config = googleConfig();
  if (!config.configured) return { ok: false as const, error: "google-oauth-client-not-configured" };

  const rows = await rpc("atlas_get_connector_secret", key, { p_user_key: USER_KEY, p_provider: "gmail" });
  const credential = Array.isArray(rows) ? rows[0] : rows;
  if (!credential?.secret || credential?.status !== "connected") return { ok: false as const, error: "gmail-not-connected" };

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: credential.secret,
    grant_type: "refresh_token",
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.access_token) {
    return { ok: false as const, error: data?.error_description ?? data?.error ?? `google-token-http-${response.status}` };
  }
  return {
    ok: true as const,
    accessToken: String(data.access_token),
    accountEmail: credential.account_email ?? null,
    scopes: credential.scopes ?? [],
  };
}

async function gmail(accessToken: string, path: string, init: RequestInit = {}) {
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  return { response, data };
}

function headerValue(headers: any[], name: string) {
  const item = (headers ?? []).find((h) => String(h?.name ?? "").toLowerCase() === name.toLowerCase());
  return item?.value ? String(item.value) : null;
}

async function connectionStatus(key: string, probe = false) {
  const config = googleConfig();
  const rows = await db(`atlas_connector_credentials?select=provider,account_email,scopes,status,connected_at,updated_at,metadata&user_key=eq.${USER_KEY}&provider=eq.gmail&limit=1`, key, { method: "GET" });
  const credential = Array.isArray(rows) ? rows[0] ?? null : null;
  const base = {
    ok: true,
    provider: "gmail",
    oauth_client_configured: config.configured,
    connected: credential?.status === "connected",
    account_email: credential?.account_email ?? null,
    scopes: credential?.scopes ?? [],
    connected_at: credential?.connected_at ?? null,
    ready: false,
    blocker: null as string | null,
  };
  if (!config.configured) return { ...base, blocker: "google-oauth-client-not-configured" };
  if (!base.connected) return { ...base, blocker: "gmail-not-connected" };
  if (!probe) return { ...base, ready: true };

  const token = await refreshAccessToken(key);
  if (!token.ok) return { ...base, blocker: token.error };
  const profile = await gmail(token.accessToken, "profile", { method: "GET" });
  if (!profile.response.ok) return { ...base, blocker: `gmail-profile-http-${profile.response.status}` };
  return { ...base, ready: true, account_email: profile.data?.emailAddress ?? base.account_email, messages_total: profile.data?.messagesTotal ?? null };
}

async function callback(req: Request, key: string) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  if (oauthError) return html(`Google returned: ${oauthError}`, 400);
  if (!code || !state) return html("Missing authorization code or state.", 400);

  const config = googleConfig();
  if (!config.configured) return html("Google OAuth client is not configured in Atlas.", 503);
  const stateHash = await sha256(state);
  const now = new Date().toISOString();
  const rows = await db(`atlas_oauth_states?select=*&provider=eq.gmail&user_key=eq.${USER_KEY}&state_hash=eq.${stateHash}&used_at=is.null&expires_at=gt.${encodeURIComponent(now)}&limit=1`, key, { method: "GET" });
  const row = Array.isArray(rows) ? rows[0] ?? null : null;
  if (!row) return html("Authorization state is invalid or expired. Start the connection again from Atlas.", 400);

  await db(`atlas_oauth_states?id=eq.${row.id}`, key, { method: "PATCH", body: JSON.stringify({ used_at: now }) });

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const tokenData = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !tokenData?.access_token || !tokenData?.refresh_token) {
    return html(`Token exchange failed: ${tokenData?.error_description ?? tokenData?.error ?? tokenResponse.status}`, 400);
  }

  const profile = await gmail(String(tokenData.access_token), "profile", { method: "GET" });
  if (!profile.response.ok || !profile.data?.emailAddress) return html("Gmail profile verification failed.", 400);

  const scopes = String(tokenData.scope ?? GMAIL_SCOPE).split(/\s+/).filter(Boolean);
  await rpc("atlas_store_connector_secret", key, {
    p_user_key: USER_KEY,
    p_provider: "gmail",
    p_secret: String(tokenData.refresh_token),
    p_account_email: String(profile.data.emailAddress),
    p_scopes: scopes,
    p_metadata: { google_account_verified: true, connected_via: "native-oauth", token_type: tokenData.token_type ?? "Bearer" },
  });

  return html(`Connected ${profile.data.emailAddress}. Atlas can now send approved Gmail drafts and independently verify the sent message. You can close this tab.`);
}

export default {
  async fetch(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response("ok", { headers: jsonHeaders });
    const key = await serviceKey();
    if (!key) return json({ ok: false, error: "service-role-unavailable" }, 503);

    if (req.method === "GET") return callback(req, key);
    if (req.method !== "POST") return json({ ok: false, error: "POST required" }, 405);
    try { await authorize(req); } catch { return json({ ok: false, error: "unauthorized" }, 401); }

    const input = await req.json().catch(() => ({}));
    const action = input.action ?? "status";

    try {
      if (action === "status") return json(await connectionStatus(key, Boolean(input.probe)));

      if (action === "connect_start") {
        const config = googleConfig();
        if (!config.configured) return json({ ok: false, error: "google-oauth-client-not-configured", ready: false }, 503);
        const state = randomState();
        const stateHash = await sha256(state);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        await db("atlas_oauth_states", key, {
          method: "POST",
          body: JSON.stringify({ user_key: USER_KEY, provider: "gmail", state_hash: stateHash, expires_at: expiresAt, metadata: { redirect_uri: config.redirectUri } }),
        });
        const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        url.searchParams.set("client_id", config.clientId);
        url.searchParams.set("redirect_uri", config.redirectUri);
        url.searchParams.set("response_type", "code");
        url.searchParams.set("scope", GMAIL_SCOPE);
        url.searchParams.set("access_type", "offline");
        url.searchParams.set("prompt", "consent");
        url.searchParams.set("include_granted_scopes", "true");
        url.searchParams.set("state", state);
        return json({ ok: true, provider: "gmail", authorization_url: url.toString(), expires_at: expiresAt, redirect_uri: config.redirectUri });
      }

      if (action === "disconnect") {
        const deleted = await rpc("atlas_delete_connector_secret", key, { p_user_key: USER_KEY, p_provider: "gmail" });
        return json({ ok: true, provider: "gmail", disconnected: Boolean(Array.isArray(deleted) ? deleted[0] : deleted) });
      }

      if (action === "execute") {
        const actionRow = input.action_row ?? input.action;
        const payload = actionRow?.payload ?? {};
        const draftId = payload?.draft_id;
        if (!draftId || typeof draftId !== "string") {
          return json({ ok: false, error: "native-gmail-requires-draft-id", side_effect_started: false, retryable: false, receipt: {} }, 422);
        }

        const token = await refreshAccessToken(key);
        if (!token.ok) return json({ ok: false, error: token.error, side_effect_started: false, retryable: false, receipt: {} }, 503);

        const preflight = await gmail(token.accessToken, `drafts/${encodeURIComponent(draftId)}?format=metadata`, { method: "GET" });
        if (!preflight.response.ok) {
          const retryable = preflight.response.status === 429 || preflight.response.status >= 500;
          return json({ ok: false, error: `gmail-draft-preflight-http-${preflight.response.status}`, side_effect_started: false, retryable, receipt: { draft_id: draftId } }, retryable ? 503 : 422);
        }
        const expectedRecipient = typeof payload?.recipient === "string" ? payload.recipient.trim().toLowerCase() : "";
        const actualTo = headerValue(preflight.data?.message?.payload?.headers ?? [], "To")?.toLowerCase() ?? "";
        if (expectedRecipient && !actualTo.includes(expectedRecipient)) {
          return json({ ok: false, error: "gmail-draft-recipient-mismatch", side_effect_started: false, retryable: false, receipt: { draft_id: draftId } }, 409);
        }

        const sent = await gmail(token.accessToken, "drafts/send", { method: "POST", body: JSON.stringify({ id: draftId }) });
        if (!sent.response.ok || !sent.data?.id) {
          const uncertain = sent.response.status >= 500;
          return json({
            ok: false,
            error: sent.data?.error?.message ?? `gmail-draft-send-http-${sent.response.status}`,
            side_effect_started: uncertain ? undefined : false,
            retryable: false,
            receipt: { draft_id: draftId },
          }, sent.response.status >= 400 && sent.response.status < 600 ? sent.response.status : 500);
        }

        return json({
          ok: true,
          receipt: {
            provider: "gmail",
            operation: "drafts.send",
            draft_id: draftId,
            message_id: sent.data.id,
            thread_id: sent.data.threadId ?? null,
            account_email: token.accountEmail,
            executed_at: new Date().toISOString(),
          },
          result: { sent: true, message_id: sent.data.id, thread_id: sent.data.threadId ?? null },
        });
      }

      if (action === "verify") {
        const actionRow = input.action_row ?? input.action;
        const receipt = input.execution_receipt ?? actionRow?.execution_receipt ?? {};
        const messageId = receipt?.message_id;
        if (!messageId || typeof messageId !== "string") return json({ ok: false, verified: false, error: "gmail-verifier-missing-message-id", retryable: false, receipt: {} }, 422);

        const token = await refreshAccessToken(key);
        if (!token.ok) return json({ ok: false, verified: false, error: token.error, retryable: true, receipt: {} }, 503);
        const message = await gmail(token.accessToken, `messages/${encodeURIComponent(messageId)}?format=minimal`, { method: "GET" });
        if (!message.response.ok) {
          const retryable = message.response.status === 404 || message.response.status === 429 || message.response.status >= 500;
          return json({ ok: false, verified: false, error: `gmail-message-verify-http-${message.response.status}`, retryable, receipt: { message_id: messageId } }, retryable ? 503 : 422);
        }
        const labels = Array.isArray(message.data?.labelIds) ? message.data.labelIds : [];
        const sent = labels.includes("SENT");
        if (!sent) return json({ ok: false, verified: false, error: "gmail-message-not-labeled-sent", retryable: true, receipt: { message_id: messageId, label_ids: labels } }, 409);

        return json({
          ok: true,
          verified: true,
          receipt: {
            provider: "gmail",
            operation: "messages.get",
            message_id: message.data.id,
            thread_id: message.data.threadId ?? null,
            label_ids: labels,
            account_email: token.accountEmail,
            verified_at: new Date().toISOString(),
          },
          result: {
            verified: true,
            source_of_truth: "gmail.messages.get",
            sent_label_confirmed: true,
            message_id: message.data.id,
            thread_id: message.data.threadId ?? null,
            metrics: { opportunity_advanced: true, metric_quality: "measured" },
          },
        });
      }

      return json({ ok: false, error: "unsupported-action" }, 400);
    } catch (error) {
      return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 500);
    }
  },
};
