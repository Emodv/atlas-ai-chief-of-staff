# Atlas Ship Status — 2026-09-12

## What is already live
- Production Vercel project exists and is connected to `Emodv/atlas-ai-chief-of-staff`.
- `/.well-known/oauth-protected-resource` responds successfully in production.
- `/api/chatgpt/mcp` is deployed and correctly rejects unauthenticated requests with HTTP 401.
- `/api/health/oauth-server` is deployed but currently returns HTTP 503.

## Root production blocker
The connected Supabase account reports the existing **Atlas.Moda** project as `INACTIVE`.

That is consistent with the OAuth health endpoint returning 503 and blocks a reliable authenticated ChatGPT-native flow.

## Ship order
1. Reactivate existing Atlas.Moda Supabase project.
2. Verify Supabase Auth/OAuth 2.1 provider settings.
3. Re-run `/api/health/oauth-server` until it returns healthy.
4. Authenticate ChatGPT against `/api/chatgpt/mcp`.
5. Test `atlas_command_center` with a real owner workspace.
6. Tighten default owner output to three sections: MAKE MONEY / PROTECT REVENUE / NEEDS YOU.
7. Verify any queued action before claiming it executed.

## Definition of shipped
From the ChatGPT mobile app, the owner can say:

`Atlas, give me my morning briefing.`

and receive a terse, authenticated, real-workspace answer without opening Atlas.Moda, GitHub, Vercel, or Supabase.
