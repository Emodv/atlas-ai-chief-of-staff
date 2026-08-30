import { cookies } from "next/headers";
import { getAtlasSession } from "../../../lib/atlas-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAtlasSession();
  if (!session) return Response.json({ ok: false, error: "authentication-required" }, { status: 401 });
  const jar = await cookies();
  const googleConnected = Boolean(jar.get("atlas_google_provider_token")?.value);
  return Response.json({
    ok: true,
    google: {
      connected: googleConnected,
      mode: googleConnected ? "read-only" : "not-connected",
      connect_url: "/api/auth/google?workspace=1",
      products: ["Gmail", "Calendar", "Contacts", "Drive", "Docs", "Sheets"],
    },
  }, { headers: { "cache-control": "no-store" } });
}
