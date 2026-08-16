# Atlas — AI Chief of Staff

Atlas is a digital-twin operating system that learns how a person communicates, decides, prioritizes, and manages relationships, then quietly handles low-risk noise on their behalf.

## Product thesis

**Signal over noise.** Connect the tools you already use. Atlas studies historical behavior, builds a User Twin + Relationship Graph, runs in shadow mode, learns from corrections, and progressively earns permission to execute reversible tasks autonomously.

## MVP flow

1. Connect Gmail, Calendar, Contacts, Drive, Notion, and HubSpot.
2. Normalize activity into a shared event model.
3. Build a User Twin: language, tone, style, decision patterns, boundaries.
4. Build a Relationship Graph: who each person is, context, warmth, cadence, open loops.
5. Run Shadow Mode: Atlas predicts what the user would do without acting.
6. Learn from approvals/corrections.
7. Graduate safe categories from **surface → recommend → draft → execute**.

## Repository

- `apps/web` — onboarding + Atlas dashboard
- `services/api` — API, twin engine, relationship/context model, decisions
- `packages/core` — shared domain types and autonomy rules
- `infra` — local Postgres + future queue/vector services
- `docs` — product, architecture, autonomy, roadmap

## Quick start

### Web

```bash
pnpm install
pnpm dev
```

### API

```bash
cd services/api
python -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload --port 8000
```

Copy `.env.example` to `.env` and add your own development credentials. Never commit tokens or OAuth secrets.

## First milestone

A new user connects accounts and Atlas produces, within one onboarding session:

- a Digital Twin profile,
- a relationship map,
- top communication/decision patterns,
- 20 shadow-mode predictions,
- an autonomy readiness score by task category.

## Status

**Atlas V2 MVP — active build.** The current code is the product foundation, not a finished production deployment.
