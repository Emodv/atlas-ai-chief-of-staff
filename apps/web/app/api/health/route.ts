import { getVercelOidcToken } from "@vercel/oidc";
import { NextResponse } from "next/server";
import { nativeGmailStatus } from "../../../lib/native-gmail";

const providers = ["gmail", "calendar", "contacts", "drive", "notion", "hubspot"] as const;
const MEMORY_URL = "https://lvkrvqpoajzpcqnlvqaj.supabase.co/functions/v1/atlas-memory";

function envEnabled(name: string): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  return ["1", "true", "yes", "on", "connected", "ready"].includes(value ?? "");
}

async function memoryStatus(token: string) {
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
  const token = await getVercelOidcToken();
  if (!token) {
    return NextResponse.json({ status: "degraded", service: "atlas-ai-chief-of-staff", blocker: "vercel-oidc-unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  const [durable, nativeGmail] = await Promise.all([memoryStatus(token), nativeGmailStatus(token, false)]);
  const bridged = new Set<string>(durable?.state?.connected_sources ?? []);
  const connections = providers.map((provider) => {
    const nativeReady = provider === "gmail" && nativeGmail.ready === true;
    const atlasOauth = envEnabled(`ATLAS_${provider.toUpperCase()}_CONNECTED`);
    return {
      provider,
      configured: nativeReady || bridged.has(provider) || atlasOauth,
      via: nativeReady ? "native-oauth" : bridged.has(provider) ? "chatgpt-bridge" : atlasOauth ? "atlas-oauth" : null,
      autonomous_closed_loop: provider === "gmail" ? nativeReady : false,
    };
  });
  const connected = connections.filter((item) => item.configured).length;
  const blockers = [
    ...(!durable?.ok ? ["durable-memory"] : []),
    ...(connected === 0 ? ["connect-at-least-one-source"] : []),
  ];

  return NextResponse.json({
    status: "ok",
    service: "atlas-ai-chief-of-staff",
    version: "2.9",
    interface: "chatgpt-app-mcp",
    mcp: "/api/mcp",
    durableMemoryReady: Boolean(durable?.ok),
    evidenceCount: durable?.evidenceCount ?? 0,
    correctionCount: durable?.correctionCount ?? 0,
    learningMode: durable?.state?.learning_mode ?? "unknown",
    shadowMode: durable?.state?.shadow_mode ?? "unknown",
    trust: durable?.trust ?? null,
    autonomyAllowed: Boolean(durable?.trust?.autonomyAllowed),
    connectedSources: connected,
    expectedSources: providers.length,
    connections,
    nativeConnectors: { gmail: nativeGmail },
    autonomousClosedLoopConnectors: connections.filter((item) => item.autonomous_closed_loop).map((item) => item.provider),
    blockers,
    readiness: blockers.length === 0 ? "ready" : "partial",
    memoryError: durable?.ok ? null : durable?.error ?? "unknown",
    timestamp: new Date().toISOString(),
  }, { headers: { "Cache-Control": "no-store" } });
}
