export default function InvitePage() {
  return (
    <main className="inviteShell">
      <section className="inviteWrap">
        <header className="inviteHeader">
          <div className="brandLockup">
            <div className="atlasGlyph">A</div>
            <div><div className="atlasName">Atlas</div><div className="atlasSub">AI CHIEF OF STAFF</div></div>
          </div>
          <span className="alphaPill">PRIVATE ALPHA</span>
        </header>

        <section className="inviteHero">
          <h1>You’re invited.<br/><span>Less chaos. More impact.</span></h1>
          <p>Atlas handles the busywork so you can focus on what truly matters.</p>

          <a className="joinAtlas" href="/api/auth/google">
            <span className="spark">✦</span>
            Join Atlas Free
          </a>
          <div className="microcopy">Free <b>•</b> Takes 30 seconds <b>•</b> No credit card</div>
          <div className="privacyLine">⌾ Always private. Your workspace is isolated and execution starts OFF.</div>
        </section>

        <section className="atlasHub" aria-label="Atlas connects your work">
          <div className="integration left top"><span className="gmail">M</span></div>
          <div className="integration left bottom"><span className="calendar">31</span></div>
          <div className="integration right top"><span className="slack">#</span></div>
          <div className="integration right bottom"><span className="notion">N</span></div>
          <div className="hubCore"><div className="hubBack h1"></div><div className="hubBack h2"></div><div className="hubLogo">A</div></div>
        </section>

        <section className="benefitRow">
          <div><span>✉</span><small>Inbox zero</small></div>
          <div><span>◎</span><small>What matters</small></div>
          <div><span>ϟ</span><small>Takes action</small></div>
          <div><span>◇</span><small>Always safe</small></div>
        </section>

        <section className="impactCard">
          <div><strong>2.5+</strong><span>Hours saved<br/>this week</span></div>
          <div className="divider" />
          <div><strong>↗</strong><span>Focus on<br/>what moves you forward</span></div>
        </section>

        <footer>Private alpha · Always private · You stay in control</footer>
      </section>

      <style>{`
        *{box-sizing:border-box} body{margin:0;background:#050710;color:#fff}
        .inviteShell{min-height:100vh;background:radial-gradient(circle at 50% 44%,rgba(109,63,255,.13),transparent 34%),linear-gradient(180deg,#060812 0%,#03050b 100%);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:28px 18px 42px}
        .inviteWrap{width:min(760px,100%);margin:0 auto}
        .inviteHeader{display:flex;align-items:center;justify-content:space-between;margin-bottom:72px}.brandLockup{display:flex;gap:12px;align-items:center}.atlasGlyph{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;font-weight:900;font-size:28px;background:linear-gradient(145deg,#a45cff,#665dff);box-shadow:0 0 34px rgba(139,78,255,.5)}.atlasName{font-weight:800;font-size:25px;line-height:1}.atlasSub{font-size:11px;letter-spacing:.16em;color:#9298ad;margin-top:7px}.alphaPill{border:1px solid rgba(146,86,255,.45);border-radius:999px;padding:9px 14px;font-size:11px;letter-spacing:.13em;color:#bc85ff}
        .inviteHero{text-align:center}.inviteHero h1{font-size:clamp(42px,8vw,72px);line-height:1.02;letter-spacing:-.05em;margin:0}.inviteHero h1 span{background:linear-gradient(90deg,#fff 0%,#fff 28%,#bb58ff 55%,#745cff 100%);-webkit-background-clip:text;color:transparent}.inviteHero p{max-width:610px;margin:24px auto 28px;color:#aeb4c7;font-size:clamp(17px,3.8vw,23px);line-height:1.5}
        .joinAtlas{display:flex;align-items:center;justify-content:center;gap:12px;text-decoration:none;color:#fff;font-size:clamp(20px,4vw,28px);font-weight:800;background:linear-gradient(100deg,#b449ff,#685cff);border-radius:24px;padding:22px 28px;box-shadow:0 14px 50px rgba(109,76,255,.25);transition:.2s transform,.2s box-shadow}.joinAtlas:hover{transform:translateY(-2px);box-shadow:0 18px 60px rgba(109,76,255,.35)}.spark{font-size:28px}.microcopy{color:#9ba1b5;margin-top:18px;font-size:14px}.microcopy b{color:#8c55ff;margin:0 7px}.privacyLine{font-size:13px;color:#81889c;margin-top:14px}
        .atlasHub{height:330px;position:relative;margin:56px auto 20px;max-width:620px}.hubCore{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:170px;height:170px}.hubBack,.hubLogo{position:absolute;inset:0;border-radius:34px;border:1px solid rgba(132,79,255,.35);background:linear-gradient(145deg,rgba(35,31,71,.9),rgba(11,13,27,.95))}.hubBack.h1{transform:translate(-20px,18px);opacity:.35}.hubBack.h2{transform:translate(20px,18px);opacity:.35}.hubLogo{display:grid;place-items:center;font-size:76px;font-weight:900;color:#b15cff;box-shadow:inset 0 0 40px rgba(105,70,255,.13),0 0 40px rgba(93,67,255,.13)}.integration{position:absolute;width:70px;height:70px;border-radius:20px;border:1px solid rgba(255,255,255,.06);background:#0b0f1a;display:grid;place-items:center;box-shadow:0 14px 30px rgba(0,0,0,.25)}.integration.left{left:6%}.integration.right{right:6%}.integration.top{top:22%}.integration.bottom{bottom:22%}.integration span{font-weight:900;font-size:24px}.gmail{color:#ff5e61}.calendar{color:#6fa4ff}.slack{color:#62d0ff}.notion{color:#fff}
        .benefitRow{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:10px 0 28px}.benefitRow div{text-align:center}.benefitRow span{width:56px;height:56px;margin:0 auto 10px;border-radius:16px;border:1px solid rgba(255,255,255,.06);background:#0a0d17;display:grid;place-items:center;color:#a05cff;font-size:25px}.benefitRow small{color:#d1d4df;font-size:12px}
        .impactCard{display:grid;grid-template-columns:1fr 1px 1fr;gap:24px;padding:28px;border:1px solid rgba(255,255,255,.07);border-radius:24px;background:linear-gradient(145deg,rgba(12,15,29,.96),rgba(8,10,20,.96));align-items:center}.impactCard>div:not(.divider){display:flex;align-items:center;gap:18px}.impactCard strong{font-size:42px;color:#8e5cff}.impactCard span{color:#b5bacb;line-height:1.45}.divider{height:70px;background:rgba(255,255,255,.07)}footer{text-align:center;color:#73798b;font-size:12px;margin-top:28px}
        @media(max-width:560px){.inviteShell{padding:24px 16px 34px}.inviteHeader{margin-bottom:54px}.alphaPill{font-size:9px;padding:7px 10px}.atlasGlyph{width:40px;height:40px;font-size:24px}.atlasName{font-size:22px}.atlasSub{font-size:9px}.inviteHero h1{font-size:44px}.inviteHero p{font-size:17px;margin-top:20px}.joinAtlas{border-radius:20px;padding:19px 22px;font-size:21px}.atlasHub{height:275px;margin-top:38px}.hubCore{width:135px;height:135px}.hubLogo{font-size:60px;border-radius:28px}.integration{width:56px;height:56px;border-radius:16px}.integration.left{left:4%}.integration.right{right:4%}.benefitRow span{width:48px;height:48px}.benefitRow small{font-size:10px}.impactCard{padding:22px 18px;gap:14px}.impactCard strong{font-size:35px}.impactCard span{font-size:12px}}
      `}</style>
    </main>
  );
}
