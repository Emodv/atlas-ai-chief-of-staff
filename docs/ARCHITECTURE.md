# Atlas V2 Architecture

## Product boundary

ChatGPT is the primary conversational and reasoning surface. Atlas is the durable personalization + memory + relationship + trust + execution layer around it.

`ChatGPT ↔ Atlas ↔ connected tools`

Atlas should make ChatGPT feel like it has worked with the user for years without pretending the GitHub repository itself can execute inside a chat. Production integration should be exposed through a ChatGPT-compatible app / remote MCP surface and OAuth-backed connectors.

## Core loop

`Connect → Learn → Retrieve → Reason → Trust-gate → Act → Observe result → Learn`

### Brain-first rule

Before reasoning about a person, company, commitment, or recurring situation, Atlas should query durable memory first. External web lookup is enrichment, not a substitute for the user's own history.

This is adapted from GBrain's brain-agent loop: durable context should be consulted before the agent behaves as if every conversation starts from zero.

## Domain model

### User Twin
Represents how the user tends to communicate and decide:

- brevity / verbosity
- warmth / formality / directness
- language and code-switching patterns
- vocabulary and recurring phrases
- commercial judgment
- recurring decision rules
- scheduling/follow-up behavior
- personal boundaries and do-not-do patterns
- correction history

### Relationship Graph
Represents how the twin changes by person/company/context:

- cross-source identity
- relationship type
- warmth / formality
- languages used with this contact
- last meaningful interaction
- communication cadence
- open loops and commitments
- client/prospect/friend/family/vendor status
- important milestones
- whether human presence is more valuable than automation
- typed edges among people, companies, meetings, documents, and commitments

### Durable Brain
Stores evidence-backed knowledge that should survive sessions:

- people and company facts learned from connected sources
- relationship history
- meetings and decisions
- commitments and promises
- durable user preferences
- synthesized notes derived from multiple sources
- source references, freshness timestamps, and uncertainty/gap flags

GBrain-inspired behavior:

- synthesis over raw search
- typed graph links
- source/citation retention
- stale-context and missing-context detection
- periodic consolidation/deduplication

### Operational State
Short-lived workflow state that should not pollute durable knowledge:

- pending action proposals
- retries
- sync cursors
- task progress
- temporary reminders
- approvals awaiting the user

### Session Context
The minimum context ChatGPT needs for the current conversation/action. It is assembled on demand from the Twin, Relationship Graph, Durable Brain, and current source material.

## Context Engine

Build a compact evidence packet, not a giant transcript dump:

1. identify entities in the current request/event,
2. retrieve relationship + durable memory first,
3. retrieve the most relevant source evidence,
4. detect stale or missing information,
5. add current external/public context only when useful,
6. return a synthesized packet to ChatGPT.

Every material inference should be traceable to evidence. If Atlas lacks current context, it should expose that gap instead of hallucinating continuity.

## Trust Engine

Numeric confidence may exist internally for evaluation, but users do not see arbitrary percentages.

### Green — Handled
Atlas can execute when all are true:

- internal confidence is strong,
- consequence is low,
- action is reversible or safely recoverable,
- required permission exists,
- no sensitive/high-risk policy blocks apply.

### Yellow — Review
Atlas can recommend or draft when:

- likely answer/action is known,
- some ambiguity remains,
- execution would benefit from human review,
- or action has moderate consequence.

### Red — Needs you
Atlas stops when:

- context is materially missing,
- the action is consequential/irreversible,
- sensitive financial/legal/medical/security/intimate judgment is involved,
- identity or intent is ambiguous,
- or policy explicitly blocks autonomy.

The UI should show the bucket, not a probability. A short `Why?` explanation is available on demand.

## Interaction model

**One screen. Silent by default. Explain on demand.**

Default chief-of-staff output is an exception table:

- done
- review
- needs you

Long reasoning is hidden behind an information affordance. Atlas should not create a new stream of cognitive noise while claiming to remove noise.

## Connector contract

Every connector should eventually implement:

- `authorize()`
- `health()`
- `sync(cursor)`
- `normalize(raw_event)`
- `read(resource_id)`
- `act(action)` where the provider permits writes

Initial targets: Gmail, Google Calendar, Google Contacts, Google Drive, Notion, HubSpot.

ChatGPT-facing Atlas tools should expose narrow, auditable operations such as:

- `get_context(entity_or_task)`
- `get_twin_profile()`
- `get_relationship(contact)`
- `propose_action(task)`
- `execute_safe_action(action_id)`
- `record_correction(action_id, correction)`
- `connection_health()`

## Data stores

MVP:

- Postgres: users, connections, identities, relationships, events, memory pages, graph edges, actions, corrections, policies
- object/document storage: normalized source snapshots when needed
- vector index: semantic retrieval

A dedicated graph database is optional. Start with typed Postgres edges and only add a graph database if query patterns justify the operational cost.

## Learning loop

Every prediction/action produces an evaluation event:

- accepted unchanged
- accepted after edit
- rejected
- user did something different
- action succeeded/failed

Corrections are first-class data. Atlas learns both the final answer and the reason its prior behavior was wrong.

## Memory maintenance

Periodic maintenance should:

- merge duplicates,
- consolidate repeated events into durable knowledge,
- preserve source references,
- mark stale facts,
- detect contradictory evidence,
- flag knowledge gaps,
- avoid writing secrets into synthesized memory.

## Security principles

- OAuth tokens encrypted at rest
- least-privilege scopes per connector
- per-user isolation on every read/write path
- no secret values in prompts, logs, memory summaries, or analytics
- destructive/high-consequence actions require stricter policy
- complete action audit log
- users can inspect why Atlas acted
- deletion/export controls for Twin, relationship, and memory data
