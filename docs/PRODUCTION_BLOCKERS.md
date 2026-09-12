# Atlas Production Blockers

## Current blocker discovered during ship pass

The Supabase project named **Atlas.Moda** is currently reported as `INACTIVE` by the connected Supabase account.

This is a production blocker for any ChatGPT/OAuth flow that depends on live Atlas tenant resolution, durable data, or Supabase Auth.

## Required provider-side action
Resume/reactivate the existing Atlas.Moda Supabase project in the Supabase dashboard. Do **not** create a replacement project unless recovery is impossible; replacing it would risk breaking environment variables, auth configuration, RLS policies, and existing data bindings.

After reactivation, verify:
1. Auth is healthy.
2. OAuth 2.1 Server is enabled.
3. Authorization path is `/oauth/consent`.
4. Dynamic client registration is enabled if required by the ChatGPT MCP client.
5. Production environment variables still point to the existing Atlas.Moda project.
6. `/api/health/oauth-server` reports healthy.
7. `/api/chatgpt/mcp` resolves an authenticated user to exactly one workspace with no fallback to legacy `primary`.
