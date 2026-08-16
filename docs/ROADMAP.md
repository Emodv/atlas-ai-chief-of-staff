# Atlas V2 MVP Roadmap

## Milestone 0 — Foundation

- [x] Canonical repository
- [x] Product thesis + architecture
- [x] Web shell
- [x] API shell
- [x] Deterministic autonomy gate
- [x] First-pass digital twin learner
- [ ] CI green on clean install

## Milestone 1 — Onboarding

- [ ] User authentication
- [ ] Google OAuth
- [ ] Gmail connector
- [ ] Calendar connector
- [ ] Contacts connector
- [ ] Connection health screen
- [ ] Incremental sync + cursors

**Exit criterion:** a new user can connect Google and Atlas can ingest a bounded historical sample safely.

## Milestone 2 — Twin + Relationship Graph

- [ ] Identity resolution across Gmail/Contacts/Calendar
- [ ] Relationship records + confidence
- [ ] Tone/style extraction
- [ ] Behavioral rules extraction
- [ ] Contact-specific communication profiles
- [ ] Open-loop extraction
- [ ] Twin report UI

**Exit criterion:** Atlas can explain how the user communicates and behaves with the top 50 relationships, with evidence.

## Milestone 3 — Shadow Mode

- [ ] Inbox classifier
- [ ] Reply predictor
- [ ] Archive/label predictor
- [ ] Follow-up predictor
- [ ] Meeting follow-up predictor
- [ ] Correction capture UI
- [ ] Accuracy dashboard

**Exit criterion:** 20+ daily predictions with measured precision and zero autonomous external actions.

## Milestone 4 — Earned Autonomy

- [ ] Policy profiles by task category
- [ ] Auto-archive obvious noise
- [ ] Auto-label signal
- [ ] Auto-send trivial factual/acknowledgement replies only after threshold
- [ ] Rollback/audit tooling
- [ ] Human-readable 'why Atlas acted'

**Exit criterion:** >90% precision in at least one low-risk category before autonomous execution is enabled for that category.

## Milestone 5 — More connectors

- [ ] Drive
- [ ] Notion
- [ ] HubSpot
- [ ] Meeting transcript source
- [ ] Optional web intelligence

## North-star metrics

- % of inbound work correctly handled without user attention
- false-autonomy rate (must trend toward zero)
- correction rate by task category
- minutes of attention saved per day
- important-item miss rate
- relationship follow-up completion rate
- time-to-first-wow during onboarding
