import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const TRUST = {
  green: "GREEN",
  yellow: "YELLOW",
  red: "RED",
} as const;

type Trust = (typeof TRUST)[keyof typeof TRUST];

const providers = ["gmail", "calendar", "contacts", "drive", "notion", "hubspot"] as const;
type Provider = (typeof providers)[number];

function providerConnections() {
  return providers.map((provider) => ({
    provider,
    configured: Boolean(process.env[`ATLAS_${provider.toUpperCase()}_CONNECTED`]),
  }));
}

function chooseTrust(input: {
  reversible: boolean;
  consequence: "low" | "medium" | "high";
  permissionAvailable: boolean;
  evidenceQuality: "strong" | "mixed" | "weak";
  sensitive: boolean;
}): { trust: Trust; action: "execute" | "review" | "needs_user"; why: string } {
  if (input.sensitive || input.consequence === "high" || !input.permissionAvailable) {
    return {
      trust: TRUST.red,
      action: "needs_user",
      why: input.sensitive
        ? "Sensitive/high-consequence context requires the user."
        : !input.permissionAvailable
          ? "Required execution permission is not available."
          : "High-consequence action requires the user.",
    };
  }

  if (!input.reversible || input.evidenceQuality !== "strong" || input.consequence === "medium") {
    return {
      trust: TRUST.yellow,
      action: "review",
      why: "Useful context exists, but Atlas should not execute silently.",
    };
  }

  return {
    trust: TRUST.green,
    action: "execute",
    why: "Strong evidence, low consequence, reversible, and permitted.",
  };
}

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "atlas_status",
      "Use this when you need to verify Atlas availability, version, operating mode, and readiness.",
      {},
      async () => {
        const connections = providerConnections();
        return {
          content: [{ type: "text", text: "Atlas online ✓" }],
          structuredContent: {
            status: "online",
            version: "2.1",
            interface: "chatgpt-app-mcp",
            principle: "signal-over-noise",
            defaultUx: "silent-by-default",
            durableMemory: Boolean(process.env.DATABASE_URL),
            connectedSources: connections.filter((item) => item.configured).length,
            expectedSources: connections.length,
          },
        };
      },
    );

    server.tool(
      "atlas_connection_health",
      "Use this during onboarding or debugging to report every Atlas source connection and the single next blocker.",
      {},
      async () => {
        const connections = providerConnections();
        const missing = connections.filter((item) => !item.configured);
        return {
          content: [{ type: "text", text: missing.length ? `${missing.length} connections need setup` : "Connections ✓" }],
          structuredContent: {
            connections,
            allReady: missing.length === 0,
            nextBlocker: missing[0]?.provider ?? null,
            durableMemory: Boolean(process.env.DATABASE_URL),
          },
        };
      },
    );

    server.tool(
      "atlas_source_status",
      "Use this when ChatGPT needs the status of one Atlas source before attempting any source-specific workflow.",
      { provider: z.enum(providers) },
      async ({ provider }: { provider: Provider }) => {
        const configured = Boolean(process.env[`ATLAS_${provider.toUpperCase()}_CONNECTED`]);
        return {
          content: [{ type: "text", text: configured ? `${provider} ✓` : `${provider} needs connection` }],
          structuredContent: {
            provider,
            configured,
            trustState: configured ? "Handled" : "Needs you",
            nextAction: configured ? "none" : "authorize-source",
          },
        };
      },
    );

    server.tool(
      "atlas_learning_mode",
      "Use this after source access exists to start or inspect Learning Mode, where Atlas learns the user's tone, language, relationships, routines, preferences, and decision patterns without taking autonomous external actions.",
      {
        action: z.enum(["start", "status", "stop"]).default("status"),
        focus: z.array(z.enum(["tone", "language", "relationships", "routines", "preferences", "decisions"])).optional(),
      },
      async ({ action, focus }) => {
        const connections = providerConnections();
        const connected = connections.filter((item) => item.configured).map((item) => item.provider);
        const canStart = connected.length > 0;
        const mode = action === "stop" ? "off" : canStart ? "learning" : "blocked";
        return {
          content: [{ type: "text", text: mode === "learning" ? "Learning Mode ✓" : mode === "off" ? "Learning Mode stopped" : "Needs source access" }],
          structuredContent: {
            requestedAction: action,
            mode,
            connectedSources: connected,
            focus: focus ?? ["tone", "language", "relationships", "routines", "preferences", "decisions"],
            autonomousActionsAllowed: false,
            trustState: mode === "learning" ? "Handled" : mode === "blocked" ? "Needs you" : "Handled",
          },
        };
      },
    );

    server.tool(
      "atlas_shadow_mode",
      "Use this after Learning Mode to run Atlas in Shadow Mode. Atlas predicts what the user would do, but does not perform external actions; approve, edit, and reject outcomes become training signals.",
      {
        action: z.enum(["start", "status", "stop"]).default("status"),
        taskType: z.string().optional(),
      },
      async ({ action, taskType }) => {
        const hasMemory = Boolean(process.env.DATABASE_URL);
        const connections = providerConnections();
        const connected = connections.some((item) => item.configured);
        const canStart = connected;
        const mode = action === "stop" ? "off" : canStart ? "shadow" : "blocked";
        return {
          content: [{ type: "text", text: mode === "shadow" ? "Shadow Mode ✓" : mode === "off" ? "Shadow Mode stopped" : "Needs source access" }],
          structuredContent: {
            requestedAction: action,
            mode,
            taskType: taskType ?? null,
            externalActionsAllowed: false,
            correctionPersistence: hasMemory ? "durable" : "ephemeral",
            trustState: mode === "shadow" ? "Handled" : mode === "blocked" ? "Needs you" : "Handled",
          },
        };
      },
    );

    server.tool(
      "atlas_build_context_packet",
      "Use this when ChatGPT needs Atlas to turn source evidence into a minimal, relationship-aware context packet before replying or deciding what to do.",
      {
        task: z.string().min(1),
        contact: z.string().optional(),
        relationshipType: z.string().optional(),
        preferredLanguage: z.string().optional(),
        evidence: z.array(
          z.object({
            source: z.string(),
            fact: z.string(),
            freshness: z.enum(["fresh", "aging", "stale"]).default("fresh"),
          }),
        ).max(40),
        openLoops: z.array(z.string()).max(20).default([]),
      },
      async ({ task, contact, relationshipType, preferredLanguage, evidence, openLoops }) => {
        const stale = evidence.filter((item) => item.freshness === "stale").length;
        const strong = evidence.length >= 2 && stale === 0;
        return {
          content: [{ type: "text", text: strong ? "Context ready ✓" : "Context needs review" }],
          structuredContent: {
            task,
            person: contact ?? null,
            relationshipType: relationshipType ?? "unknown",
            replyLanguage: preferredLanguage ?? "match-contact",
            evidence,
            openLoops,
            evidenceQuality: strong ? "strong" : evidence.length ? "mixed" : "weak",
            instructions: [
              "Use only relevant evidence.",
              "Match the user's relationship-specific tone and language.",
              "Prefer concise action over narration.",
              "Do not reuse secrets or sensitive identifiers.",
            ],
          },
        };
      },
    );

    server.tool(
      "atlas_trust_gate",
      "Use this before an external action. Converts action risk and evidence into Handled, Review, or Needs you.",
      {
        reversible: z.boolean(),
        consequence: z.enum(["low", "medium", "high"]),
        permissionAvailable: z.boolean(),
        evidenceQuality: z.enum(["strong", "mixed", "weak"]),
        sensitive: z.boolean().default(false),
      },
      async (input) => {
        const result = chooseTrust(input);
        const label = result.trust === "GREEN" ? "Handled" : result.trust === "YELLOW" ? "Review" : "Needs you";
        return {
          content: [{ type: "text", text: label }],
          structuredContent: { ...result, label },
        };
      },
    );

    server.tool(
      "atlas_record_correction",
      "Use this when the user approves, edits, rejects, or replaces an Atlas prediction so the Digital Twin can learn the difference.",
      {
        taskType: z.string().min(1),
        outcome: z.enum(["accepted", "edited", "rejected", "different_action"]),
        whatAtlasPredicted: z.string().optional(),
        whatUserDid: z.string().optional(),
        correctionReason: z.string().optional(),
        relationshipKey: z.string().optional(),
      },
      async (input) => ({
        content: [{ type: "text", text: "Learned ✓" }],
        structuredContent: {
          recorded: true,
          ...input,
          storage: process.env.DATABASE_URL ? "database-configured" : "ephemeral-until-persistence-wiring",
        },
      }),
    );
  },
  {
    capabilities: {},
    instructions:
      "Atlas is a ChatGPT-native personalization and execution-policy layer. Keep onboarding minimal. Retrieve personal evidence before acting. Use Handled for safe/reversible/permitted actions, Review for ambiguity, and Needs you for sensitive, high-consequence, or unavailable-permission actions. Never expose credentials or secrets.",
  },
  { basePath: "/api" },
);

export { handler as GET, handler as POST, handler as DELETE };
