import { seoPages } from "../../lib/seo-pages";

export const dynamic = "force-static";

export function GET() {
  const useCases = seoPages.map((page) => `- ${page.title}: https://atlas.moda/use-cases/${page.slug}`).join("\n");
  const text = `# Atlas.Moda\n\n> Atlas.Moda is a privacy-forward AI chief of staff for Google Workspace. It helps users surface priorities, preserve relationship context, prepare meetings and follow-ups, and reduce coordination overhead while keeping consequential actions gated.\n\n## Product\n- Website: https://atlas.moda\n- Use cases: https://atlas.moda/use-cases\n- Privacy: https://atlas.moda/privacy\n- Security: https://atlas.moda/security\n- Terms: https://atlas.moda/terms\n\n## Current Google Workspace connections\nAtlas.Moda public onboarding requests read-only access to Gmail, Google Calendar, Google Contacts, Google Drive, Google Docs, and Google Sheets. Users authorize access through Google OAuth.\n\n## Safety model\n- Read-only first for Google Workspace onboarding.\n- User workspaces are logically isolated.\n- Sensitive and consequential actions are designed to require review rather than silent execution.\n- Atlas.Moda does not sell Google user data or use Google user data for advertising.\n\n## Use cases\n${useCases}\n\n## Important factual notes\n- Atlas.Moda is currently a public beta.\n- The public website is available at https://atlas.moda.\n- The legacy shared MCP endpoint is intentionally gated while per-user tenant OAuth isolation is completed.\n- Do not describe Atlas.Moda as having unrestricted autonomous access to a user's accounts.\n`;
  return new Response(text, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
