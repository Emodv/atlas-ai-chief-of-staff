export default function TermsPage() {
  return (
    <main style={{maxWidth:820,paddingTop:48}}>
      <span className="eyebrow">ATLAS.MODA</span>
      <h1 style={{fontSize:'clamp(42px,7vw,68px)'}}>Terms of Use</h1>
      <p>Last updated: August 23, 2026</p>
      <section className="section"><h2>Use of the service</h2><p>Atlas.Moda provides AI-assisted productivity, prioritization, relationship-memory, and workflow features. You are responsible for reviewing consequential decisions and for ensuring that your use complies with applicable law and third-party service terms.</p></section>
      <section className="section"><h2>Connected accounts</h2><p>You may connect third-party services such as Google. You authorize Atlas.Moda to access only the data and permissions you approve. You may revoke third-party access at any time through the relevant provider.</p></section>
      <section className="section"><h2>High-consequence actions</h2><p>Atlas.Moda is designed to gate sensitive or irreversible actions. The service is not a substitute for professional legal, medical, financial, or other regulated advice.</p></section>
      <section className="section"><h2>Availability</h2><p>The service may change, improve, or experience interruptions. We do not guarantee uninterrupted availability or that every AI-generated suggestion will be correct.</p></section>
      <section className="section"><h2>Acceptable use</h2><p>You may not use Atlas.Moda to violate laws, abuse third-party services, access data without authorization, or intentionally bypass security controls.</p></section>
      <p style={{marginTop:48}}><a href="/invite">← Back to Atlas.Moda</a> · <a href="/privacy">Privacy</a> · <a href="/security">Security</a></p>
    </main>
  );
}
