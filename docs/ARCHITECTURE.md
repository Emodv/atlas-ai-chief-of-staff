# Atlas V2 Architecture

## Core loop

`Connect → Ingest → Normalize → Model → Predict → Act → Learn`

Atlas separates **understanding** from **execution** so a powerful model cannot bypass safety policy.

## Domain model

### User Twin
Represents how the user tends to communicate and decide:

- brevity / verbosity
- warmth / formality / directness
- language and code-switching patterns
- commercial judgment
- recurring decision rules
- preferred scheduling/follow-up behavior
- boundaries and do-not-do patterns

### Relationship Graph
Represents context around each person/company:

- identity across systems
- relationship type
- warmth / formality
- last meaningful interaction
- communication cadence
- open loops and commitments
- client/prospect/friend/family/vendor status
- whether human presence is more valuable than automation

### Context Engine
Builds a situation packet from the minimum relevant evidence: current message/event, thread history, relationship context, relevant documents, recent commitments, and public context when useful.

### Decision Engine
Predicts what the user would most likely do, produces a confidence score, then sends that proposed action through the deterministic autonomy policy.

### Autonomy Policy
A separate deterministic gate chooses one of:

1. Surface
2. Recommend
3. Draft
4. Execute

High confidence alone never overrides consequence, sensitivity, reversibility, or explicit policy blocks.

## Connector contract

Every connector should eventually implement:

- `authorize()`
- `sync(cursor)`
- `normalize(raw_event)`
- `read(resource_id)`
- `act(action)` where the provider permits writes

Initial targets: Google/Gmail, Calendar, Contacts, Drive, Notion, HubSpot.

## Data stores

MVP:

- Postgres: users, connections, identities, relationships, events, actions, corrections, policies
- Object/document storage: normalized source snapshots when needed
- Vector index: semantic retrieval for historical context

A dedicated graph database is optional. Start with Postgres relationship tables and add a graph engine only if query patterns justify the operational cost.

## Learning loop

Every prediction produces an evaluation event:

- accepted unchanged
- accepted after edit
- rejected
- user did something different
- action succeeded/failed

Corrections are first-class data. Atlas should learn *why* a prediction was wrong, not just save the final text.

## Security principles

- OAuth tokens encrypted at rest
- least-privilege scopes per connector
- no secret values in prompts, logs, memory summaries, or analytics
- destructive/high-consequence actions require stricter policy
- complete action audit log
- users can inspect why Atlas acted
- deletion/export controls for twin and relationship data
