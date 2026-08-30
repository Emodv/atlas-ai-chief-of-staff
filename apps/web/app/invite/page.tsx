const useCases = [
  ["AI Chief of Staff", "/use-cases/ai-chief-of-staff"],
  ["Gmail AI Assistant", "/use-cases/gmail-ai-assistant"],
  ["Meeting Prep AI", "/use-cases/meeting-prep-ai"],
  ["Personal CRM AI", "/use-cases/personal-crm-ai"],
  ["Founder AI Assistant", "/use-cases/founder-ai-assistant"],
  ["Google Workspace AI", "/use-cases/google-workspace-ai-assistant"],
];

export default function InvitePage() {
  return (
    <main style={{minHeight:'100vh',background:'radial-gradient(circle at 50% 20%,rgba(110,79,255,.18),transparent 28%),#050710',color:'#fff',fontFamily:'Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',padding:'24px 16px 42px'}}>
      <section style={{width:'min(800px,100%)',margin:'0 auto'}}>
        <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,padding:'8px 0 56px'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:44,height:44,borderRadius:14,display:'grid',placeItems:'center',fontWeight:900,fontSize:26,background:'linear-gradient(145deg,#a45cff,#665dff)',boxShadow:'0 0 34px rgba(139,78,255,.45)'}}>A</div>
            <div><div style={{fontWeight:800,fontSize:24}}>Atlas.Moda</div><div style={{fontSize:10,letterSpacing:'.16em',color:'#9298ad',marginTop:5}}>AI CHIEF OF STAFF</div></div>
          </div>
          <span style={{border:'1px solid rgba(85,217,141,.35)',background:'rgba(85,217,141,.08)',borderRadius:999,padding:'8px 12px',fontSize:11,color:'#9be8ba'}}>PUBLIC BETA</span>
        </header>

        <section style={{textAlign:'center'}}>
          <div style={{fontSize:12,letterSpacing:'.16em',color:'#9d85d9',marginBottom:14}}>YOUR AI CHIEF OF STAFF</div>
          <h1 style={{fontSize:'clamp(42px,8vw,72px)',lineHeight:1.02,letterSpacing:'-.05em',margin:'0 0 22px'}}>Less inbox.<br/><span style={{background:'linear-gradient(90deg,#fff 0%,#c66cff 55%,#745cff 100%)',WebkitBackgroundClip:'text',color:'transparent'}}>More judgment.</span></h1>
          <p style={{maxWidth:650,margin:'0 auto 28px',color:'#aeb4c7',fontSize:'clamp(17px,3.8vw,22px)',lineHeight:1.55}}>Create your private Atlas workspace first. Then connect Google Workspace and other systems only when you choose.</p>

          <a href="/login?mode=signup" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,textDecoration:'none',color:'#fff',fontSize:'clamp(19px,4vw,25px)',fontWeight:800,background:'linear-gradient(100deg,#b449ff,#685cff)',borderRadius:22,padding:'20px 26px',boxShadow:'0 14px 50px rgba(109,76,255,.25)'}}>
            Create my Atlas workspace →
          </a>
          <a href="/login" style={{display:'inline-block',marginTop:16,color:'#b8a6ef',fontSize:14}}>Already have an account? Sign in</a>

          <div style={{marginTop:16,fontSize:13,color:'#969eb1'}}>No Google access is required to create an account.</div>
          <div style={{marginTop:8,fontSize:12,color:'#747d91'}}>Connect Gmail, Calendar and Contacts later from your private workspace.</div>
        </section>

        <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:12,marginTop:42}}>
          {[
            ['1 · Create','Create a private, isolated Atlas workspace.'],
            ['2 · Teach','Tell Atlas what matters, what to protect, and how much autonomy to use.'],
            ['3 · Connect','Add Google and other systems later. Connections are optional and revocable.'],
          ].map(([title,copy]) => <article key={title} style={{padding:20,border:'1px solid rgba(255,255,255,.08)',borderRadius:18,background:'rgba(12,15,29,.92)'}}><strong style={{display:'block',marginBottom:8}}>{title}</strong><span style={{color:'#9ba3b7',fontSize:13,lineHeight:1.5}}>{copy}</span></article>)}
        </section>

        <section style={{marginTop:42}}>
          <div style={{fontSize:11,letterSpacing:'.15em',color:'#9d85d9',marginBottom:12}}>BUILT FOR REAL WORK</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:10}}>
            {useCases.map(([label,href]) => <a key={href} href={href} style={{textDecoration:'none',color:'#dce1ed',padding:'15px 16px',border:'1px solid rgba(255,255,255,.07)',borderRadius:14,background:'#090d17',fontSize:13}}>{label} →</a>)}
          </div>
          <div style={{textAlign:'center',marginTop:16}}><a href="/use-cases" style={{color:'#b8a6ef',fontSize:13}}>See all 10 use cases →</a></div>
        </section>

        <section style={{marginTop:28,padding:20,border:'1px solid rgba(255,255,255,.08)',borderRadius:18,background:'#0b0f18'}}>
          <strong>Privacy-forward by design</strong>
          <p style={{color:'#9ba3b7',fontSize:13,lineHeight:1.6,marginBottom:0}}>Atlas.Moda uses connected data only to provide user-facing productivity, context, and chief-of-staff features. Sensitive and consequential actions stay gated by default.</p>
        </section>

        <footer style={{display:'flex',justifyContent:'center',gap:18,flexWrap:'wrap',marginTop:28,fontSize:12,color:'#7e8798'}}>
          <a href="/use-cases" style={{color:'#aeb6c5'}}>Use cases</a>
          <a href="/privacy" style={{color:'#aeb6c5'}}>Privacy</a>
          <a href="/terms" style={{color:'#aeb6c5'}}>Terms</a>
          <a href="/security" style={{color:'#aeb6c5'}}>Security</a>
          <span>Atlas.Moda</span>
        </footer>
      </section>
    </main>
  );
}
