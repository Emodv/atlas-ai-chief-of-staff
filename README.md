# Atlas.Moda — AI Chief of Staff and Opportunity Operating System

**Live product:** https://atlas.moda  
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

Examples include research, lead and relationship scoring, reactivation, routine check-ins, basic factual replies, meeting coordination, internal records, CRM hygiene, segmentation, data cleanup, safe content/SEO improvements, meeting briefs, proposal drafts, and other bounded low-risk work when context is current and the result can be verified.

### Atlas prepares aggressively but asks before consequential commitments

Money movement, purchases, investments/trades, contracts, material pricing or discounts, refunds, guarantees, employment acceptance, legal/tax/medical decisions, security/account changes, destructive actions, and other high-consequence commitments remain human-controlled.

The system is intentionally **risk-aware, not risk-avoidant**. It should take appropriate bounded risk where standing authority, evidence, reversibility, and verification justify it.

## ChatGPT App

Atlas exposes a ChatGPT-facing MCP tool surface for status, source readiness, durable learning, context construction, opportunity decisions, execution queue ownership, verification, corrections, and trust gating.

The app is being structured for a production ChatGPT App submission with explicit tool annotations and review test cases. The public MCP surface remains gated until per-user tenant identity is propagated end-to-end; the legacy shared `primary` owner state is never exposed to public users.

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

- `apps/web` — Atlas.Moda web application, authenticated UX, and MCP surface
- `services/api` — decision, opportunity, economic graph, twin, and context engines
- `packages/core` — shared domain types and connector contracts
- `supabase` — persistent economic/opportunity/action data and protected server functions
- `docs` — product, trust, worker, and architecture documentation

## Status

**Atlas.Moda public beta is live at https://atlas.moda.**

The current engineering priority is to complete per-user MCP OAuth/tenant identity propagation, then expose the full Chief-of-Staff tool surface safely as a first-class ChatGPT App.
