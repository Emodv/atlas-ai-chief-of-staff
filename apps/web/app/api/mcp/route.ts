import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const providers = ["gmail", "calendar", "contacts", "drive", "notion", "hubspot"] as const;
type Provider = (typeof providers)[number];
const MEMORY_URL = "https://lvkrvqpoajzpcqnlvqaj.supabase.co/functions/v1/atlas-memory";

function envEnabled(name: string): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  return ["1", "true", "yes", "on", "connected", "ready"].includes(value ?? "");
}

async function memory(action: string, payload: Record<string, unknown> = {}) {
  const token = process.env.VERCEL_OIDC_TOKEN;
  if (!token) return { ok: false, error: "vercel-oidc-unavailable" };
  try {
    const response = await fetch(MEMORY_URL, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, ...payload }),
      cache: "no-store",
    });
    const data = await response.json();
    return response.ok ? data : { ok: false, error: data?.error ?? `memory-http-${response.status}` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "memory-unreachable" };
  }
}

async function connectionState() {
  const durable = await memory("status");
  const bridged = new Set<string>(durable?.state?.connected_sources ?? []);
  const connections = providers.map((provider) => ({
    provider,
    configured: bridged.has(provider) || envEnabled(`ATLAS_${provider.toUpperCase()}_CONNECTED`),
    via: bridged.has(provider) ? "chatgpt-bridge" : envEnabled(`ATLAS_${provider.toUpperCase()}_CONNECTED`) ? "atlas-oauth" : null,
  }));
  return { durable, connections };
}

function chooseTrust(input: {
  reversible: boolean;
  consequence: "low" | "medium" | "high";
  permissionAvailable: boolean;
  evidenceQuality: "strong" | "mixed" | "weak";
  sensitive: boolean;
}) {
  if (input.sensitive || input.consequence === "high" || !input.permissionAvailable) {
    return { trust: "RED", action: "needs_user", label: "Needs you", why: input.sensitive ? "Sensitive context requires the user." : !input.permissionAvailable ? "Required permission is unavailable." : "High-consequence action requires the user." };
  }
  if (!input.reversible || input.evidenceQuality !== "strong" || input.consequence === "medium") {
    return { trust: "YELLOW", action: "review", label: "Review", why: "Useful evidence exists, but Atlas should not execute silently." };
  }
  return { trust: "GREEN", action: "execute", label: "Handled", why: "Strong evidence, low consequence, reversible, and permitted." };
}

const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const internalWrite = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false };

const handler = createMcpHandler((server) => {
  server.registerTool("atlas_status", {
    title: "Atlas Status",
    description: "Verify Atlas availability, durable memory, learning/shadow state, evidence volume, sources, and the next blocker.",
    inputSchema: z.object({}), annotations: readOnly,
  }, async () => {
    const { durable, connections } = await connectionState();
    const connected = connections.filter((x) => x.configured);
    const blockers = [] as string[];
    if (!durable?.ok) blockers.push("durable-memory");
    if (!connected.length) blockers.push("connect-source");
    return {
      content: [{ type: "text", text: blockers.length ? `Atlas online · ${blockers[0]} needs attention` : "Atlas online ✓" }],
      structuredContent: {
        status: "online", version: "2.4", interface: "chatgpt-app-mcp",
        durableMemory: Boolean(durable?.ok), evidenceCount: durable?.evidenceCount ?? 0,
        correctionCount: durable?.correctionCount ?? 0,
        learningMode: durable?.state?.learning_mode ?? "off", shadowMode: durable?.state?.shadow_mode ?? "off",
        connectedSources: connected.map((x) => x.provider), expectedSources: providers.length,
        blockers, trustState: blockers.length ? "Review" : "Handled",
      },
    };
  });

  server.registerTool("atlas_connection_health", {
    title: "Atlas Connection Health",
    description: "Report source access, whether it comes from ChatGPT bridge or Atlas OAuth, and one next blocker.",
    inputSchema: z.object({}), annotations: readOnly,
  }, async () => {
    const { durable, connections } = await connectionState();
    const missing = connections.filter((x) => !x.configured);
    const nextBlocker = !durable?.ok ? "durable-memory" : missing[0]?.provider ?? null;
    return { content: [{ type: "text", text: nextBlocker ? `Needs setup: ${nextBlocker}` : "Connections ✓" }], structuredContent: { connections, durableMemory: Boolean(durable?.ok), allReady: Boolean(durable?.ok) && missing.length === 0, nextBlocker, trustState: nextBlocker ? "Needs you" : "Handled" } };
  });

  server.registerTool("atlas_source_status", {
    title: "Atlas Source Status", description: "Check one source and its access path.",
    inputSchema: z.object({ provider: z.enum(providers) }), annotations: readOnly,
  }, async ({ provider }: { provider: Provider }) => {
    const { connections } = await connectionState();
    const item = connections.find((x) => x.provider === provider)!;
    return { content: [{ type: "text", text: item.configured ? `${provider} ✓` : `${provider} needs connection` }], structuredContent: { ...item, trustState: item.configured ? "Handled" : "Needs you" } };
  });

  server.registerTool("atlas_ingest_signals", {
    title: "Ingest Atlas Learning Signals",
    description: "Use after reading user-authorized ChatGPT sources. Persist compact, non-secret evidence for tone, relationships, routines, preferences, and decisions. Do not send passwords, tokens, account numbers, or raw sensitive identifiers.",
    inputSchema: z.object({
      sources: z.array(z.enum(providers)).min(1).max(6),
      items: z.array(z.object({ source: z.enum(providers), kind: z.string().min(1).max(80), fingerprint: z.string().min(1).max(240), payload: z.record(z.string(), z.unknown()), occurredAt: z.string().optional() })).min(1).max(100),
    }), annotations: internalWrite,
  }, async ({ sources, items }) => {
    const result = await memory("ingest_evidence", { items });
    if (!result?.ok) return { content: [{ type: "text", text: "Learning storage unavailable" }], structuredContent: { stored: false, error: result?.error, trustState: "Needs you" } };
    const status = await memory("status");
    const merged = Array.from(new Set([...(status?.state?.connected_sources ?? []), ...sources]));
    await memory("set_mode", { connectedSources: merged });
    return { content: [{ type: "text", text: `Learned ${result.inserted ?? 0} new signals ✓` }], structuredContent: { stored: true, inserted: result.inserted ?? 0, evidenceCount: result.evidenceCount ?? 0, connectedSources: merged, trustState: "Handled" } };
  });

  server.registerTool("atlas_update_profile", {
    title: "Update Atlas Digital Twin",
    description: "Persist a synthesized Digital Twin after evidence review. Keep claims evidence-based and omit secrets.",
    inputSchema: z.object({
      profile: z.record(z.string(), z.unknown()), relationshipGraph: z.record(z.string(), z.unknown()).default({}), preferences: z.record(z.string(), z.unknown()).default({}), confidence: z.record(z.string(), z.unknown()).default({}), evidenceCount: z.number().int().nonnegative().optional(),
    }), annotations: internalWrite,
  }, async (input) => {
    const result = await memory("set_profile", input);
    return { content: [{ type: "text", text: result?.ok ? "Digital Twin updated ✓" : "Digital Twin update failed" }], structuredContent: { updated: Boolean(result?.ok), error: result?.error ?? null, trustState: result?.ok ? "Handled" : "Needs you" } };
  });

  server.registerTool("atlas_profile", {
    title: "Atlas Digital Twin", description: "Read the current durable Digital Twin and learning counts.",
    inputSchema: z.object({}), annotations: readOnly,
  }, async () => {
    const result = await memory("status");
    return { content: [{ type: "text", text: result?.ok ? "Digital Twin ready" : "Digital Twin unavailable" }], structuredContent: { profile: result?.profile ?? null, evidenceCount: result?.evidenceCount ?? 0, correctionCount: result?.correctionCount ?? 0, trustState: result?.ok ? "Handled" : "Needs you" } };
  });

  server.registerTool("atlas_learning_mode", {
    title: "Atlas Learning Mode", description: "Start, inspect, or stop durable Learning Mode. No external actions are allowed.",
    inputSchema: z.object({ action: z.enum(["start", "status", "stop"]).default("status"), focus: z.array(z.enum(["tone", "language", "relationships", "routines", "preferences", "decisions"])).optional() }), annotations: internalWrite,
  }, async ({ action, focus }) => {
    const status = await memory("status");
    const connected = status?.state?.connected_sources ?? [];
    if (!status?.ok) return { content: [{ type: "text", text: "Durable memory unavailable" }], structuredContent: { mode: "blocked", trustState: "Needs you" } };
    if (action === "start" && !connected.length) return { content: [{ type: "text", text: "Needs source access" }], structuredContent: { mode: "blocked", connectedSources: [], trustState: "Needs you" } };
    if (action !== "status") await memory("set_mode", { learningMode: action === "start" ? "learning" : "off", shadowMode: action === "start" ? "off" : undefined, focus });
    const after = await memory("status");
    return { content: [{ type: "text", text: after?.state?.learning_mode === "learning" ? "Learning Mode ✓" : "Learning Mode off" }], structuredContent: { mode: after?.state?.learning_mode ?? "off", connectedSources: after?.state?.connected_sources ?? [], focus: after?.state?.learning_focus ?? [], evidenceCount: after?.evidenceCount ?? 0, autonomousActionsAllowed: false, statePersistence: "durable", trustState: after?.state?.learning_mode === "learning" ? "Handled" : "Review" } };
  });

  server.registerTool("atlas_shadow_mode", {
    title: "Atlas Shadow Mode", description: "Start, inspect, or stop durable Shadow Mode. Predictions only; external actions remain disabled.",
    inputSchema: z.object({ action: z.enum(["start", "status", "stop"]).default("status"), taskType: z.string().optional() }), annotations: internalWrite,
  }, async ({ action, taskType }) => {
    const status = await memory("status");
    if (!status?.ok || !(status?.state?.connected_sources ?? []).length) return { content: [{ type: "text", text: "Needs learned source context" }], structuredContent: { mode: "blocked", trustState: "Needs you" } };
    if (action === "start" && (status?.evidenceCount ?? 0) < 10) return { content: [{ type: "text", text: "Needs more learning evidence" }], structuredContent: { mode: "blocked", evidenceCount: status?.evidenceCount ?? 0, minimumEvidence: 10, trustState: "Review" } };
    if (action !== "status") await memory("set_mode", { shadowMode: action === "start" ? "shadow" : "off", learningMode: action === "start" ? "off" : undefined });
    const after = await memory("status");
    return { content: [{ type: "text", text: after?.state?.shadow_mode === "shadow" ? "Shadow Mode ✓" : "Shadow Mode off" }], structuredContent: { mode: after?.state?.shadow_mode ?? "off", taskType: taskType ?? null, evidenceCount: after?.evidenceCount ?? 0, correctionCount: after?.correctionCount ?? 0, externalActionsAllowed: false, correctionPersistence: "durable", trustState: after?.state?.shadow_mode === "shadow" ? "Handled" : "Review" } };
  });

  server.registerTool("atlas_build_context_packet", {
    title: "Build Atlas Context", description: "Build a concise relationship-aware context packet from current evidence.",
    inputSchema: z.object({ task: z.string().min(1), contact: z.string().optional(), relationshipType: z.string().optional(), preferredLanguage: z.string().optional(), evidence: z.array(z.object({ source: z.string(), fact: z.string(), freshness: z.enum(["fresh", "aging", "stale"]).default("fresh") })).max(40), openLoops: z.array(z.string()).max(20).default([]) }), annotations: readOnly,
  }, async ({ task, contact, relationshipType, preferredLanguage, evidence, openLoops }) => {
    const stale = evidence.filter((x) => x.freshness === "stale").length;
    const quality = evidence.length >= 2 && stale === 0 ? "strong" : evidence.length ? "mixed" : "weak";
    const durable = await memory("status");
    return { content: [{ type: "text", text: quality === "strong" ? "Context ready ✓" : "Context needs review" }], structuredContent: { task, person: contact ?? null, relationshipType: relationshipType ?? "unknown", replyLanguage: preferredLanguage ?? "match-contact", evidence, openLoops, evidenceQuality: quality, digitalTwin: durable?.profile?.profile ?? null, preferences: durable?.profile?.preferences ?? null } };
  });

  server.registerTool("atlas_trust_gate", {
    title: "Atlas Trust Gate", description: "Run before any external action. Converts evidence and risk into Handled, Review, or Needs you.",
    inputSchema: z.object({ reversible: z.boolean(), consequence: z.enum(["low", "medium", "high"]), permissionAvailable: z.boolean(), evidenceQuality: z.enum(["strong", "mixed", "weak"]), sensitive: z.boolean().default(false) }), annotations: readOnly,
  }, async (input) => ({ content: [{ type: "text", text: chooseTrust(input).label }], structuredContent: chooseTrust(input) }));

  server.registerTool("atlas_record_correction", {
    title: "Record Atlas Correction", description: "Durably learn from approve/edit/reject/different-action feedback.",
    inputSchema: z.object({ taskType: z.string().min(1), outcome: z.enum(["accepted", "edited", "rejected", "different_action"]), whatAtlasPredicted: z.string().optional(), whatUserDid: z.string().optional(), correctionReason: z.string().optional(), relationshipKey: z.string().optional() }), annotations: internalWrite,
  }, async (input) => {
    const result = await memory("record_correction", { taskType: input.taskType, outcome: input.outcome, predicted: input.whatAtlasPredicted, actual: input.whatUserDid, reason: input.correctionReason, relationshipKey: input.relationshipKey });
    return { content: [{ type: "text", text: result?.ok ? "Learned ✓" : "Correction storage failed" }], structuredContent: { recorded: Boolean(result?.ok), storage: result?.ok ? "durable" : "unavailable", trustState: result?.ok ? "Handled" : "Needs you" } };
  });
});

export { handler as GET, handler as POST };
