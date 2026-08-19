import { NextResponse } from "next/server";

const providers = ["gmail", "calendar", "contacts", "drive", "notion", "hubspot"] as const;

function envEnabled(name: string): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on" || value === "connected" || value === "ready";
}

export function GET() {
  const connections = providers.map((provider) => ({
    provider,
    configured: envEnabled(`ATLAS_${provider.toUpperCase()}_CONNECTED`),
  }));
  const connected = connections.filter((item) => item.configured).length;
  const databaseConfigured = Boolean(process.env.DATABASE_URL);
  const durableMemoryReady = databaseConfigured && envEnabled("ATLAS_DURABLE_MEMORY_READY");
  const blockers = [
    ...(connected === 0 ? ["connect-at-least-one-source"] : []),
    ...(!durableMemoryReady ? ["wire-durable-memory"] : []),
  ];

  return NextResponse.json(
    {
      status: "ok",
      service: "atlas-ai-chief-of-staff",
      version: "2.3",
      interface: "chatgpt-app-mcp",
      mcp: "/api/mcp",
      databaseConfigured,
      durableMemoryReady,
      connectedSources: connected,
      expectedSources: providers.length,
      connections,
      blockers,
      readiness: blockers.length === 0 ? "ready" : "partial",
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
