# Atlas — ChatGPT Primary Interface Ship Plan

## Goal
Make ChatGPT the primary conversational interface for Atlas so the owner can ask, in plain language, what matters now and receive a signal-only executive answer backed by Atlas durable context.

## Product rule
Atlas should feel like a real Chief of Staff, not another dashboard.

Default owner experience:

> Atlas, give me my morning briefing.

Response should prioritize:
1. Make money
2. Protect revenue
3. Needs you

Everything else is secondary detail.

## Phase 1 — Verify live path
- Confirm production deployment is healthy.
- Confirm `/api/chatgpt/mcp` is reachable.
- Confirm OAuth protected-resource metadata is reachable.
- Confirm authenticated workspace resolution never falls back to legacy `primary`.
- Confirm the Atlas.Moda Supabase project is active before relying on production OAuth/data.

## Phase 2 — Chief-of-Staff conversational contract
Standardize ChatGPT-facing behavior around four executive intents:
- Morning briefing
- What should I do now?
- Who needs attention?
- Where can I make/protect money?

The command-center output should be terse and structured:

### MAKE MONEY
- highest-value opportunity
- next action
- expected outcome

### PROTECT REVENUE
- highest-risk client/relationship/open loop
- next action

### NEEDS YOU
- only consequential decisions requiring owner approval

Optional detail can live behind tool output fields, not in the default answer.

## Phase 3 — ChatGPT-native activation
- ChatGPT remains the conversation layer.
- Atlas remains durable memory, opportunity engine, trust gate, and action layer.
- OAuth tokens and connector secrets remain server-side.
- Add/keep clear health diagnostics for OAuth and tenant resolution.
- Make failures actionable: tell the user exactly which connection or provider setting is missing.

## Phase 4 — Ship and verify
- Merge changes only after production-safe checks.
- Deploy from GitHub to Vercel.
- Verify production endpoint health.
- Test a real owner prompt end-to-end.
- Record first successful outcome in Atlas.

## Success criteria
Atlas is successful when the owner can open ChatGPT on mobile and say:

> Atlas, give me my morning briefing.

and immediately receive no more than three high-value items:
- one revenue move,
- one risk/protection move,
- one owner-only decision if necessary.

No need to open GitHub, Claude Code, Vercel, or Supabase for daily use.
