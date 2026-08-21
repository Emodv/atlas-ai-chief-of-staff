export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lvkrvqpoajzpcqnlvqaj.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export async function GET() {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: SUPABASE_ANON_KEY ? { apikey: SUPABASE_ANON_KEY } : {},
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return Response.json(
      {
        ok: res.ok,
        google_enabled: Boolean(data?.external?.google),
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return Response.json({ ok: false, google_enabled: false }, { status: 500, headers: { "cache-control": "no-store" } });
  }
}
