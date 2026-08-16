const mcpUrl = "https://atlas-ai-chief-of-staff.vercel.app/api/mcp";

export default function SetupPage() {
  return (
    <main>
      <section className="hero">
        <span className="eyebrow">ATLAS SETUP</span>
        <h1>Connect Atlas to ChatGPT.</h1>
        <p className="lede">Atlas is deployed. The remaining step is registering the remote MCP endpoint in ChatGPT, then connecting server-side data sources for autonomous operation.</p>
      </section>

      <section className="statusSection">
        <span className="label">MCP endpoint</span>
        <h2>Production endpoint</h2>
        <p><code>{mcpUrl}</code></p>
      </section>

      <section className="section">
        <span className="label">Activation</span>
        <div className="stageGrid">
          <article><span>1</span><h3>Add Atlas</h3><p>Register the production MCP endpoint in ChatGPT Developer Mode.</p></article>
          <article><span>2</span><h3>Verify</h3><p>Call <code>atlas_status</code> and <code>atlas_connection_health</code>.</p></article>
          <article><span>3</span><h3>Connect</h3><p>Authorize Gmail, Calendar, Contacts, Drive, Notion, HubSpot, and other supported sources.</p></article>
          <article><span>4</span><h3>Learn</h3><p>Run Learning Mode, then Shadow Mode before graduating safe tasks to autonomy.</p></article>
        </div>
      </section>

      <section className="section twin">
        <div><span className="label">Safety</span><h2>Handled. Review. Needs you.</h2></div>
        <p>Atlas never treats confidence alone as permission. Consequence, reversibility, evidence quality, sensitivity, and available permissions determine whether an action executes, waits for review, or stops for you.</p>
      </section>
    </main>
  );
}
