# Atlas.Moda — AI Chief of Staff and Opportunity Operating System

**Live product:** https://atlas.moda  
**Public ChatGPT MCP:** https://atlas.moda/api/chatgpt/mcp  
**Use cases:** https://atlas.moda/use-cases  
**Security:** https://atlas.moda/security  
**Privacy:** https://atlas.moda/privacy

Atlas.Moda is designed to be more than an assistant. It is a persistent AI Chief of Staff and opportunity operating system that turns connected work, relationships, assets, and business context into prioritized decisions and bounded action.

## Product mandate

**Maximum economic output with minimum necessary human attention.**

Atlas is built to continuously:

1. observe connected systems,
2. identify signal and latent opportunities,
3. estimate value, probability, speed, effort, risk, and leverage,
4. decide the highest safe action level,
5. execute bounded work when standing authority permits,
6. independently verify outcomes,
7. attribute realized revenue, savings, or attention returned,
8. learn from corrections and results.

The goal is not more notifications or more tasks. The goal is better allocation of attention, stronger follow-through, protected relationships, and measurable economic outcomes.

## Core systems

- **Digital Twin** — evidence-backed preferences, communication style, operating rules, and decision patterns.
- **Durable Brain** — persistent context separated from transient session state.
- **Relationship Graph** — people, companies, warmth, open loops, commitments, and relationship equity.
- **Economic Graph** — people, companies, assets, income streams, opportunities, actions, outcomes, revenue, savings, and realized value.
- **Opportunity Engine** — Detect → Rank → Assign → Act → Verify → Close → Learn.
- **Continuous Worker** — Observe → Understand → Score → Claim → Execute → Verify → Learn.
- **Trust Engine** — Handled / Review / Needs you, with standing-rule authority for bounded work.
- **Action Layer** — connector-specific execution with idempotency, verification, retries, and dead-letter handling.
- **Contact Intelligence** — large prospect datasets become scored business assets rather than raw lists.

## Autonomy philosophy

Atlas should be powerful enough to make a material difference while remaining trustworthy.

### Atlas can handle under standing authority

Examples include research, lead and relationship scoring, reactivation, routine check-ins, basic factual replies, meeting coordination, internal records, CRM hygiene, segmentation, data cleanup, safe content/SEO improvements, meeting briefs, proposal preparation, and other bounded low-risk work when context is current and the result can be verified.

### Atlas prepares aggressively but asks before consequential commitments

Money movement, purchases, investments/trades, contracts, material pricing or discounts, refunds, guarantees, employment acceptance, legal/tax/medical decisions, security/account changes, destructive actions, and other high-consequence commitments remain human-controlled.

The system is intentionally **risk-aware, not risk-avoidant**. It should take appropriate bounded risk where standing authority, evidence, reversibility, and verification justify it.

## ChatGPT App

Atlas now has a dedicated public, tenant-safe ChatGPT MCP surface at `https://atlas.moda/api/chatgpt/mcp`.

The public surface is separate from the older private owner MCP. It uses OAuth bearer authentication, resolves the authenticated Supabase user to exactly one Atlas workspace, relies on row-level security for every database operation, and never falls back to the legacy `primary` workspace.

Public ChatGPT tools are intentionally focused on Chief-of-Staff value:

- `atlas_command_center` — Signal-only top opportunities, relationships, and queue state.
- `atlas_opportunities` — ranked economic opportunities.
- `atlas_relationships` — relationship equity and next moves.
- `atlas_economic_graph` — assets, income streams, opportunities, actions, outcomes, and value events.
- `atlas_record_opportunity` — durable private opportunity creation.
- `atlas_queue_action` — bounded private action queueing without claiming external execution.
- `atlas_record_outcome` — realized revenue/savings/value attribution.
- `atlas_record_correction` — durable learning from user feedback.

Every public tool declares explicit read/write/destructive/open-world annotations and a formal output schema. OAuth protected-resource metadata is published at `/.well-known/oauth-protected-resource`.

The legacy `/api/mcp` route remains owner-only and gated because its historical edge functions use `user_key='primary'`. It is not used for the public ChatGPT App.

## OAuth readiness

The Atlas application side includes:

- OAuth 2.1 protected-resource discovery,
- authenticated tenant resolution,
- consent UI at `/oauth/consent`,
- approve/deny handling,
- login return-path preservation,
- an OAuth discovery health probe at `/api/health/oauth-server`.

Supabase Auth is the authorization server. Its OAuth 2.1 Server feature must be enabled in the Supabase project with the Atlas authorization path set to `/oauth/consent`; dynamic client registration should be enabled for compatible MCP clients. This is a provider-console configuration, not an application-code secret.

## Public beta

The public onboarding flow starts with Google OAuth and requests read-only access to supported Workspace sources:

- Gmail
- Google Calendar
- Google Contacts
- Google Drive
- Google Docs
- Google Sheets

Public user workspaces are isolated with Supabase authentication and row-level security.

## Search and AI discoverability

Atlas.Moda publishes:

- XML sitemap: https://atlas.moda/sitemap.xml
- robots policy: https://atlas.moda/robots.txt
- LLM context file: https://atlas.moda/llms.txt
- structured Schema.org data on public landing pages
- canonical URLs and social metadata

## Repository

- `apps/web` — Atlas.Moda web application, authenticated UX, OAuth consent, and public/private MCP surfaces
- `services/api` — decision, opportunity, economic graph, twin, and context engines
- `packages/core` — shared domain types and connector contracts
- `supabase` — persistent economic/opportunity/action data and protected server functions
- `docs` — product, trust, worker, ChatGPT App, and architecture documentation

## Status

**Atlas.Moda public beta and tenant-safe ChatGPT MCP code are deployed at https://atlas.moda.**

The remaining provider-level activation is Supabase OAuth 2.1 Server configuration and, for public directory submission, the normal ChatGPT plugin review/domain-verification flow.
