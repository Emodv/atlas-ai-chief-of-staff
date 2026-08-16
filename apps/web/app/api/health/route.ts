import { NextResponse } from "next/server";

const providers = ["gmail", "calendar", "contacts", "drive", "notion", "hubspot"] as const;

export function GET() {
  const connections = providers.map((provider) => ({
    provider,
    configured: Boolean(process.env[`ATLAS_${provider.toUpperCase()}_CONNECTED`]),
  }));

  return NextResponse.json(
    {
      status: "ok",
      service: "atlas-ai-chief-of-staff",
      version: "2.0",
      interface: "chatgpt-native-mcp",
      mcp: "/api/mcp",
      persistence: Boolean(process.env.DATABASE_URL),
      connections,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
