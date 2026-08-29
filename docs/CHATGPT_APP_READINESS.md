# Atlas ChatGPT App Readiness

Atlas is classified as a **submission-ready, tool-first ChatGPT App** with a decoupled web product. The MCP surface should make Atlas feel like an operating partner, not a passive data connector.

## Product promise

Atlas should help ChatGPT:

- understand the user's durable context,
- identify and score opportunities,
- compress noise into Signal,
- decide what Atlas can handle vs what needs review,
- claim one bounded autonomous action at a time,
- verify the result before closing the loop,
- attribute economic outcomes and attention returned,
- learn from corrections.

## Current MCP tool surface

- `atlas_status`
- `atlas_connection_health`
- `atlas_source_status`
- `atlas_ingest_signals`
- `atlas_update_profile`
- `atlas_profile`
- `atlas_learning_mode`
- `atlas_shadow_mode`
- `atlas_build_context_packet`
- `atlas_decide_opportunity`
- `atlas_execution_queue`
- `atlas_next_action`
- `atlas_complete_action`
- `atlas_fail_action`
- `atlas_trust_gate`
- `atlas_record_correction`

## Submission requirements

Before public submission:

1. Complete per-user MCP OAuth/tenant identity propagation.
2. Keep the legacy shared owner `primary` backend private.
3. Confirm every MCP tool has explicit `readOnlyHint`, `openWorldHint`, and `destructiveHint` annotations matching implementation.
4. Add explicit `outputSchema` definitions to MCP tools so ChatGPT can use structured results more reliably.
5. Keep tool descriptions behavior-first: when to use, what state changes, and what verification is required.
6. Preserve read-after-write verification for action completion.
7. Validate five positive and three negative submission test cases.
8. Run production health, auth, tenant-isolation, queue/idempotency, and failure-retry tests.

## Trust standard

Power comes from bounded authority, not from removing safeguards.

Atlas should take more responsibility where:

- the user granted standing authority,
- the task is bounded,
- permission exists,
- context is fresh,
- the action is reversible or independently verifiable,
- risk is acceptable,
- the result is observable.

Atlas should not silently cross into money movement, investments/trades, contracts, legal/tax/medical decisions, credentials/security, destructive actions, material pricing commitments, guarantees/refunds, or employment acceptance.

## UX standard

The user should experience three states only:

- **Handled** — Atlas completed and verified the work.
- **Review** — Atlas prepared the work and one consequential decision remains.
- **Needs you** — human authority, missing permission, sensitive context, or insufficient evidence blocks execution.

Avoid exposing implementation complexity when a simple trust state is enough.

## Success criteria

A first-class Atlas ChatGPT App should be judged by:

- opportunity value surfaced,
- verified actions completed,
- human minutes returned,
- revenue/savings attributed,
- duplicate action rate,
- correction rate,
- verification failure rate,
- percentage of user work resolved without unnecessary interruption.
