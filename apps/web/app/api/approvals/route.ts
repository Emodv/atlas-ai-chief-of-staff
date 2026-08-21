import { getAtlasSession } from "../../../lib/atlas-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const APPROVALS_URL = "https://lvkrvqpoajzpcqnlvqaj.supabase.co/functions/v1/atlas-approvals";

async function callApprovals(payload: Record<string, unknown>) {
  const session = await getAtlasSession();
  if (!session) return { ok: false, error: "authentication-required", status: 401 };
  const response = await fetch(APPROVALS_URL, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${session.accessToken}` },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const text = await response.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  return { ...data, status: response.status };
}

export async function GET() {
  const result = await callApprovals({ action: "list" });
  return Response.json(result, { status: result.status ?? 200, headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  let body: any;
  try { body = await request.json(); } catch { return Response.json({ ok: false, error: "invalid-json" }, { status: 400 }); }
  if (!body?.action_id || !["approve", "reject"].includes(body?.action)) return Response.json({ ok: false, error: "invalid-decision" }, { status: 400 });
  const result = await callApprovals({ action: body.action, action_id: body.action_id, note: body.note });
  return Response.json(result, { status: result.status ?? 200, headers: { "cache-control": "no-store" } });
}
