export default function SecurityPage() {
  return (
    <main style={{maxWidth:820,paddingTop:48}}>
      <span className="eyebrow">ATLAS.MODA</span>
      <h1 style={{fontSize:'clamp(42px,7vw,68px)'}}>Security & Trust</h1>
      <p>How Atlas.Moda is designed to protect connected work data.</p>
      <section className="section"><h2>Read-only first</h2><p>Google onboarding requests read-only Workspace scopes. This reduces the blast radius of a compromised or mistaken workflow during initial use.</p></section>
      <section className="section"><h2>Scoped authorization</h2><p>Atlas.Moda uses OAuth authorization rather than asking users to share Google passwords. Access can be revoked through the user's Google Account.</p></section>
      <section className="section"><h2>Server-side controls</h2><p>Authentication and connected-source tokens are handled server-side, and the application uses HTTPS, row-level database security, and private server-side service identities for protected operations.</p></section>
      <section className="section"><h2>Action gating</h2><p>Low-risk reversible work may be automated only when trust conditions are met. Sensitive, consequential, irreversible, financial, legal, security, or account-changing actions are designed to require stronger review controls.</p></section>
      <section className="section"><h2>Data minimization</h2><p>Atlas.Moda is designed to favor compact derived context over unnecessary raw source-data duplication and to keep connected workspaces logically isolated.</p></section>
      <section className="section"><h2>Google Limited Use</h2><p>Use of information received from Google Workspace APIs adheres to the Google User Data Policy, including the Limited Use requirements.</p></section>
      <p style={{marginTop:48}}><a href="/invite">← Back to Atlas.Moda</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></p>
    </main>
  );
}
