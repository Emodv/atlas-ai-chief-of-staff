export default function InvitePage() {
  return (
    <main style={{minHeight:'100vh',background:'radial-gradient(circle at 50% 20%,rgba(110,79,255,.18),transparent 28%),#050710',color:'#fff',fontFamily:'Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',padding:'24px 16px 42px'}}>
      <section style={{width:'min(760px,100%)',margin:'0 auto'}}>
        <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,padding:'8px 0 56px'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:44,height:44,borderRadius:14,display:'grid',placeItems:'center',fontWeight:900,fontSize:26,background:'linear-gradient(145deg,#a45cff,#665dff)',boxShadow:'0 0 34px rgba(139,78,255,.45)'}}>A</div>
            <div><div style={{fontWeight:800,fontSize:24}}>Atlas.Moda</div><div style={{fontSize:10,letterSpacing:'.16em',color:'#9298ad',marginTop:5}}>AI CHIEF OF STAFF</div></div>
          </div>
          <span style={{border:'1px solid rgba(85,217,141,.35)',background:'rgba(85,217,141,.08)',borderRadius:999,padding:'8px 12px',fontSize:11,color:'#9be8ba'}}>PUBLIC BETA</span>
        </header>

        <section style={{textAlign:'center'}}>
          <div style={{fontSize:12,letterSpacing:'.16em',color:'#9d85d9',marginBottom:14}}>SECURE GOOGLE WORKSPACE CONNECTION</div>
          <h1 style={{fontSize:'clamp(42px,8vw,72px)',lineHeight:1.02,letterSpacing:'-.05em',margin:'0 0 22px'}}>Less chaos.<br/><span style={{background:'linear-gradient(90deg,#fff 0%,#c66cff 55%,#745cff 100%)',WebkitBackgroundClip:'text',color:'transparent'}}>More impact.</span></h1>
          <p style={{maxWidth:620,margin:'0 auto 28px',color:'#aeb4c7',fontSize:'clamp(17px,3.8vw,22px)',lineHeight:1.55}}>Atlas.Moda connects your Google workspace, finds what matters, and helps you act with less manual overhead.</p>

          <a href="/api/auth/google" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,textDecoration:'none',color:'#fff',fontSize:'clamp(19px,4vw,25px)',fontWeight:800,background:'linear-gradient(100deg,#b449ff,#685cff)',borderRadius:22,padding:'20px 26px',boxShadow:'0 14px 50px rgba(109,76,255,.25)'}}>
            <span style={{width:30,height:30,borderRadius:'50%',display:'grid',placeItems:'center',background:'#fff',color:'#4285f4',fontWeight:900}}>G</span>
            Continue with Google
          </a>

          <div style={{marginTop:16,fontSize:13,color:'#969eb1'}}>Read-only Google access to start · Gmail · Calendar · Contacts · Drive · Docs · Sheets</div>
        </section>

        <section style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:12,marginTop:42}}>
          {[
            ['Read-only first','Atlas requests read-only Google scopes during onboarding.'],
            ['Workspace isolated','Your connected workspace is kept logically separated from other users.'],
            ['Sensitive actions gated','High-consequence actions require explicit review instead of silent execution.'],
          ].map(([title,copy]) => <article key={title} style={{padding:20,border:'1px solid rgba(255,255,255,.08)',borderRadius:18,background:'rgba(12,15,29,.92)'}}><strong style={{display:'block',marginBottom:8}}>{title}</strong><span style={{color:'#9ba3b7',fontSize:13,lineHeight:1.5}}>{copy}</span></article>)}
        </section>

        <section style={{marginTop:22,padding:20,border:'1px solid rgba(255,255,255,.08)',borderRadius:18,background:'#0b0f18'}}>
          <strong>Google data use</strong>
          <p style={{color:'#9ba3b7',fontSize:13,lineHeight:1.6,marginBottom:0}}>Atlas.Moda uses Google Workspace data only to provide user-facing productivity, context, and assistant features. It does not sell Google user data or use it for advertising. Use of information received from Google Workspace APIs adheres to the Google User Data Policy, including the Limited Use requirements.</p>
        </section>

        <footer style={{display:'flex',justifyContent:'center',gap:18,flexWrap:'wrap',marginTop:28,fontSize:12,color:'#7e8798'}}>
          <a href="/privacy" style={{color:'#aeb6c5'}}>Privacy</a>
          <a href="/terms" style={{color:'#aeb6c5'}}>Terms</a>
          <a href="/security" style={{color:'#aeb6c5'}}>Security</a>
          <span>Atlas.Moda</span>
        </footer>
      </section>
    </main>
  );
}
