# Atlas — ChatGPT-native AI Chief of Staff

Atlas is the personalization, memory, relationship, and execution layer that makes ChatGPT understand how a person actually operates.

**ChatGPT stays at the center. Atlas makes it personal.**

## Product thesis

**Signal over noise.** A user connects the systems that already contain their life and work history. Atlas studies communication, relationships, decisions, routines, notes, and corrections; builds a Digital Twin + Relationship Graph; then gives ChatGPT the context and safe actions needed to handle routine noise the way that user would.

Atlas does not try to replace ChatGPT. It wraps durable personal context and controlled execution around it.

## Intended user journey

1. User opens ChatGPT and enables Atlas.
2. Atlas checks available connections and permissions.
3. The user connects Gmail, Calendar, Contacts, Drive, Notion, HubSpot, and other supported tools.
4. Atlas shows a minimal connection-health checklist: ✅ connected, ⚠️ needs attention, ❌ blocked.
5. Learning Mode ingests a bounded historical sample and builds:
   - language + code-switching behavior,
   - tone, vocabulary, brevity, warmth, formality,
   - decision and follow-up patterns,
   - a contact-specific Relationship Graph,
   - open loops, commitments, rhythms, and boundaries.
6. Shadow Mode predicts what the user would do and learns from approve/edit/reject corrections.
7. Safe categories graduate to autonomous handling.
8. ChatGPT remains the conversational surface; Atlas stays quiet unless something needs the user.

> The GitHub URL is the product source, not executable magic by itself. The production ChatGPT-native path is an Atlas remote MCP / ChatGPT app integration plus OAuth-backed connectors.

## Trust model — no meaningless percentages in the UI

Atlas may keep numeric confidence internally for evaluation, but users see only three clear states:

- 🟢 **Handled** — Atlas is sure enough, the action is low-risk/reversible, and policy allows execution.
- 🟡 **Review** — Atlas has a strong recommendation or draft, but the user should look.
- 🔴 **Needs you** — ambiguity, missing context, sensitive data, or consequential judgment requires the user.

Every row can expose a short **ⓘ Why?** explanation on demand. Default output stays minimal.

## Interaction rule

**One screen. Silent by default. Explain on demand.**

Typical Atlas report:

| Area | Status | Result |
|---|---|---|
| Email | ✅ | Done |
| Calendar | ✅ | Done |
| Follow-ups | ✅ | 3 handled |
| Client opportunity | ⚠️ | Review |
| Contract decision | 🔴 | Needs you |

No paragraph is shown unless the user asks for detail.

## Core architecture

`ChatGPT → Atlas Context/Trust Layer → Connected tools`

Atlas contains:

- **Digital Twin** — how this user writes, chooses, prioritizes, negotiates, follows up, and switches language.
- **Relationship Graph** — how behavior changes by person and relationship.
- **Durable Brain** — evidence-backed memory across sessions and sources.
- **Context Engine** — retrieves the minimum relevant context before ChatGPT reasons or Atlas acts.
- **Trust Engine** — maps internal confidence + consequence + reversibility + permissions to Green/Yellow/Red.
- **Action Layer** — email, calendar, CRM, files, follow-up, and other connector-specific actions.
- **Correction Loop** — every edit/rejection becomes training evidence for the twin.

## GBrain-inspired memory principles

Atlas borrows several strong patterns from Garry Tan's GBrain while keeping Atlas focused on a user-specific Digital Twin and chief-of-staff execution:

1. **Brain-first lookup:** consult durable personal context before external search or action.
2. **Synthesis over raw search:** return the answer/context packet, not a pile of matching documents.
3. **Typed relationship graph:** connect people, companies, meetings, documents, and commitments through explicit edges.
4. **Evidence-backed memory:** important claims retain source references.
5. **Freshness + gap awareness:** Atlas should say what it does *not* know or what may be stale.
6. **Consolidation:** deduplicate and merge repeated signals instead of letting memory decay into clutter.
7. **Layer separation:** durable world/relationship knowledge, operational state, and current-session context are distinct stores.

See `docs/GBRAIN_REVIEW.md`.

## Repository

- `apps/web` — optional onboarding/admin + minimal executive-status UI
- `services/api` — Atlas API, twin engine, trust engine, memory/context layer
- `packages/core` — shared domain types and connector contracts
- `infra` — Postgres schema + local infrastructure
- `docs` — product, ChatGPT-native architecture, GBrain review, roadmap

## First product milestone

A new user can connect Google, Atlas learns from historical communication, and ChatGPT can receive an evidence-backed context packet containing:

- Digital Twin profile,
- relationship map,
- preferred language/tone for the current contact,
- relevant open loops and commitments,
- freshness/gap warnings,
- Green / Yellow / Red action recommendation.

## Status

**Atlas V2 — active build.** Foundation exists; OAuth connectors, durable ingestion, ChatGPT/MCP integration, identity resolution, and shadow-mode correction learning are the next production milestones.
