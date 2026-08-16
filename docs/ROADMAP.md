# Atlas V2 MVP Roadmap

## Milestone 0 — Foundation

- [x] Canonical repository
- [x] Product thesis + architecture
- [x] Web shell
- [x] API shell
- [x] Deterministic autonomy gate
- [x] First-pass digital twin learner
- [x] ChatGPT-at-center product direction
- [x] Three-bucket trust UX: Green / Yellow / Red
- [x] Minimalist interaction principle: silent by default, explain on demand
- [x] GBrain architecture review + selected memory patterns
- [ ] CI green on clean install

## Milestone 1 — ChatGPT-native onboarding

- [ ] Define Atlas remote MCP / ChatGPT app tool surface
- [ ] User authentication
- [ ] Google OAuth
- [ ] Gmail connector
- [ ] Calendar connector
- [ ] Contacts connector
- [ ] Connection-health checklist (✅ / ⚠️ / ❌)
- [ ] Incremental sync + cursors
- [ ] First-run guided Learning Mode

**Exit criterion:** a new user can enable Atlas, connect Google, and ChatGPT can ask Atlas for authenticated context without Atlas exposing secrets.

## Milestone 2 — Durable Brain + Relationship Graph

- [ ] Brain-first retrieval before user-specific reasoning
- [ ] Identity resolution across Gmail/Contacts/Calendar
- [ ] Typed relationship/entity edges
- [ ] Evidence/source references for durable memory
- [ ] Freshness + knowledge-gap flags
- [ ] Consolidation/deduplication job
- [ ] Relationship records + trust level
- [ ] Tone/style/language extraction
- [ ] Behavioral rules extraction
- [ ] Contact-specific communication profiles
- [ ] Open-loop extraction
- [ ] Twin report UI

**Exit criterion:** Atlas can synthesize an evidence-backed context packet for the top 50 relationships, including how the user communicates with each person and what Atlas does not currently know.

## Milestone 3 — Shadow Mode

- [ ] Inbox classifier
- [ ] Reply predictor
- [ ] Archive/label predictor
- [ ] Follow-up predictor
- [ ] Meeting follow-up predictor
- [ ] Correction capture
- [ ] Internal accuracy metrics
- [ ] User-facing Green/Yellow/Red status only

**Exit criterion:** 20+ daily predictions with measured precision and zero autonomous external actions.

## Milestone 4 — Earned autonomy

- [ ] Policy profiles by task category
- [ ] Auto-archive obvious noise
- [ ] Auto-label signal
- [ ] Auto-send trivial acknowledgements/factual replies only after demonstrated accuracy
- [ ] Rollback/audit tooling
- [ ] On-demand `Why?` detail for every action
- [ ] Exception-only executive status view

**Exit criterion:** at least one low-risk category demonstrates >90% precision with sufficient observations and no consequential errors before autonomous execution is enabled.

## Milestone 5 — Expanded context

- [ ] Drive
- [ ] Notion
- [ ] HubSpot
- [ ] Meeting transcript source
- [ ] Web intelligence enrichment
- [ ] ChatGPT conversation/history input only where platform permissions and product APIs explicitly allow it

## Milestone 6 — Daily chief-of-staff experience

- [ ] Minimal connection status
- [ ] Done / Review / Needs you action table
- [ ] Pre-meeting context packet
- [ ] Post-meeting follow-up
- [ ] Relationship/open-loop manager
- [ ] Signal-vs-noise on demand
- [ ] Background work without unnecessary notifications

## North-star metrics

- % of inbound noise correctly handled without user attention
- important-item miss rate
- false-autonomy rate
- minutes of attention saved per day
- correction rate by task category
- relationship follow-up completion rate
- time-to-first-useful-twin
- % of Atlas responses where the user opens `Why?` (lower is generally better)
