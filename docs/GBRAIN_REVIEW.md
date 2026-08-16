# GBrain Review — What Atlas Should Borrow

Reviewed source: `garrytan/gbrain` by Garry Tan.

## Decision

Do **not** turn Atlas into a GBrain clone. GBrain is strongest as a durable brain/retrieval/synthesis layer. Atlas's differentiator remains the **Digital Twin + Relationship Graph + Trust Engine + Chief-of-Staff execution** around ChatGPT.

Use GBrain as an architectural reference for memory quality.

## Low-hanging fruit adopted now

### 1. Brain-first lookup

GBrain's agent loop consults durable memory before answering. Atlas should do the same whenever a request involves a known person, company, client, commitment, meeting, preference, or recurring situation.

**Atlas implementation:** Context Engine order becomes:

`identify entities → query Atlas Brain → query source evidence → detect gaps/staleness → optionally enrich externally → synthesize ChatGPT context packet`

### 2. Synthesis, not search results

Raw retrieval forces the model/user to re-do the reasoning. Atlas should return the smallest useful answer/context packet.

**Atlas implementation:** memory retrieval produces:

- relevant facts,
- relationship context,
- open loops,
- likely user behavior,
- source evidence,
- freshness/gap warning.

### 3. Typed knowledge graph

People, companies, meetings, documents, commitments, and campaigns should be connected with explicit relationships rather than only embeddings.

Example edge types:

- `works_at`
- `client_of`
- `friend_of`
- `met_at`
- `attended`
- `promised`
- `waiting_on`
- `sent_to`
- `related_to`
- `decision_from`

Start in Postgres. A graph database is not required for MVP.

### 4. Evidence-backed memory

Important synthesized facts should retain references to the source events/pages that support them.

**Why:** Atlas is making personalized decisions. If it remembers the wrong relationship, deadline, or commitment, the consequence can be higher than a generic RAG miss.

### 5. Freshness and gap analysis

A strong brain should know when it may be stale.

Atlas memory objects should track:

- `observed_at`
- `last_confirmed_at`
- supporting source IDs
- stale/contradicted state
- explicit knowledge gaps

When current evidence is missing, ChatGPT should get: `Context may be stale — last confirmed X` rather than false certainty.

### 6. Consolidation

Repeated emails, meetings, contacts, and notes will create duplicates and contradictions over time.

Atlas needs periodic maintenance that:

- merges duplicate identities,
- consolidates repeated signals,
- updates durable summaries,
- preserves raw evidence,
- detects contradictions,
- removes obsolete derived memory without deleting source history.

### 7. Separate durable brain, operational state, and session context

Do not mix everything into one memory store.

- **Durable Brain:** people, companies, relationships, facts, decisions, commitments.
- **Operational State:** pending actions, sync jobs, approvals, retries.
- **Session Context:** temporary packet passed into ChatGPT for the current task.

This keeps memory useful instead of becoming a dump.

## Useful later, not MVP blockers

- multi-user/company-brain permission scoping,
- overnight citation repair,
- richer graph traversal ranking,
- automated entity enrichment,
- specialized benchmark/evaluation harnesses.

These should follow after the single-user Digital Twin loop works.

## Atlas-specific extension beyond GBrain

GBrain answers: **What do we know?**

Atlas must additionally answer:

1. **Who is this person to the user?**
2. **How does the user behave with this person?**
3. **What would the user most likely do here?**
4. **Should Atlas act, prepare, or stop?**
5. **How little should Atlas say after doing it?**

That is the Atlas product moat.
