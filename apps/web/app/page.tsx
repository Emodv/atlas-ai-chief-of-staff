const providers = ["gmail", "calendar", "contacts", "drive", "notion", "hubspot"] as const;
const mcpUrl = "https://atlas-ai-chief-of-staff.vercel.app/api/mcp";
const atlasPrompt = `Start Atlas V2 for me now. Atlas MCP server: ${mcpUrl}. Check whether Atlas is available, guide me through only the minimum required setup, then call atlas_status and atlas_connection_health. Help me connect Gmail, Calendar, Contacts, Drive, Notion, and HubSpot where available. Start Learning Mode, then Shadow Mode. Keep output minimal: completed checkmarks, one blocker at a time, no long explanations unless I ask. Use Handled, Review, Needs you. Start now.`;
const chatGptUrl = `https://chatgpt.com/?q=${encodeURIComponent(atlasPrompt)}`;

const connectorLabel: Record<(typeof providers)[number], string> = {
  gmail: "Gmail",
  calendar: "Calendar",
  contacts: "Contacts",
  drive: "Drive",
  notion: "Notion",
  hubspot: "HubSpot",
};

const stages = [
  ["1", "Connect", "Atlas checks access to the tools that already know your life and work."],
  ["2", "Learn", "It builds your Digital Twin, language patterns, relationships, rhythms, and boundaries."],
  ["3", "Shadow", "It predicts what you would do and learns from approve, edit, and reject."],
  ["4", "Handle", "Safe familiar noise becomes automatic. ChatGPT stays the main interface."],
];

export default function Home() {
  const connectors = providers.map((provider) => {
    const configured = Boolean(process.env[`ATLAS_${provider.toUpperCase()}_CONNECTED`]);
    return {
      provider,
      label: connectorLabel[provider],
      configured,
      state: configured ? "connected" : "missing",
      icon: configured ? "✅" : "❌",
    };
  });

  const connected = connectors.filter((item) => item.configured).length;
  const databaseConfigured = Boolean(process.env.DATABASE_URL);

  const statusRows = [
    ["MCP server", "green", "✅", "Online", "The production Atlas MCP endpoint is deployed and reachable."],
    ["Connectors", connected === providers.length ? "green" : "yellow", connected === providers.length ? "✅" : "⚠️", `${connected}/${providers.length} ready`, "Server-side OAuth/configuration is required before Atlas can act independently on each source."],
    ["Durable memory", databaseConfigured ? "green" : "yellow", databaseConfigured ? "✅" : "⚠️", databaseConfigured ? "Ready" : "Configure", "Corrections and durable user state require a production database connection."],
    ["Trust engine", "green", "✅", "Ready", "Every external action is routed through Handled, Review, or Needs you."],
  ];

  return (
    <main>
      <section className="hero">
        <span className="eyebrow">ATLAS V2 · CHATGPT-NATIVE</span>
        <h1>ChatGPT, but deeply yours.</h1>
        <p className="lede">
          Atlas is the personal context, relationship memory, and trust layer that turns ChatGPT into a chief of staff that learns how you operate.
        </p>
        <div className="actions">
          <a className="primaryAction" href={chatGptUrl} target="_blank" rel="noreferrer">Start Atlas in ChatGPT →</a>
          <a href="/setup">See how setup works</a>
        </div>
        <p className="ctaMicrocopy">One tap opens ChatGPT with the Atlas setup prompt already loaded.</p>
      </section>

      <section className="panel">
        <div>
          <span className="label">North star</span>
          <h2>Signal over noise.</h2>
          <p>ChatGPT stays the conversation. Atlas stays underneath, learning, remembering, and gating actions.</p>
        </div>
        <div className="signal">
          <strong>{connected}/{providers.length} sources ready.</strong>
          <span>{databaseConfigured ? "Durable memory is configured." : "Persistence still needs production configuration."}</span>
        </div>
      </section>

      <section className="section">
        <span className="label">Live connection check</span>
        <div className="connectorGrid">
          {connectors.map((connector) => (
            <div className={`connector ${connector.state}`} key={connector.provider}>
              <span className="statusIcon">{connector.icon}</span>
              <span>{connector.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section statusSection">
        <div className="sectionHeader">
          <div>
            <span className="label">Production readiness</span>
            <h2>Quiet by default.</h2>
          </div>
          <span className="microcopy">No simulated activity.</span>
        </div>
        <div className="statusTable">
          {statusRows.map(([area, level, icon, result, why]) => (
            <div className="statusRow" key={area}>
              <span className="area">{area}</span>
              <span className={`trustPill ${level}`}>{icon} {result}</span>
              <details>
                <summary aria-label={`Why ${area}`}>ⓘ</summary>
                <p>{why}</p>
              </details>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="how">
        <span className="label">How it works</span>
        <div className="stageGrid">
          {stages.map(([n, title, copy]) => (
            <article key={n}>
              <span>{n}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section twin">
        <div>
          <span className="label">The moat</span>
          <h2>Digital Twin + Relationship Graph + Durable Brain</h2>
        </div>
        <p>
          Atlas retrieves personal evidence first, adapts behavior by relationship and language, detects stale or missing context, and routes every action through a simple trust state: Handled, Review, or Needs you.
        </p>
      </section>
    </main>
  );
}
