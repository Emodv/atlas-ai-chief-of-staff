const connectors = [
  ["Gmail", "connected", "✅"],
  ["Calendar", "connected", "✅"],
  ["Contacts", "connected", "✅"],
  ["Drive", "review", "⚠️"],
  ["Notion", "connected", "✅"],
  ["HubSpot", "missing", "❌"],
];

const stages = [
  ["1", "Connect", "Atlas checks access to the tools that already know your life and work."],
  ["2", "Learn", "It builds your Digital Twin, language patterns, relationships, rhythms, and boundaries."],
  ["3", "Shadow", "It predicts what you would do and learns from approve, edit, and reject."],
  ["4", "Handle", "Safe familiar noise becomes automatic. ChatGPT stays the main interface."],
];

const statusRows = [
  ["Email", "green", "✅", "Done", "Routine noise handled; important items remain visible."],
  ["Calendar", "green", "✅", "Done", "No conflict needs attention."],
  ["Follow-ups", "green", "✅", "3 handled", "Low-risk follow-ups matched learned patterns."],
  ["Client opportunity", "yellow", "⚠️", "Review", "Atlas has a recommendation but wants your judgment."],
  ["Contract decision", "red", "🔴", "Needs you", "Consequential decision; Atlas stops here."],
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <span className="eyebrow">ATLAS V2 · CHATGPT-NATIVE</span>
        <h1>ChatGPT, but deeply yours.</h1>
        <p className="lede">
          Atlas learns your language, relationships, judgment, routines, and history, then gives ChatGPT the context and safe actions to handle the noise like you would.
        </p>
        <div className="actions">
          <button>Enable Atlas</button>
          <a href="#how">How it works</a>
        </div>
      </section>

      <section className="panel">
        <div>
          <span className="label">North star</span>
          <h2>Signal over noise.</h2>
          <p>ChatGPT stays the conversation. Atlas stays underneath, learning and handling.</p>
        </div>
        <div className="signal">
          <strong>2 things need you.</strong>
          <span>Everything else is handled or waiting safely.</span>
        </div>
      </section>

      <section className="section">
        <span className="label">Connection check</span>
        <div className="connectorGrid">
          {connectors.map(([connector, state, icon]) => (
            <div className={`connector ${state}`} key={connector}>
              <span className="statusIcon">{icon}</span>
              <span>{connector}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section statusSection">
        <div className="sectionHeader">
          <div>
            <span className="label">Chief of staff view</span>
            <h2>Quiet by default.</h2>
          </div>
          <span className="microcopy">Details only when you ask.</span>
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
          Atlas retrieves your own history first, adapts behavior to each relationship, detects stale or missing context, and routes every action through a simple trust state: Handled, Review, or Needs you.
        </p>
      </section>
    </main>
  );
}
