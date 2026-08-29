import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import {
  atlasTenantRest,
  tenantFromToolContext,
  tokenFromToolContext,
  verifyAtlasMcpToken,
} from "../../../../lib/atlas-chatgpt-auth";

const trustState = z.enum(["Handled", "Review", "Needs you"]);
const money = z.number().nullable();
const baseOutput = z.object({ ok: z.boolean(), trustState }).passthrough();
const opportunityOutput = baseOutput.extend({
  opportunities: z.array(z.object({
    id: z.string(), person_company: z.string().nullable().optional(), category: z.string(), opportunity: z.string().nullable().optional(),
    priority: z.string().nullable().optional(), master_score: z.number().nullable().optional(), estimated_value: money.optional(),
    close_probability: money.optional(), expected_economic_value: money.optional(), economic_currency: z.string().nullable().optional(),
    economic_priority: money.optional(), income_stream: z.string().nullable().optional(), next_action: z.string().nullable().optional(),
    deadline: z.string().nullable().optional(), lifecycle_stage: z.string().nullable().optional(),
  }).passthrough()),
}).passthrough();
const relationshipOutput = baseOutput.extend({ relationships: z.array(z.record(z.string(), z.unknown())) }).passthrough();

function needsWorkspace() {
  return {
    content: [{ type: "text" as const, text: "Atlas workspace setup is required." }],
    structuredContent: { ok: false, error: "workspace-required", trustState: "Needs you" as const },
  };
}

function auth(ctx: any) {
  const tenant = tenantFromToolContext(ctx);
  const token = tokenFromToolContext(ctx);
  if (!tenant?.userKey || !token) return null;
  return { tenant, token };
}

const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const privateWrite = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false };

const mcpHandler = createMcpHandler((server) => {
  server.registerTool("atlas_command_center", {
    title: "Atlas Command Center",
    description: "Use this when the user wants the few highest-value signals that deserve attention now. Reads only the authenticated user's Atlas workspace and ranks economic opportunities and relationships without exposing noise.",
    inputSchema: z.object({ limit: z.number().int().min(1).max(10).default(5) }),
    outputSchema: baseOutput.extend({ opportunities: z.array(z.record(z.string(), z.unknown())), relationships: z.array(z.record(z.string(), z.unknown())), queue: z.array(z.record(z.string(), z.unknown())) }),
    annotations: readOnly,
  }, async ({ limit }, ctx: any) => {
    const a = auth(ctx); if (!a) return needsWorkspace();
    const [opps, relationships, queue] = await Promise.all([
      atlasTenantRest(a.token, `atlas_opportunities?select=id,person_company,category,opportunity,priority,master_score,estimated_value,close_probability,expected_economic_value,economic_currency,economic_priority,income_stream,next_action,deadline,lifecycle_stage,action_risk,updated_at&status=eq.open&order=economic_priority.desc.nullslast,master_score.desc&limit=${limit}`),
      atlasTenantRest(a.token, `atlas_relationships?select=id,person_name,company_name,relationship_type,relationship_score,relationship_momentum,economic_potential,probability,expected_value,attention_efficiency,relationship_priority,recommended_action,next_touch_at,status&status=in.(active,dormant)&order=relationship_priority.desc.nullslast&limit=${limit}`),
      atlasTenantRest(a.token, `atlas_actions?select=id,action_type,description,decision,status,confidence,risk_level,requires_approval,connector,scheduled_for,created_at&status=in.(queued,awaiting_approval,verification_pending)&order=created_at.asc&limit=${limit}`),
    ]);
    const ok = opps.ok && relationships.ok && queue.ok;
    return {
      content: [{ type: "text", text: ok ? "Atlas Command Center ready" : "Atlas Command Center needs review" }],
      structuredContent: { ok, workspace: a.tenant.workspaceName, autonomyLevel: a.tenant.autonomyLevel, executionEnabled: a.tenant.executionEnabled, killSwitch: a.tenant.killSwitch, opportunities: opps.data ?? [], relationships: relationships.data ?? [], queue: queue.data ?? [], trustState: ok ? "Handled" : "Review" },
    };
  });

  server.registerTool("atlas_opportunities", {
    title: "Atlas Opportunities",
    description: "Use this when the user wants ranked revenue, career, asset, cost-saving, partnership, or other economic opportunities from their Atlas workspace.",
    inputSchema: z.object({ limit: z.number().int().min(1).max(25).default(10), category: z.string().max(80).optional() }),
    outputSchema: opportunityOutput,
    annotations: readOnly,
  }, async ({ limit, category }, ctx: any) => {
    const a = auth(ctx); if (!a) return needsWorkspace();
    const categoryFilter = category ? `&category=eq.${encodeURIComponent(category)}` : "";
    const result = await atlasTenantRest(a.token, `atlas_opportunities?select=id,person_company,category,opportunity,priority,master_score,estimated_value,close_probability,expected_economic_value,economic_currency,economic_priority,income_stream,next_action,deadline,lifecycle_stage&status=eq.open${categoryFilter}&order=economic_priority.desc.nullslast,master_score.desc&limit=${limit}`);
    return { content: [{ type: "text", text: result.ok ? "Ranked opportunities ready" : "Opportunity read failed" }], structuredContent: { ok: result.ok, opportunities: result.data ?? [], error: result.error, trustState: result.ok ? "Handled" : "Needs you" } };
  });

  server.registerTool("atlas_relationships", {
    title: "Atlas Relationship Equity",
    description: "Use this when the user wants economically important relationships, dormant relationship opportunities, or the best next relationship move.",
    inputSchema: z.object({ limit: z.number().int().min(1).max(25).default(10) }),
    outputSchema: relationshipOutput,
    annotations: readOnly,
  }, async ({ limit }, ctx: any) => {
    const a = auth(ctx); if (!a) return needsWorkspace();
    const result = await atlasTenantRest(a.token, `atlas_relationships?select=*&status=in.(active,dormant)&order=relationship_priority.desc.nullslast&limit=${limit}`);
    return { content: [{ type: "text", text: result.ok ? "Relationship equity ready" : "Relationship read failed" }], structuredContent: { ok: result.ok, relationships: result.data ?? [], error: result.error, trustState: result.ok ? "Handled" : "Needs you" } };
  });

  server.registerTool("atlas_economic_graph", {
    title: "Atlas Economic Graph",
    description: "Use this when the user wants to understand which people, companies, assets, income streams, actions, and outcomes are creating economic value.",
    inputSchema: z.object({ limit: z.number().int().min(1).max(50).default(25) }),
    outputSchema: baseOutput.extend({ nodes: z.array(z.record(z.string(), z.unknown())), edges: z.array(z.record(z.string(), z.unknown())), valueEvents: z.array(z.record(z.string(), z.unknown())) }),
    annotations: readOnly,
  }, async ({ limit }, ctx: any) => {
    const a = auth(ctx); if (!a) return needsWorkspace();
    const [nodes, edges, events] = await Promise.all([
      atlasTenantRest(a.token, `atlas_economic_nodes?select=*&order=updated_at.desc&limit=${limit}`),
      atlasTenantRest(a.token, `atlas_economic_edges?select=*&order=created_at.desc&limit=${limit}`),
      atlasTenantRest(a.token, `atlas_economic_value_events?select=*&order=occurred_at.desc&limit=${limit}`),
    ]);
    const ok = nodes.ok && edges.ok && events.ok;
    return { content: [{ type: "text", text: ok ? "Economic Graph ready" : "Economic Graph needs review" }], structuredContent: { ok, nodes: nodes.data ?? [], edges: edges.data ?? [], valueEvents: events.data ?? [], trustState: ok ? "Handled" : "Review" } };
  });

  server.registerTool("atlas_record_opportunity", {
    title: "Record Atlas Opportunity",
    description: "Use this when a meaningful opportunity has been identified and should become durable Atlas state. This writes only to the authenticated user's private Atlas workspace; it does not contact any person or external business.",
    inputSchema: z.object({
      externalKey: z.string().max(240).optional(), personCompany: z.string().max(240).optional(), category: z.string().min(1).max(80),
      opportunity: z.string().min(1).max(1500), estimatedValue: z.number().min(0).optional(), currency: z.string().min(3).max(8).default("CAD"),
      closeProbability: z.number().min(0).max(1).default(0), estimatedHumanMinutes: z.number().int().min(0).max(1440).default(5),
      incomeStream: z.string().max(120).optional(), sourceAsset: z.string().max(240).optional(), nextAction: z.string().max(1000).optional(), deadline: z.string().optional(),
    }),
    outputSchema: baseOutput.extend({ opportunity: z.record(z.string(), z.unknown()).nullable() }),
    annotations: privateWrite,
  }, async (input, ctx: any) => {
    const a = auth(ctx); if (!a) return needsWorkspace();
    const expected = (input.estimatedValue ?? 0) * input.closeProbability;
    const row = { user_key: a.tenant.userKey, external_key: input.externalKey ?? null, person_company: input.personCompany ?? null, category: input.category, opportunity: input.opportunity, estimated_value: input.estimatedValue ?? null, estimated_value_currency: input.currency, economic_value: input.estimatedValue ?? null, economic_currency: input.currency, close_probability: input.closeProbability, expected_value: expected, expected_economic_value: expected, estimated_human_minutes: input.estimatedHumanMinutes, income_stream: input.incomeStream ?? null, source_asset: input.sourceAsset ?? null, next_action: input.nextAction ?? null, deadline: input.deadline ?? null, lifecycle_stage: "detected", owner: "atlas", status: "open" };
    const result = await atlasTenantRest(a.token, "atlas_opportunities", { method: "POST", body: JSON.stringify(row) });
    return { content: [{ type: "text", text: result.ok ? "Opportunity recorded" : "Opportunity write failed" }], structuredContent: { ok: result.ok, opportunity: Array.isArray(result.data) ? result.data[0] ?? null : result.data, error: result.error, trustState: result.ok ? "Handled" : "Needs you" } };
  });

  server.registerTool("atlas_queue_action", {
    title: "Queue Atlas Action",
    description: "Use this when Atlas has a bounded next action that should enter the authenticated user's private execution queue. This tool does not itself send email, publish content, move money, sign contracts, or change an external system.",
    inputSchema: z.object({ opportunityId: z.string().uuid().optional(), actionType: z.string().min(1).max(80), description: z.string().min(1).max(1200), confidence: z.number().min(0).max(1), riskLevel: z.enum(["low", "medium"]).default("low"), reversible: z.boolean().default(true), requiresApproval: z.boolean().default(false), connector: z.enum(["gmail", "calendar", "contacts", "drive", "notion", "hubspot"]).optional(), payload: z.record(z.string(), z.unknown()).default({}) }),
    outputSchema: baseOutput.extend({ action: z.record(z.string(), z.unknown()).nullable() }),
    annotations: privateWrite,
  }, async (input, ctx: any) => {
    const a = auth(ctx); if (!a) return needsWorkspace();
    const requiresApproval = input.requiresApproval || input.riskLevel === "medium" || !a.tenant.executionEnabled || a.tenant.killSwitch;
    const decision = requiresApproval ? "recommend" : "execute";
    const status = requiresApproval ? "awaiting_approval" : "queued";
    const row = { user_key: a.tenant.userKey, opportunity_id: input.opportunityId ?? null, action_type: input.actionType, description: input.description, decision, status, confidence: input.confidence, risk_level: input.riskLevel, reversible: input.reversible, requires_approval: requiresApproval, connector: input.connector ?? null, payload: input.payload };
    const result = await atlasTenantRest(a.token, "atlas_actions", { method: "POST", body: JSON.stringify(row) });
    return { content: [{ type: "text", text: result.ok ? (requiresApproval ? "Action queued for review" : "Action queued for execution") : "Action queue failed" }], structuredContent: { ok: result.ok, action: Array.isArray(result.data) ? result.data[0] ?? null : result.data, requiresApproval, trustState: result.ok ? (requiresApproval ? "Review" : "Handled") : "Needs you", error: result.error } };
  });

  server.registerTool("atlas_record_outcome", {
    title: "Record Atlas Economic Outcome",
    description: "Use this when revenue, savings, commission, compensation, cost, or asset value is verified and should replace estimates with an actual economic outcome in the authenticated user's workspace.",
    inputSchema: z.object({ opportunityId: z.string().uuid().optional(), actionId: z.string().uuid().optional(), kind: z.enum(["revenue", "savings", "cost", "commission", "compensation", "asset_value"]), amount: z.number(), currency: z.string().min(3).max(8).default("CAD"), incomeStream: z.string().max(120).optional(), sourceAsset: z.string().max(240).optional(), evidence: z.record(z.string(), z.unknown()).default({}), occurredAt: z.string().optional() }),
    outputSchema: baseOutput.extend({ event: z.record(z.string(), z.unknown()).nullable() }),
    annotations: privateWrite,
  }, async (input, ctx: any) => {
    const a = auth(ctx); if (!a) return needsWorkspace();
    const row = { user_key: a.tenant.userKey, opportunity_id: input.opportunityId ?? null, action_id: input.actionId ?? null, kind: input.kind, amount: input.amount, currency: input.currency, income_stream: input.incomeStream ?? null, source_asset: input.sourceAsset ?? null, evidence: input.evidence, occurred_at: input.occurredAt ?? new Date().toISOString() };
    const result = await atlasTenantRest(a.token, "atlas_economic_value_events", { method: "POST", body: JSON.stringify(row) });
    if (result.ok && input.opportunityId && input.kind !== "cost") {
      await atlasTenantRest(a.token, `atlas_opportunities?id=eq.${encodeURIComponent(input.opportunityId)}`, { method: "PATCH", body: JSON.stringify({ actual_economic_value: input.amount, economic_currency: input.currency, realized_at: input.occurredAt ?? new Date().toISOString(), lifecycle_stage: "verified", last_verified_at: new Date().toISOString() }) });
    }
    return { content: [{ type: "text", text: result.ok ? "Economic outcome recorded" : "Outcome write failed" }], structuredContent: { ok: result.ok, event: Array.isArray(result.data) ? result.data[0] ?? null : result.data, error: result.error, trustState: result.ok ? "Handled" : "Needs you" } };
  });

  server.registerTool("atlas_record_correction", {
    title: "Teach Atlas a Correction",
    description: "Use this when the user accepts, edits, rejects, or chooses a different action so Atlas can durably learn in that user's private workspace.",
    inputSchema: z.object({ taskType: z.string().min(1).max(120), outcome: z.enum(["accepted", "edited", "rejected", "different_action"]), predicted: z.string().max(1200).optional(), actual: z.string().max(1200).optional(), reason: z.string().max(1200).optional(), relationshipKey: z.string().max(240).optional() }),
    outputSchema: baseOutput.extend({ correction: z.record(z.string(), z.unknown()).nullable() }),
    annotations: privateWrite,
  }, async (input, ctx: any) => {
    const a = auth(ctx); if (!a) return needsWorkspace();
    const row = { user_key: a.tenant.userKey, task_type: input.taskType, outcome: input.outcome, predicted: input.predicted ?? null, actual: input.actual ?? null, reason: input.reason ?? null, relationship_key: input.relationshipKey ?? null };
    const result = await atlasTenantRest(a.token, "atlas_corrections", { method: "POST", body: JSON.stringify(row) });
    return { content: [{ type: "text", text: result.ok ? "Correction learned" : "Correction write failed" }], structuredContent: { ok: result.ok, correction: Array.isArray(result.data) ? result.data[0] ?? null : result.data, error: result.error, trustState: result.ok ? "Handled" : "Needs you" } };
  });
});

const handler = withMcpAuth(mcpHandler, verifyAtlasMcpToken, {
  required: true,
  resourceMetadataPath: "/.well-known/oauth-protected-resource",
});

export { handler as GET, handler as POST };
