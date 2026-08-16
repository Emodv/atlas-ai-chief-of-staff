const mcpUrl = "https://atlas-ai-chief-of-staff.vercel.app/api/mcp";

const atlasPrompt = `Start Atlas V2 for me now.

Atlas MCP server: ${mcpUrl}

Goal: turn ChatGPT into my personalized AI Chief of Staff using Atlas.

Do this with the least possible friction:
1. Check whether Atlas is already available in this ChatGPT account.
2. If Atlas needs to be added, guide me through the minimum required action one step at a time. Do not make me copy/paste the MCP URL unless there is absolutely no alternative.
3. Once available, call atlas_status and atlas_connection_health.
4. Help me connect the sources Atlas needs, starting with Gmail, Calendar, Contacts, Drive, Notion, and HubSpot where available.
5. Then start Learning Mode to learn my tone, language, relationships, routines, preferences, and decision patterns.
6. Run Shadow Mode before allowing autonomous actions.
7. Keep the experience minimal: checkmarks for completed items, one blocker at a time, and no long explanations unless I ask.

Use Atlas trust states: Handled, Review, Needs you. Start now.`;

const chatGptUrl = `https://chatgpt.com/?q=${encodeURIComponent(atlasPrompt)}`;

export default function SetupPage() {
  return (
    <main className="setupMain">
      <section className="setupHero">
        <span className="eyebrow">ATLAS V2</span>
        <h1>One tap.<br />Atlas starts.</h1>
        <p className="lede">Open ChatGPT with Atlas already queued up. No URLs to copy. No setup guide to read.</p>

        <a className="launchAtlas" href={chatGptUrl} target="_blank" rel="noreferrer">
          <span>Open Atlas in ChatGPT</span>
          <span aria-hidden="true">→</span>
        </a>
        <p className="launchNote">The setup prompt is preloaded. If ChatGPT does not send it automatically, tap <strong>Send</strong>.</p>
      </section>

      <section className="easyFlow" aria-label="Atlas setup steps">
        <article>
          <span className="stepCheck">1</span>
          <div><h3>Open ChatGPT</h3><p>Atlas tells ChatGPT exactly what to do.</p></div>
        </article>
        <article>
          <span className="stepCheck">2</span>
          <div><h3>Approve access</h3><p>Only when ChatGPT asks for a connection or permission.</p></div>
        </article>
        <article>
          <span className="stepCheck">✓</span>
          <div><h3>Done</h3><p>Atlas verifies, learns, then moves into Shadow Mode.</p></div>
        </article>
      </section>

      <section className="setupPromise">
        <span className="label">WHAT HAPPENS NEXT</span>
        <h2>Atlas does the setup with you.</h2>
        <p>It checks itself, checks connections, learns how you communicate, builds your relationship context, and tells you only when it actually needs something.</p>
        <div className="miniStates">
          <span>✅ Handled</span>
          <span>⚠️ Review</span>
          <span>🔴 Needs you</span>
        </div>
      </section>

      <details className="advancedSetup">
        <summary>Advanced setup</summary>
        <p>Atlas MCP endpoint: <code>{mcpUrl}</code></p>
      </details>
    </main>
  );
}
