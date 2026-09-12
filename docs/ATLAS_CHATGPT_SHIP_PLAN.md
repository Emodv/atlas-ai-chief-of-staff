# Atlas ChatGPT Ship Plan

## Objective
Make ChatGPT the primary conversational interface to Atlas so the user can ask for a morning brief, highest-value revenue opportunities, relationship follow-ups, and queued actions without managing Atlas through Claude Code.

## Product rule
Atlas should feel like a Chief of Staff, not another dashboard.

## Primary interaction
The user should be able to say:

- "Atlas, give me my morning briefing."
- "Atlas, what should I do today to make money?"
- "Who should I follow up with today?"
- "What needs my approval?"
- "What opportunities am I neglecting?"

## Brief contract
The default Atlas brief should compress the workspace into:

1. **MAKE MONEY** — up to 3 highest-value open opportunities with next actions.
2. **PROTECT REVENUE** — up to 3 relationship or risk signals that may cause churn, missed follow-up, or lost value.
3. **NEEDS YOU** — approvals or blocked actions requiring human judgment.
4. **HANDLED** — bounded work already queued or completed by Atlas.

No raw tables unless the user asks. No more than 7 primary items by default.

## Execution plan

### 1. ChatGPT MCP
- Keep `/api/chatgpt/mcp` as the public tenant-safe surface.
- Add a dedicated `atlas_daily_brief` read-only tool optimized for natural-language Chief-of-Staff use.
- Preserve existing tools for deeper drill-down.

### 2. OAuth
- Keep OAuth bearer auth and tenant resolution fail-closed.
- Production blocker is provider configuration, not application logic.
- Health endpoint must return ready before public ChatGPT activation.

### 3. Vercel
- Deploy from `main` after CI passes.
- Verify `/api/health/oauth-server`, `/.well-known/oauth-protected-resource`, and `/api/chatgpt/mcp`.

### 4. Supabase
- Enable Supabase OAuth 2.1 Server for the Atlas.Moda project.
- Authorization path: `/oauth/consent`.
- Enable dynamic client registration for compatible MCP clients.
- Reactivate Atlas.Moda Supabase project if paused/inactive.

## Definition of shipped
- Production build is READY.
- MCP endpoint responds.
- OAuth discovery endpoint is healthy.
- ChatGPT can authenticate to a tenant-safe Atlas workspace.
- `atlas_daily_brief` returns concise MAKE MONEY / PROTECT REVENUE / NEEDS YOU / HANDLED sections.
- No connector secrets are exposed to chat output.
