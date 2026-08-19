import { getVercelOidcToken } from "@vercel/oidc";

const DECISION_URL = "https://lvkrvqpoajzpcqnlvqaj.supabase.co/functions/v1/atlas-decide";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}

export async function GET() {
  return json({
    ok: true,
    service: "atlas-decision-bridge",
    target: "atlas-decide",
    auth: "vercel-oidc",
  });
}

export async function POST(request: Request) {
  const token = await getVercelOidcToken();
  if (!token) {
    return json({ ok: false, error: "vercel-oidc-unavailable" }, 503);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "invalid-json" }, 400);
  }

  try {
    const response = await fetch(DECISION_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const text = await response.text();
    let result: unknown;
    try {
      result = text ? JSON.parse(text) : null;
    } catch {
      result = { raw: text };
    }

    if (!response.ok) {
      return json(
        {
          ok: false,
          error: "atlas-decide-failed",
          upstreamStatus: response.status,
          result,
        },
        response.status,
      );
    }

    return json(result, 200);
  } catch (error) {
    return json(
      {
        ok: false,
        error: "atlas-decide-unreachable",
        message: error instanceof Error ? error.message : String(error),
      },
      502,
    );
  }
}
