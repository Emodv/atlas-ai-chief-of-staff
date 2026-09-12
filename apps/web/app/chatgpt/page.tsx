export default function ChatGPTPage() {
  const endpoint = "https://atlas.moda/api/chatgpt/mcp";
  return (
    <main style={{minHeight:'100vh',background:'radial-gradient(circle at 50% 15%,rgba(110,79,255,.18),transparent 30%),#050710',color:'#fff',fontFamily:'Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',padding:'28px 16px 48px'}}>
      <section style={{width:'min(760px,100%)',margin:'0 auto'}}>
        <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,padding:'4px 0 52px'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:44,height:44,borderRadius:14,display:'grid',placeItems:'center',fontWeight:900,fontSize:26,background:'linear-gradient(145deg,#a45cff,#665dff)',boxShadow:'0 0 34px rgba(139,78,255,.45)'}}>A</div>
            <div><div style={{fontWeight:800,fontSize:24}}>Atlas.Moda</div><div style={{fontSize:10,letterSpacing:'.16em',color:'#9298ad',marginTop:5}}>CHATGPT · AI CHIEF OF STAFF</div></div>
          </div>
          <a href="/invite" style={{color:'#b8a6ef',fontSize:13}}>Atlas home</a>
        </header>

        <section style={{textAlign:'center'}}>
          <div style={{fontSize:12,letterSpacing:'.16em',color:'#9d85d9',marginBottom:14}}>PRIMARY INTERFACE</div>
          <h1 style={{fontSize:'clamp(40px,8vw,68px)',lineHeight:1.03,letterSpacing:'-.045em',margin:'0 0 20px'}}>Talk to Atlas<br/><span style={{background:'linear-gradient(90deg,#fff 0%,#c66cff 55%,#745cff 100%)',WebkitBackgroundClip:'text',color:'transparent'}}>inside ChatGPT.</span></h1>
          <p style={{maxWidth:640,margin:'0 auto',color:'#aeb4c7',fontSize:'clamp(17px,3.8vw,21px)',lineHeight:1.55}}>Atlas supplies your private business context, opportunities, relationships and action queue. ChatGPT becomes the conversational surface.</p>
        </section>

        <section style={{marginTop:38,display:'grid',gap:12}}>
          {[
            ['1. Create your Atlas workspace','Sign in to Atlas.Moda and complete onboarding so Atlas has a tenant-isolated workspace.'],
            ['2. Connect Atlas to ChatGPT','Use the Atlas MCP endpoint as the ChatGPT app/connector endpoint. OAuth keeps the workspace private.'],
            ['3. Talk normally','Ask for a morning briefing, money-making opportunities, follow-ups, approvals, or neglected opportunities.'],
          ].map(([title,copy]) => <article key={title} style={{padding:20,border:'1px solid rgba(255,255,255,.08)',borderRadius:18,background:'rgba(12,15,29,.92)'}}><strong style={{display:'block',marginBottom:8,fontSize:17}}>{title}</strong><span style={{color:'#9ba3b7',fontSize:14,lineHeight:1.55}}>{copy}</span></article>)}
        </section>

        <section style={{marginTop:20,padding:20,border:'1px solid rgba(160,119,255,.25)',borderRadius:18,background:'rgba(85,61,160,.10)'}}>
          <div style={{fontSize:11,letterSpacing:'.14em',color:'#bda6ff',marginBottom:9}}>CHATGPT MCP ENDPOINT</div>
          <code style={{display:'block',overflowWrap:'anywhere',fontSize:13,color:'#f3f4f7'}}>{endpoint}</code>
        </section>

        <section style={{marginTop:30}}>
          <div style={{fontSize:11,letterSpacing:'.14em',color:'#9d85d9',marginBottom:12}}>TRY THESE</div>
          <div style={{display:'grid',gap:10}}>
            {["Atlas, give me my morning briefing.","Atlas, what should I do today to make money?","Who should I follow up with today?","What needs my approval?","What opportunities am I neglecting?"].map(prompt => <div key={prompt} style={{padding:'14px 16px',border:'1px solid rgba(255,255,255,.07)',borderRadius:14,background:'#090d17',color:'#dce1ed',fontSize:14}}>{prompt}</div>)}
          </div>
        </section>

        <section style={{marginTop:30,padding:20,border:'1px solid rgba(255,255,255,.08)',borderRadius:18,background:'#0b0f18'}}>
          <strong>Default brief</strong>
          <p style={{color:'#9ba3b7',fontSize:13,lineHeight:1.65,marginBottom:0}}>Atlas compresses the workspace into four sections: MAKE MONEY, PROTECT REVENUE, NEEDS YOU, and HANDLED. Raw tables stay hidden unless you ask for them.</p>
        </section>
      </section>
    </main>
  );
}
