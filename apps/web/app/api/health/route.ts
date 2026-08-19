import { NextResponse } from "next/server";

const providers = ["gmail", "calendar", "contacts", "drive", "notion", "hubspot"] as const;
const MEMORY_URL = "https://lvkrvqpoajzpcqnlvqaj.supabase.co/functions/v1/atlas-memory";

function envEnabled(name: string): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  return ["1", "true", "yes", "on", "connected", "ready"].includes(value ?? "");
}

async function memoryStatus() {
  const token = process.env.VERCEL_OIDC_TOKEN;
  if (!token) return { ok: false, error: "vercel-oidc-unavailable" };
  try {
    const response = await fetch(MEMORY_URL, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "status" }),
      cache: "no-store",
    });
    const data = await response.json();
    return response.ok ? data : { ok: false, error: data?.error ?? `memory-http-${response.status}` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "memory-unreachable" };
  }
}

export async function GET() {
  const durable = await memoryStatus();
  const bridged = new Set<string>(durable?.state?.connected_sources ?? []);
  const connections = providers.map((provider) => ({
    provider,
    configured: bridged.has(provider) || envEnabled(`ATLAS_${provider.toUpperCase()}_CONNECTED`),
    via: bridged.has(provider) ? "chatgpt-bridge" : envEnabled(`ATLAS_${provider.toUpperCase()}_CONNECTED`) ? "atlas-oauth" : null,
  }));
  const connected = connections.filter((item) => item.configured).length;
  const blockers = [
    ...(!durable?.ok ? ["durable-memory"] : []),
    ...(connected === 0 ? ["connect-at-least-one-source"] : []),
  ];

  return NextResponse.json({
    status: "ok",
    service: "atlas-ai-chief-of-staff",
    version: "2.4",
    interface: "chatgpt-app-mcp",
    mcp: "/api/mcp",
    durableMemoryReady: Boolean(durable?.ok),
    evidenceCount: durable?.evidenceCount ?? 0,
    correctionCount: durable?.correctionCount ?? 0,
    learningMode: durable?.state?.learning_mode ?? "unknown",
    shadowMode: durable?.state?.shadow_mode ?? "unknown",
    connectedSources: connected,
    expectedSources: providers.length,
    connections,
    blockers,
    readiness: blockers.length === 0 ? "ready" : "partial",
    memoryError: durable?.ok ? null : durable?.error ?? "unknown",
    timestamp: new Date().toISOString(),
  }, { headers: { "Cache-Control": "no-store" } });
}
