const connectors = ["Gmail", "Calendar", "Contacts", "Drive", "Notion", "HubSpot"];

const stages = [
  ["1", "Connect", "Authorize the tools that already contain your operating history."],
  ["2", "Learn", "Atlas models language, tone, decisions, relationships, rhythms, and boundaries."],
  ["3", "Shadow", "Atlas predicts what you would do without taking consequential actions."],
  ["4", "Autopilot", "High-confidence, reversible categories graduate to autonomous execution."],
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <span className="eyebrow">ATLAS V2</span>
        <h1>Your digital twin for the noise layer.</h1>
        <p className="lede">
          Atlas learns how you communicate, decide, prioritize, and manage relationships — then quietly handles low-risk work the way you would.
        </p>
        <div className="actions">
          <button>Start onboarding</button>
          <a href="#how">See how Atlas learns</a>
        </div>
      </section>

      <section className="panel">
        <div>
          <span className="label">North star</span>
          <h2>Signal over noise.</h2>
          <p>People should open Atlas and see only what genuinely needs their attention.</p>
        </div>
        <div className="signal">
          <strong>2 things need you today.</strong>
          <span>Everything else is handled or waiting safely.</span>
        </div>
      </section>

      <section className="section">
        <span className="label">Connect your operating system</span>
        <div className="connectorGrid">
          {connectors.map((connector) => (
            <div className="connector" key={connector}>
              <span className="dot" />
              {connector}
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
          <h2>User Twin + Relationship Graph</h2>
        </div>
        <p>
          Atlas does not use one generic personality. It learns how the user behaves with each person and in each context, then measures confidence before acting.
        </p>
      </section>
    </main>
  );
}
