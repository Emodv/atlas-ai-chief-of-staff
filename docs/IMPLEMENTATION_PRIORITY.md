# Implementation Priority

Do not add new product surfaces until the authenticated ChatGPT path works end to end.

Priority order:
1. Reactivate Atlas.Moda Supabase.
2. Confirm OAuth 2.1 provider configuration.
3. Verify ChatGPT MCP authentication and workspace resolution.
4. Test `atlas_command_center` against the owner's real workspace.
5. Only then tighten command-center output to the owner prompt contract.

This prevents spending engineering time on presentation while the production identity/data dependency is offline.
