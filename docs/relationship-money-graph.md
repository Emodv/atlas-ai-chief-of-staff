# Atlas Relationship Equity + Money Graph

North Star: **Maximum economic output with minimum necessary human attention.**

## Model

Atlas treats relationship equity as an economic asset and ranks two related but distinct dimensions:

1. **Relationship priority** — who deserves attention based on relationship strength, momentum, timing and required human effort.
2. **Economic priority** — which opportunity has the highest expected monetary value per human minute.

Relationship records live in `atlas_relationships`. Revenue opportunities live in `atlas_opportunities` and can reference a relationship via `relationship_id`.

## Closed loop

Observe → detect signal → update relationship → create/rank opportunity → prepare next-best action → execute or request review based on trust gate → verify outcome → attribute revenue / human attention saved → learn.

## Safety

Commercial relationship outreach remains review-first. Autonomous execution stays limited to low-risk, reversible operations allowed by Atlas safety gates. High-consequence actions remain blocked.

## Current production worker

`atlas-worker-control` protocol: `relationship-money-closed-loop-v2`

The worker scans due relationships and money opportunities together and returns:
- top money opportunities
- relationships due for value-first touch
- P0/P1 opportunities
- queued safe autonomous actions
- blockers requiring review

Generated database columns remain database-owned; workers do not write generated scores directly.
