# Atlas.Moda — AI Chief of Staff for Google Workspace

**Live product:** https://atlas.moda  
**Use cases:** https://atlas.moda/use-cases  
**Security:** https://atlas.moda/security  
**Privacy:** https://atlas.moda/privacy

Atlas.Moda is a privacy-forward AI chief of staff that helps users surface priorities, preserve relationship context, prepare meetings and follow-ups, and reduce coordination overhead across Google Workspace.

## Public beta

The public onboarding flow starts with Google OAuth and requests read-only access to supported Workspace sources:

- Gmail
- Google Calendar
- Google Contacts
- Google Drive
- Google Docs
- Google Sheets

Sensitive and consequential actions are designed to remain gated rather than being executed silently.

## What Atlas.Moda is for

- AI chief of staff: https://atlas.moda/use-cases/ai-chief-of-staff
- Google Workspace AI assistant: https://atlas.moda/use-cases/google-workspace-ai-assistant
- Gmail AI assistant: https://atlas.moda/use-cases/gmail-ai-assistant
- Calendar AI assistant: https://atlas.moda/use-cases/calendar-ai-assistant
- Executive AI assistant: https://atlas.moda/use-cases/executive-ai-assistant
- Personal CRM AI: https://atlas.moda/use-cases/personal-crm-ai
- Follow-up AI assistant: https://atlas.moda/use-cases/follow-up-ai-assistant
- AI meeting preparation: https://atlas.moda/use-cases/meeting-prep-ai
- Inbox prioritization AI: https://atlas.moda/use-cases/inbox-prioritization-ai
- Founder AI assistant: https://atlas.moda/use-cases/founder-ai-assistant

## Product thesis

**Signal over noise.** Users connect the systems that already contain their work history. Atlas.Moda is designed to learn useful communication, relationship, decision, and routine patterns; build durable context; and help surface the few items that deserve attention.

The product combines:

- **Digital Twin** — evidence-backed preferences and operating patterns.
- **Relationship Graph** — context about people, companies, meetings, and open loops.
- **Durable Brain** — persistent context separated from transient session state.
- **Trust Engine** — routes proposed work through Handled, Review, or Needs you.
- **Action Layer** — controlled connector-specific actions as permissions and trust mature.

## Safety and tenant isolation

The public web product uses per-user Supabase authentication and row-level workspace isolation. The older shared `primary` MCP surface is intentionally gated while true per-user MCP OAuth isolation is completed.

The public `/api/mcp` endpoint therefore does **not** expose the legacy private Digital Twin.

## Search and AI discoverability

Atlas.Moda publishes:

- XML sitemap: https://atlas.moda/sitemap.xml
- robots policy: https://atlas.moda/robots.txt
- LLM context file: https://atlas.moda/llms.txt
- structured Schema.org data on public landing pages
- canonical URLs and social metadata

## Repository

- `apps/web` — public Atlas.Moda web application and authenticated user experience
- `services/api` — Atlas API, twin engine, trust engine, memory/context layer
- `packages/core` — shared domain types and connector contracts
- `supabase` — migrations and protected server functions
- `docs` — product and architecture documentation

## Status

**Atlas.Moda public beta is live at https://atlas.moda.**
