import { getVercelOidcToken } from "@vercel/oidc";

const ACTIONS_URL = "https://lvkrvqpoajzpcqnlvqaj.supabase.co/functions/v1/atlas-actions";

async function callActions(payload: Record<string, unknown>) {
  const token = await getVercelOidcToken();
  if (!token) {
    return new Response(JSON.stringify({ ok: false, error: "vercel-oidc-unavailable" }), {
      status: 503,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }

  try {
    const response = await fetch(ACTIONS_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const text = await response.text();
    return new Response(text, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json",
        "cache-control": "no-store",
        "x-robots-tag": "noindex",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "actions-unreachable" }), {
      status: 502,
      headers: { "content-type": "application/json", "cache-control": "no-store", "x-robots-tag": "noindex" },
    });
  }
}

export async function GET() {
  const response = await callActions({ action: "status" });
  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
      "x-atlas-service": "execution-queue-bridge",
    },
  });
}

export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }
  return callActions(payload);
}
