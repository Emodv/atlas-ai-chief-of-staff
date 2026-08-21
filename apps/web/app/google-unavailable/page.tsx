export default function GoogleUnavailablePage() {
  return (
    <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:'24px',background:'radial-gradient(circle at 50% 30%,rgba(129,80,255,.14),transparent 30%),#050710',color:'#fff',fontFamily:'Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>
      <section style={{width:'min(560px,100%)',textAlign:'center'}}>
        <div style={{width:58,height:58,borderRadius:18,display:'grid',placeItems:'center',margin:'0 auto 22px',fontSize:32,fontWeight:900,background:'linear-gradient(145deg,#a45cff,#665dff)',boxShadow:'0 0 36px rgba(139,78,255,.35)'}}>A</div>
        <div style={{fontSize:12,letterSpacing:'.18em',color:'#9d85d9',marginBottom:14}}>ATLAS · CONNECTION SETUP</div>
        <h1 style={{fontSize:'clamp(34px,8vw,52px)',lineHeight:1.02,letterSpacing:'-.045em',margin:'0 0 18px'}}>Google connection is almost ready.</h1>
        <p style={{fontSize:18,lineHeight:1.55,color:'#aeb4c7',margin:'0 auto 28px',maxWidth:480}}>Atlas is live, but Google sign-in still needs to be enabled for this workspace. Nothing was connected or changed.</p>
        <a href="/invite" style={{display:'flex',alignItems:'center',justifyContent:'center',textDecoration:'none',color:'#fff',fontSize:19,fontWeight:800,background:'linear-gradient(100deg,#b449ff,#685cff)',borderRadius:20,padding:'18px 22px',boxShadow:'0 14px 45px rgba(109,76,255,.22)'}}>Back to Atlas</a>
        <div style={{marginTop:18,color:'#747b90',fontSize:13}}>Safe Mode remains ON · Execution remains OFF</div>
      </section>
    </main>
  );
}
