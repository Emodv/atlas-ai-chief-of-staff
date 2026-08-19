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
type ModeState = "off" | "learning" | "shadow";

type AtlasRuntime = {
  mode: ModeState;
  modeStartedAt: string | null;
  focus: string[];
  corrections: Array<{
    at: string;
    taskType: string;
    outcome: "accepted" | "edited" | "rejected" | "different_action";
    whatAtlasPredicted?: string;
    whatUserDid?: string;
    correctionReason?: string;
    relationshipKey?: string;
  }>;
};

const runtimeGlobal = globalThis as typeof globalThis & { __atlasRuntime?: AtlasRuntime };

function runtime(): AtlasRuntime {
  if (!runtimeGlobal.__atlasRuntime) {
    runtimeGlobal.__atlasRuntime = {
      mode: "off",
      modeStartedAt: null,
      focus: [],
      corrections: [],
    };
  }
  return runtimeGlobal.__atlasRuntime;
}

function envEnabled(name: string): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on" || value === "connected" || value === "ready";
}

function providerConnections() {
  return providers.map((provider) => ({
    provider,
    configured: envEnabled(`ATLAS_${provider.toUpperCase()}_CONNECTED`),
  }));
}

function durableMemoryReady(): boolean {
  return Boolean(process.env.DATABASE_URL) && envEnabled("ATLAS_DURABLE_MEMORY_READY");
}

function deploymentBlockers() {
  const connections = providerConnections();
  const blockers: string[] = [];
  if (!connections.some((item) => item.configured)) blockers.push("connect-at-least-one-source");
  if (!durableMemoryReady()) blockers.push("wire-durable-memory");
  return blockers;
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
        ? "Sensitive context requires the user."
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

const readOnly = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

const internalWrite = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false,
};

const handler = createMcpHandler((server) => {
  server.registerTool(
    "atlas_status",
    {
      title: "Atlas Status",
      description: "Verify Atlas availability, version, operating mode, source readiness, persistence, and the next blocker.",
      inputSchema: z.object({}),
      annotations: readOnly,
    },
    async () => {
      const connections = providerConnections();
      const state = runtime();
      const blockers = deploymentBlockers();
      return {
        content: [{ type: "text", text: "Atlas online ✓" }],
        structuredContent: {
          status: "online",
          version: "2.3",
          interface: "chatgpt-app-mcp",
          principle: "signal-over-noise",
          defaultUx: "silent-by-default",
          operatingMode: state.mode,
          modeStartedAt: state.modeStartedAt,
          durableMemory: durableMemoryReady(),
          runtimeStatePersistence: durableMemoryReady() ? "durable-adapter-enabled" : "warm-runtime-only",
          connectedSources: connections.filter((item) => item.configured).length,
          expectedSources: connections.length,
          blockers,
          trustState: blockers.length ? "Review" : "Handled",
        },
      };
    },
  );

  server.registerTool(
    "atlas_connection_health",
    {
      title: "Atlas Connection Health",
      description: "Report every Atlas source connection and one next blocker, without claiming environment variables are OAuth connections.",
      inputSchema: z.object({}),
      annotations: readOnly,
    },
    async () => {
      const connections = providerConnections();
      const missing = connections.filter((item) => !item.configured);
      const nextBlocker = missing[0]?.provider ?? (!durableMemoryReady() ? "durable-memory" : null);
      return {
        content: [{ type: "text", text: nextBlocker ? `Needs setup: ${nextBlocker}` : "Connections ✓" }],
        structuredContent: {
          connections,
          allSourcesReady: missing.length === 0,
          allReady: missing.length === 0 && durableMemoryReady(),
          nextBlocker,
          durableMemory: durableMemoryReady(),
          trustState: nextBlocker ? "Needs you" : "Handled",
        },
      };
    },
  );

  server.registerTool(
    "atlas_source_status",
    {
      title: "Atlas Source Status",
      description: "Check one Atlas source before a source-specific workflow.",
      inputSchema: z.object({ provider: z.enum(providers) }),
      annotations: readOnly,
    },
    async ({ provider }: { provider: Provider }) => {
      const configured = envEnabled(`ATLAS_${provider.toUpperCase()}_CONNECTED`);
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

  server.registerTool(
    "atlas_learning_mode",
    {
      title: "Atlas Learning Mode",
      description: "Start, inspect, or stop Learning Mode. It studies tone, language, relationships, routines, preferences, and decisions without external actions.",
      inputSchema: z.object({
        action: z.enum(["start", "status", "stop"]).default("status"),
        focus: z.array(z.enum(["tone", "language", "relationships", "routines", "preferences", "decisions"])).optional(),
      }),
      annotations: internalWrite,
    },
    async ({ action, focus }) => {
      const state = runtime();
      const connected = providerConnections().filter((item) => item.configured).map((item) => item.provider);

      if (action === "start") {
        if (!connected.length) {
          return {
            content: [{ type: "text", text: "Needs source access" }],
            structuredContent: {
              requestedAction: action,
              mode: "blocked",
              connectedSources: connected,
              autonomousActionsAllowed: false,
              trustState: "Needs you",
              nextBlocker: "connect-source",
            },
          };
        }
        state.mode = "learning";
        state.modeStartedAt = new Date().toISOString();
        state.focus = focus ?? ["tone", "language", "relationships", "routines", "preferences", "decisions"];
      } else if (action === "stop" && state.mode === "learning") {
        state.mode = "off";
        state.modeStartedAt = null;
      }

      return {
        content: [{ type: "text", text: state.mode === "learning" ? "Learning Mode ✓" : "Learning Mode off" }],
        structuredContent: {
          requestedAction: action,
          mode: state.mode,
          modeStartedAt: state.modeStartedAt,
          connectedSources: connected,
          focus: state.focus,
          autonomousActionsAllowed: false,
          statePersistence: durableMemoryReady() ? "durable-adapter-enabled" : "warm-runtime-only",
          trustState: state.mode === "learning" ? "Handled" : "Review",
        },
      };
    },
  );

  server.registerTool(
    "atlas_shadow_mode",
    {
      title: "Atlas Shadow Mode",
      description: "Start, inspect, or stop Shadow Mode. Atlas predicts the user's action but performs no external action.",
      inputSchema: z.object({
        action: z.enum(["start", "status", "stop"]).default("status"),
        taskType: z.string().optional(),
      }),
      annotations: internalWrite,
    },
    async ({ action, taskType }) => {
      const state = runtime();
      const connected = providerConnections().some((item) => item.configured);

      if (action === "start") {
        if (!connected) {
          return {
            content: [{ type: "text", text: "Needs source access" }],
            structuredContent: {
              requestedAction: action,
              mode: "blocked",
              externalActionsAllowed: false,
              trustState: "Needs you",
              nextBlocker: "connect-source",
            },
          };
        }
        state.mode = "shadow";
        state.modeStartedAt = new Date().toISOString();
      } else if (action === "stop" && state.mode === "shadow") {
        state.mode = "off";
        state.modeStartedAt = null;
      }

      return {
        content: [{ type: "text", text: state.mode === "shadow" ? "Shadow Mode ✓" : "Shadow Mode off" }],
        structuredContent: {
          requestedAction: action,
          mode: state.mode,
          modeStartedAt: state.modeStartedAt,
          taskType: taskType ?? null,
          externalActionsAllowed: false,
          correctionPersistence: durableMemoryReady() ? "durable-adapter-enabled" : "warm-runtime-only",
          correctionsInRuntime: state.corrections.length,
          trustState: state.mode === "shadow" ? "Handled" : "Review",
        },
      };
    },
  );

  server.registerTool(
    "atlas_build_context_packet",
    {
      title: "Build Atlas Context",
      description: "Turn source evidence into a concise, relationship-aware context packet before ChatGPT replies or decides what to do.",
      inputSchema: z.object({
        task: z.string().min(1),
        contact: z.string().optional(),
        relationshipType: z.string().optional(),
        preferredLanguage: z.string().optional(),
        evidence: z.array(z.object({
          source: z.string(),
          fact: z.string(),
          freshness: z.enum(["fresh", "aging", "stale"]).default("fresh"),
        })).max(40),
        openLoops: z.array(z.string()).max(20).default([]),
      }),
      annotations: readOnly,
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

  server.registerTool(
    "atlas_trust_gate",
    {
      title: "Atlas Trust Gate",
      description: "Run before an external action. Converts action risk and evidence into Handled, Review, or Needs you.",
      inputSchema: z.object({
        reversible: z.boolean(),
        consequence: z.enum(["low", "medium", "high"]),
        permissionAvailable: z.boolean(),
        evidenceQuality: z.enum(["strong", "mixed", "weak"]),
        sensitive: z.boolean().default(false),
      }),
      annotations: readOnly,
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

  server.registerTool(
    "atlas_record_correction",
    {
      title: "Record Atlas Correction",
      description: "Record approve/edit/reject/different-action feedback so Shadow Mode can learn within the running service and report whether persistence is durable.",
      inputSchema: z.object({
        taskType: z.string().min(1),
        outcome: z.enum(["accepted", "edited", "rejected", "different_action"]),
        whatAtlasPredicted: z.string().optional(),
        whatUserDid: z.string().optional(),
        correctionReason: z.string().optional(),
        relationshipKey: z.string().optional(),
      }),
      annotations: internalWrite,
    },
    async (input) => {
      const state = runtime();
      state.corrections.push({ at: new Date().toISOString(), ...input });
      if (state.corrections.length > 100) state.corrections.splice(0, state.corrections.length - 100);
      return {
        content: [{ type: "text", text: "Learned ✓" }],
        structuredContent: {
          recorded: true,
          ...input,
          correctionCount: state.corrections.length,
          storage: durableMemoryReady() ? "durable-adapter-enabled" : "warm-runtime-only",
          trustState: durableMemoryReady() ? "Handled" : "Review",
        },
      };
    },
  );
});

export { handler as GET, handler as POST };
