# Next Provider Action

Atlas code and Vercel deployment are present. The remaining production activation currently requires a provider-console step that cannot be completed safely from repository code alone:

**Reactivate the existing `Atlas.Moda` Supabase project (`lvkrvqpoajzpcqnlvqaj`) and confirm its OAuth 2.1 Server configuration.**

Do not create a second Atlas Supabase project.

After reactivation, Atlas should immediately be re-tested through:
- `https://atlas.moda/.well-known/oauth-protected-resource`
- `https://atlas.moda/api/health/oauth-server`
- `https://atlas.moda/api/chatgpt/mcp`

Expected states:
- protected-resource metadata: 200
- OAuth health: 200/healthy
- MCP without auth: 401
- MCP with valid ChatGPT OAuth bearer token: authenticated workspace tools available
