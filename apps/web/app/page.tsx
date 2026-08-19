const providers = ["gmail", "calendar", "contacts", "drive", "notion", "hubspot"] as const;
const atlasPrompt = `Open Atlas for me. Run atlas_status and atlas_connection_health. If at least one source is connected, start Learning Mode. Keep Shadow Mode off until Learning Mode is confirmed. Continue onboarding one blocker at a time. If Atlas is not installed in this ChatGPT account, tell me clearly and stop. Do not ask me to copy or paste an MCP URL.`;
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
  ["1", "Connect", "Authorize the sources Atlas needs."],
  ["2", "Learn", "Atlas learns tone, language, relationships, routines, preferences, and decisions."],
  ["3", "Shadow", "Atlas predicts what you would do without taking external actions."],
  ["4", "Handle", "Only familiar, low-risk work graduates to safe autonomy."],
];

function envEnabled(name: string): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on" || value === "connected" || value === "ready";
}

export default function Home() {
  const connectors = providers.map((provider) => {
    const configured = envEnabled(`ATLAS_${provider.toUpperCase()}_CONNECTED`);
    return {
      provider,
      label: connectorLabel[provider],
      configured,
      state: configured ? "connected" : "missing",
      icon: configured ? "✅" : "⚠️",
    };
  });

  const connected = connectors.filter((item) => item.configured).length;
  const databaseConfigured = Boolean(process.env.DATABASE_URL);
  const durableMemoryReady = databaseConfigured && envEnabled("ATLAS_DURABLE_MEMORY_READY");
  const firstMissing = connectors.find((item) => !item.configured)?.label ?? null;

  const statusRows = [
    ["MCP backend", "green", "✅", "Online", "The production Atlas MCP backend is deployed."],
    ["ChatGPT App", "yellow", "⚠️", "Distribution", "The MCP tools are packaged; normal customer use still depends on ChatGPT app availability for the account."],
    ["Sources", connected > 0 ? "green" : "yellow", connected > 0 ? "✅" : "⚠️", `${connected}/${providers.length} connected`, firstMissing ? `Next source: ${firstMissing}.` : "All configured source flags are ready."],
    ["Learning Mode", connected > 0 ? "green" : "yellow", connected > 0 ? "✅" : "⚠️", connected > 0 ? "Ready to start" : "Blocked", connected > 0 ? "Learning can start with one connected source and never performs external actions." : "Connect one source first."],
    ["Durable memory", durableMemoryReady ? "green" : "yellow", durableMemoryReady ? "✅" : "⚠️", durableMemoryReady ? "Ready" : databaseConfigured ? "Wiring incomplete" : "Not configured", "Atlas now distinguishes database presence from actual durable-memory readiness."],
    ["Trust engine", "green", "✅", "Ready", "Every proposed action is routed through Handled, Review, or Needs you."],
  ];

  return (
    <main>
      <section className="hero">
        <span className="eyebrow">ATLAS V2 · CHATGPT-NATIVE</span>
        <h1>ChatGPT, but deeply yours.</h1>
        <p className="lede">Atlas is the context, relationship memory, learning, and trust layer that turns ChatGPT into a personal chief of staff.</p>
        <div className="actions">
          <a className="primaryAction" href={chatGptUrl} target="_blank" rel="noreferrer">Start Atlas in ChatGPT →</a>
          <a href="/setup">Setup status</a>
        </div>
        <p className="ctaMicrocopy">One launch. Atlas checks itself, checks sources, starts Learning Mode when possible, and surfaces only the next blocker.</p>
      </section>

      <section className="panel">
        <div>
          <span className="label">North star</span>
          <h2>Signal over noise.</h2>
          <p>ChatGPT stays the conversation. Atlas stays underneath, learning, remembering, and gating actions.</p>
        </div>
        <div className="signal">
          <strong>{connected}/{providers.length} sources connected.</strong>
          <span>{durableMemoryReady ? "Durable memory is ready." : "Learning can run; durable persistence still needs completion."}</span>
        </div>
      </section>

      <section className="section">
        <span className="label">Live readiness</span>
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
            <h2>Truthful by default.</h2>
          </div>
          <span className="microcopy">No simulated connections or fake learning state.</span>
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
        <p>Atlas retrieves personal evidence first, adapts behavior by relationship and language, detects stale or missing context, and routes every action through Handled, Review, or Needs you.</p>
      </section>
    </main>
  );
}
