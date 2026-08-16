# ChatGPT ↔ Atlas MCP bridge

Atlas V2 is ChatGPT-native. ChatGPT remains the reasoning/conversation surface; Atlas exposes durable personal context, relationship memory, trust gating, corrections, and eventually connector actions through a remote MCP endpoint.

## Endpoint

The Next.js app exposes:

`/api/mcp`

It uses a stateless Streamable HTTP MCP handler so ChatGPT can invoke Atlas tools over HTTPS.

## Current tool surface

- `atlas_status` — health + product mode
- `atlas_connection_health` — server-side connector readiness
- `atlas_build_context_packet` — compresses evidence into a relationship-aware context packet
- `atlas_trust_gate` — maps evidence/risk/reversibility/permission into GREEN / YELLOW / RED
- `atlas_record_correction` — captures approve/edit/reject/different-action feedback for the Digital Twin learning loop

## Trust states

- **GREEN** → safe to execute silently when an execution tool exists
- **YELLOW** → recommendation/draft; user should review
- **RED** → user is required

No user-facing percentages.

## Production connection flow

1. Deploy the Next.js app to an HTTPS host (Vercel is the target for MVP).
2. Verify `https://<host>/api/mcp` responds as an MCP endpoint.
3. In ChatGPT, enable Developer mode under Settings → Security and login.
4. Open ChatGPT Plugins, add a plugin connection, and paste the HTTPS `/api/mcp` endpoint.
5. Start a new chat with Atlas enabled and call `atlas_status`.
6. Connect Atlas-owned OAuth providers so Atlas can fetch source evidence directly rather than requiring ChatGPT to manually shuttle connector results.

## Important boundary

The MCP bridge removes the **reasoning/policy manual gap** immediately: ChatGPT can call Atlas for context shaping, trust decisions, and learning.

The **data-access manual gap** is removed provider-by-provider as Atlas receives its own OAuth-backed Gmail, Calendar, Contacts, Drive, Notion, and HubSpot adapters. ChatGPT's existing built-in connector permissions are not automatically transferable to an external Atlas server.

## Security

- OAuth tokens stay server-side and never appear in chat text.
- MCP tools return the minimum necessary context.
- Sensitive/high-consequence actions are RED by policy.
- Connector write actions must be explicitly annotated and separately gated.
- Corrections should be durable and auditable once persistence is wired.

## Next implementation order

1. Deploy `/api/mcp` and connect it to ChatGPT.
2. Add persistent user/session identity.
3. Add Google OAuth and Gmail/Calendar/Contacts adapters.
4. Add Digital Twin + Relationship Graph retrieval to `atlas_build_context_packet`.
5. Add safe action tools for Gmail/calendar.
6. Add Notion/Drive/HubSpot adapters.
7. Add Shadow Mode evals and category-level graduation to autonomous GREEN execution.
