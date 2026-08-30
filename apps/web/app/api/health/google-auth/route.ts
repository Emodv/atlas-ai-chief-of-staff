export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lvkrvqpoajzpcqnlvqaj.supabase.co";

export async function GET() {
  const clientId = Boolean(process.env.GOOGLE_CLIENT_ID?.trim());
  const clientSecret = Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim());
  const directOAuthReady = clientId && clientSecret;

  return Response.json(
    {
      ok: directOAuthReady,
      directOAuthReady,
      googleClientIdConfigured: clientId,
      googleClientSecretConfigured: clientSecret,
      fallbackProvider: directOAuthReady ? null : "supabase-google",
      supabaseUrl: SUPABASE_URL,
      requiredRedirectUri: "https://atlas.moda/api/auth/google/callback",
      note: directOAuthReady
        ? "Atlas.Moda direct Google OAuth is configured."
        : "Direct Google OAuth is not configured in Vercel. Atlas will otherwise depend on the Supabase Google provider configuration.",
    },
    { status: directOAuthReady ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
}
