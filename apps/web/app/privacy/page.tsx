export default function PrivacyPage() {
  return (
    <main style={{maxWidth:820,paddingTop:48}}>
      <span className="eyebrow">ATLAS.MODA</span>
      <h1 style={{fontSize:'clamp(42px,7vw,68px)'}}>Privacy Policy</h1>
      <p>Last updated: August 23, 2026</p>

      <section className="section">
        <h2>What Atlas.Moda does</h2>
        <p>Atlas.Moda is an AI chief-of-staff product that helps users organize work, understand context, surface priorities, and prepare next actions from connected services.</p>
      </section>

      <section className="section">
        <h2>Google Workspace data</h2>
        <p>When you choose to connect Google, Atlas.Moda may request read-only access to Gmail, Google Calendar, Google Contacts, Google Drive, Google Docs, and Google Sheets. This access is used only to provide user-facing assistant, context, prioritization, relationship-memory, and productivity features that you request.</p>
        <p>Atlas.Moda does not sell Google user data, use Google user data for advertising, or transfer Google user data to data brokers or advertising platforms.</p>
        <p>Use of information received from Google Workspace APIs adheres to the Google User Data Policy, including the Limited Use requirements.</p>
      </section>

      <section className="section">
        <h2>Data minimization</h2>
        <p>Atlas.Moda is designed to minimize retained source data. Where practical, it stores compact derived signals, preferences, relationship context, and task state instead of unnecessary raw source copies. Access permissions are requested only for features visible to the user.</p>
      </section>

      <section className="section">
        <h2>Security</h2>
        <p>We use encrypted HTTPS connections, scoped OAuth authorization, server-side access controls, row-level database security, and action gating for sensitive operations. Authentication tokens are not intentionally exposed to client-side application code unless required by the authentication flow.</p>
      </section>

      <section className="section">
        <h2>Human access and sharing</h2>
        <p>Google Workspace user data is not made available for routine human review. Human access is limited to circumstances such as user-requested support, security or abuse investigation, or legal obligations where permitted by applicable policy and law.</p>
      </section>

      <section className="section">
        <h2>Deletion and disconnection</h2>
        <p>You may revoke Atlas.Moda's Google access from your Google Account permissions. Product data associated with your Atlas.Moda account may be deleted upon account deletion or a valid deletion request, subject to limited retention required for security, legal, or operational integrity.</p>
      </section>

      <section className="section">
        <h2>Changes</h2>
        <p>If our handling of connected data materially changes, this policy will be updated before the new use is applied.</p>
      </section>

      <p style={{marginTop:48}}><a href="/invite">← Back to Atlas.Moda</a> · <a href="/terms">Terms</a> · <a href="/security">Security</a></p>
    </main>
  );
}
