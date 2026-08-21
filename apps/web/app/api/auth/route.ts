import { clearAtlasSession, getAtlasSession, signIn, signUp } from "../../../lib/atlas-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAtlasSession();
  if (!session) return Response.json({ ok: false, authenticated: false }, { status: 401, headers: { "cache-control": "no-store" } });
  return Response.json({ ok: true, authenticated: true, user: { id: session.user.id, email: session.user.email } }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  let body: any;
  try { body = await request.json(); } catch { return Response.json({ ok: false, error: "invalid-json" }, { status: 400 }); }
  const action = body?.action;
  if (action === "signout") {
    await clearAtlasSession();
    return Response.json({ ok: true });
  }
  if (!["signup", "signin"].includes(action)) return Response.json({ ok: false, error: "unsupported-action" }, { status: 400 });
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  if (!email || password.length < 10) return Response.json({ ok: false, error: "Use a valid email and a password of at least 10 characters." }, { status: 400 });
  const result = action === "signup" ? await signUp(email, password, String(body?.full_name ?? "").trim()) : await signIn(email, password);
  return Response.json(result, { status: result.ok ? 200 : Number((result as any).status ?? 400), headers: { "cache-control": "no-store" } });
}
