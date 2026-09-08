type GoogleUnavailablePageProps = {
  searchParams?: Promise<{ from?: string }>;
};

const PRODUCTION_ORIGIN = "https://atlas.moda";

export default async function GoogleUnavailablePage({ searchParams }: GoogleUnavailablePageProps) {
  const params = (await searchParams) ?? {};
  const workspace = params.from === "workspace";
  const retryHref = `${PRODUCTION_ORIGIN}/api/auth/google${workspace ? "?workspace=1&return=first-scan" : ""}`;

  return (
    <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:'24px',background:'radial-gradient(circle at 50% 30%,rgba(129,80,255,.14),transparent 30%),#050710',color:'#fff',fontFamily:'Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>
      <section style={{width:'min(560px,100%)',textAlign:'center'}}>
        <div style={{width:58,height:58,borderRadius:18,display:'grid',placeItems:'center',margin:'0 auto 22px',fontSize:32,fontWeight:900,background:'linear-gradient(145deg,#a45cff,#665dff)',boxShadow:'0 0 36px rgba(139,78,255,.35)'}}>A</div>
        <div style={{fontSize:12,letterSpacing:'.18em',color:'#9d85d9',marginBottom:14}}>ATLAS.MODA · CONNECTION SETUP</div>
        <h1 style={{fontSize:'clamp(34px,8vw,52px)',lineHeight:1.02,letterSpacing:'-.045em',margin:'0 0 18px'}}>Google connection needs attention.</h1>
        <p style={{fontSize:18,lineHeight:1.55,color:'#aeb4c7',margin:'0 auto 28px',maxWidth:480}}>This preview could not complete Google authorization. Continue securely on Atlas.Moda to finish the connection.</p>
        <a href={retryHref} style={{display:'flex',alignItems:'center',justifyContent:'center',textDecoration:'none',color:'#fff',fontSize:19,fontWeight:800,background:'linear-gradient(100deg,#b449ff,#685cff)',borderRadius:20,padding:'18px 22px',boxShadow:'0 14px 45px rgba(109,76,255,.22)'}}>Continue with Google</a>
        <a href="/invite" style={{display:'inline-block',marginTop:18,textDecoration:'none',color:'#9ca4ba',fontSize:14}}>Back to Atlas.Moda</a>
        <div style={{marginTop:18,color:'#747b90',fontSize:13}}>No external action was taken</div>
      </section>
    </main>
  );
}
