import { redirect } from "next/navigation";
import { getAtlasSession } from "../../../lib/atlas-auth";
import { getOAuthAuthorizationDetails } from "../../../lib/atlas-oauth-server";

export default async function OAuthConsentPage({ searchParams }: { searchParams: Promise<{ authorization_id?: string }> }) {
  const params = await searchParams;
  const authorizationId = params.authorization_id;
  if (!authorizationId) {
    return <main className="authShell"><section className="authCard"><h1>Authorization request missing.</h1><p>Return to ChatGPT and connect Atlas again.</p></section></main>;
  }

  const session = await getAtlasSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/oauth/consent?authorization_id=${authorizationId}`)}`);
  }

  const result = await getOAuthAuthorizationDetails(authorizationId);
  if (!result.ok) {
    return <main className="authShell"><section className="authCard"><div className="commandBrand"><span className="commandMark">A</span><span>Atlas.Moda</span></div><span className="eyebrow">CHATGPT APP AUTHORIZATION</span><h1>Unable to authorize.</h1><p>{result.error ?? "This authorization request is invalid or expired."}</p></section></main>;
  }

  const details = result.data ?? {};
  if (!details.authorization_id && details.redirect_url) redirect(details.redirect_url);
  const scopes = String(details.scope ?? "email").split(/\s+/).filter(Boolean);
  const clientName = details.client?.name ?? "ChatGPT";

  return (
    <main className="authShell">
      <section className="authCard">
        <div className="commandBrand"><span className="commandMark">A</span><span>Atlas.Moda</span></div>
        <span className="eyebrow">CHATGPT APP AUTHORIZATION</span>
        <h1>Connect Atlas to {clientName}.</h1>
        <p>Atlas will use your authenticated workspace identity so every MCP request stays isolated to your own data. No request can fall back to the private owner workspace.</p>
        <div className="authTrust" style={{justifyContent:"center",margin:"20px 0"}}>
          <span>Tenant isolated</span><span>RLS enforced</span><span>Revocable OAuth</span><span>High-risk actions gated</span>
        </div>
        <div style={{textAlign:"left",margin:"20px 0"}}>
          <strong>Requested identity permissions</strong>
          <ul>{scopes.map((scope: string) => <li key={scope}>{scope}</li>)}</ul>
        </div>
        <form action="/api/oauth/decision" method="POST" style={{display:"grid",gap:10}}>
          <input type="hidden" name="authorization_id" value={authorizationId} />
          <button className="approveAction" type="submit" name="decision" value="approve">Authorize Atlas →</button>
          <button className="authSwitch" type="submit" name="decision" value="deny">Deny</button>
        </form>
        <div style={{marginTop:16,fontSize:12,textAlign:"center"}}><a href="/privacy">Privacy</a> · <a href="/security">Security</a> · <a href="/terms">Terms</a></div>
      </section>
    </main>
  );
}
