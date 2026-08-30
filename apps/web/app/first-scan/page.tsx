"use client";

import { useEffect, useState } from "react";

type Finding = { source: string; title: string; context: string; score: number; next_action: string };

export default function FirstScanPage() {
  const [state, setState] = useState<"checking" | "connect" | "scanning" | "done" | "error">("checking");
  const [findings, setFindings] = useState<Finding[]>([]);
  const [filtered, setFiltered] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("workspace") === "required") {
      setState("connect");
      return;
    }

    setState("scanning");
    fetch("/api/first-scan", { method: "POST", cache: "no-store" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok || !data.ok) throw new Error(data.error || "scan-failed");
        setFindings(data.findings || []);
        setFiltered(Number(data.filtered || 0));
        setState("done");
      })
      .catch((e) => { setError(String(e.message || e)); setState("error"); });
  }, []);

  return (
    <main className="scanShell">
      <section className="scanCard">
        <div className="scanBrand"><div className="scanLogo">A</div><span>Atlas</span></div>

        {state === "checking" && <div className="scanCenter"><div className="orb"><span>A</span></div></div>}

        {state === "connect" && (
          <div className="scanCenter">
            <div className="orb"><span>A</span></div>
            <span className="eyebrow" style={{marginTop:42}}>STEP 2 · WORKSPACE ACCESS</span>
            <h1 style={{marginTop:12}}>Connect what Atlas should read.</h1>
            <p>Your Google sign-in is complete. Add read-only Gmail, Calendar, and Contacts access so Atlas can surface what deserves attention.</p>
            <a className="continueBtn" style={{width:"min(520px,100%)"}} href="/api/auth/google?workspace=1">Connect Workspace →</a>
            <div className="safeNote">Read-only · No Drive, Docs, or Sheets requested · Revoke anytime</div>
          </div>
        )}

        {state === "scanning" && (
          <div className="scanCenter">
            <div className="orb"><span>A</span></div>
            <div className="scanLine" />
            <h1>Understanding your day.</h1>
            <p>Reading only what you approved. Nothing is sent, changed, or deleted.</p>
          </div>
        )}

        {state === "done" && (
          <>
            <div className="wowHead">
              <span className="eyebrow">FIRST VALUE</span>
              <h1>{findings.length ? `${findings.length} things deserve your attention.` : "You’re clear right now."}</h1>
              <p>{filtered ? `Atlas reviewed ${filtered} recent signals and kept the rest out of your way.` : "Atlas is connected and ready to keep watching for what matters."}</p>
            </div>
            <div className="findingList">
              {findings.map((f, i) => (
                <article className="finding" key={`${f.source}-${i}`}>
                  <div className="rank">{i + 1}</div>
                  <div className="findingText"><span>{f.source.toUpperCase()} · {Math.round(f.score)}/100</span><h2>{f.title}</h2><p>{f.context}</p><small>{f.next_action}</small></div>
                </article>
              ))}
            </div>
            <a className="continueBtn" href="/decisions">Open my Command Center →</a>
            <div className="safeNote">Safe Mode is ON · Execution is OFF · You stay in control</div>
          </>
        )}

        {state === "error" && (
          <div className="scanCenter">
            <div className="orb muted"><span>A</span></div>
            <h1>One connection left.</h1>
            <p>{error.includes("google-read-access") ? "Connect read-only Gmail and Calendar access so Atlas can complete your first scan." : "Atlas could not complete the first scan yet."}</p>
            <a className="continueBtn" href="/api/auth/google?workspace=1">Connect Workspace →</a>
          </div>
        )}
      </section>

      <style>{`
        *{box-sizing:border-box}body{margin:0;background:#050710;color:white}.scanShell{min-height:100vh;background:radial-gradient(circle at 50% 28%,rgba(118,67,255,.18),transparent 34%),#050710;font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;padding:26px 16px}.scanCard{width:min(720px,100%);margin:0 auto}.scanBrand{display:flex;align-items:center;gap:11px;font-size:23px;font-weight:800}.scanLogo{width:40px;height:40px;border-radius:12px;background:linear-gradient(145deg,#b257ff,#655cff);display:grid;place-items:center;font-size:25px;box-shadow:0 0 26px rgba(138,76,255,.35)}.scanCenter{min-height:78vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.orb{width:146px;height:146px;border-radius:38px;border:1px solid rgba(153,95,255,.45);background:linear-gradient(145deg,#17162f,#0b0d18);display:grid;place-items:center;box-shadow:0 0 70px rgba(110,72,255,.2);position:relative}.orb:after{content:"";position:absolute;inset:-18px;border-radius:46px;border:1px solid rgba(115,79,255,.16)}.orb span{font-size:70px;font-weight:900;color:#aa59ff}.orb.muted{opacity:.65}.scanLine{width:180px;height:2px;margin:44px 0 28px;background:linear-gradient(90deg,transparent,#8d5cff,transparent);animation:pulse 1.2s infinite}.scanCenter h1,.wowHead h1{font-size:clamp(36px,7vw,58px);letter-spacing:-.045em;line-height:1.05;margin:0}.scanCenter p,.wowHead p{color:#aeb4c8;font-size:17px;line-height:1.55;max-width:540px}.eyebrow{color:#a96eff;font-size:11px;font-weight:800;letter-spacing:.18em}.wowHead{text-align:center;padding:76px 0 32px}.wowHead h1{margin-top:12px}.findingList{display:grid;gap:12px}.finding{display:flex;gap:16px;padding:20px;border:1px solid rgba(255,255,255,.07);border-radius:20px;background:linear-gradient(145deg,rgba(15,17,31,.96),rgba(8,10,19,.96))}.rank{width:36px;height:36px;flex:0 0 36px;border-radius:11px;background:rgba(132,80,255,.12);color:#a66bff;display:grid;place-items:center;font-weight:800}.findingText>span{color:#8f96aa;font-size:10px;letter-spacing:.1em}.findingText h2{font-size:18px;margin:5px 0}.findingText p{color:#aeb3c2;font-size:13px;margin:0 0 8px}.findingText small{color:#7f8799}.continueBtn{display:flex;justify-content:center;text-decoration:none;color:#fff;background:linear-gradient(100deg,#b448ff,#665cff);border-radius:20px;padding:18px 24px;margin-top:24px;font-size:18px;font-weight:800;box-shadow:0 14px 40px rgba(105,75,255,.2)}.safeNote{text-align:center;color:#71788b;font-size:11px;margin-top:15px}@keyframes pulse{0%,100%{opacity:.35;transform:scaleX(.7)}50%{opacity:1;transform:scaleX(1)}}
      `}</style>
    </main>
  );
}
