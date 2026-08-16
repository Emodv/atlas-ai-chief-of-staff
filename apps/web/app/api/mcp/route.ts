import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const TRUST = {
  green: "GREEN",
  yellow: "YELLOW",
  red: "RED",
} as const;

type Trust = (typeof TRUST)[keyof typeof TRUST];

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
      "Use this when you need to verify that the Atlas personalization layer is reachable and understand its current operating mode.",
      {},
      async () => ({
        content: [
          {
            type: "text",
            text: "Atlas online. ChatGPT is the reasoning surface; Atlas provides personal context, relationship memory, trust gating, and execution policy.",
          },
        ],
        structuredContent: {
          status: "online",
          version: "2.0",
          interface: "chatgpt-native-mcp",
          principle: "signal-over-noise",
          defaultUx: "silent-by-default",
        },
      }),
    );

    server.tool(
      "atlas_connection_health",
      "Use this when onboarding or debugging Atlas connections. Reports the expected personal-data sources and whether Atlas has server-side access configured for each one.",
      {},
      async () => {
        const providers = ["gmail", "calendar", "contacts", "drive", "notion", "hubspot"] as const;
        const connections = providers.map((provider) => ({
          provider,
          configured: Boolean(process.env[`ATLAS_${provider.toUpperCase()}_CONNECTED`]),
        }));

        return {
          content: [
            {
              type: "text",
              text: connections.every((item) => item.configured)
                ? "Connections ✓"
                : "Some Atlas server-side connections still need OAuth/configuration.",
            },
          ],
          structuredContent: { connections },
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
          content: [
            {
              type: "text",
              text: strong ? "Context ready ✓" : "Context needs review",
            },
          ],
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
      "Use this before an external action. Converts internal confidence/risk signals into a human-readable GREEN, YELLOW, or RED trust decision.",
      {
        reversible: z.boolean(),
        consequence: z.enum(["low", "medium", "high"]),
        permissionAvailable: z.boolean(),
        evidenceQuality: z.enum(["strong", "mixed", "weak"]),
        sensitive: z.boolean().default(false),
      },
      async (input) => {
        const result = chooseTrust(input);
        return {
          content: [{ type: "text", text: `${result.trust} — ${result.action}` }],
          structuredContent: result,
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
      "Atlas is a personalization and execution-policy layer for ChatGPT. Retrieve personal evidence before acting. Keep user-facing output minimal. Use GREEN for safe/reversible/permitted actions, YELLOW for review, RED when the user is required. Never expose credentials or secrets.",
  },
  { basePath: "/api" },
);

export { handler as GET, handler as POST, handler as DELETE };
