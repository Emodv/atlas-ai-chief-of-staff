const atlasPrompt = `Open Atlas for me. If Atlas is installed in this ChatGPT account, run atlas_status and atlas_connection_health, then continue onboarding one blocker at a time. If Atlas is not installed, tell me that clearly and stop. Do not ask me to copy or paste an MCP URL. Keep every response minimal: checkmarks for completed items, one blocker at a time, and use Handled, Review, or Needs you.`;

const chatGptUrl = `https://chatgpt.com/?q=${encodeURIComponent(atlasPrompt)}`;

export default function SetupPage() {
  return (
    <main className="setupMain">
      <section className="setupHero">
        <span className="eyebrow">ATLAS V2 · CHATGPT APP</span>
        <h1>Open.<br />Connect.<br />Done.</h1>
        <p className="lede">Atlas is designed to live inside ChatGPT. No MCP knowledge. No URLs. No technical setup in the normal customer flow.</p>

        <a className="launchAtlas" href={chatGptUrl} target="_blank" rel="noreferrer">
          <span>Open Atlas in ChatGPT</span>
          <span aria-hidden="true">→</span>
        </a>
        <p className="launchNote">If Atlas is installed, ChatGPT continues automatically. If it is not installed yet, ChatGPT stops cleanly instead of sending you through developer setup.</p>
      </section>

      <section className="easyFlow" aria-label="Atlas setup steps">
        <article>
          <span className="stepCheck">1</span>
          <div><h3>Open Atlas</h3><p>Launch it from ChatGPT.</p></div>
        </article>
        <article>
          <span className="stepCheck">2</span>
          <div><h3>Connect your tools</h3><p>Approve Gmail, Calendar, Drive, Notion, HubSpot, and other sources only when needed.</p></div>
        </article>
        <article>
          <span className="stepCheck">✓</span>
          <div><h3>Atlas learns</h3><p>Learning Mode first. Shadow Mode next. Safe autonomy only after enough evidence.</p></div>
        </article>
      </section>

      <section className="setupPromise">
        <span className="label">CURRENT RELEASE STATUS</span>
        <h2>The product flow is ready. Public ChatGPT distribution is the remaining gate.</h2>
        <p>Atlas is packaged around a production MCP backend and is being prepared as a proper ChatGPT App. Until the app is published or enabled for an eligible ChatGPT account, the site will not pretend that a prompt can install it.</p>
        <div className="miniStates">
          <span>✅ Backend live</span>
          <span>✅ App tools packaged</span>
          <span>⚠️ ChatGPT distribution pending</span>
        </div>
      </section>

      <details className="advancedSetup">
        <summary>Developer details</summary>
        <p>The MCP endpoint is implementation infrastructure and intentionally hidden from the normal customer onboarding flow.</p>
      </details>
    </main>
  );
}
