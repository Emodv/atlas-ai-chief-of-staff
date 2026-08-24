import type { Metadata } from "next";
import { seoPages } from "../../lib/seo-pages";

export const metadata: Metadata = {
  title: { absolute: "Atlas.Moda Use Cases | AI Chief of Staff for Google Workspace" },
  description: "Explore Atlas.Moda use cases for Gmail, Calendar, meeting preparation, relationship memory, founder operations, and executive productivity.",
  alternates: { canonical: "https://atlas.moda/use-cases" },
};

export default function UseCasesPage() {
  return (
    <main style={{minHeight:"100vh",background:"#050710",color:"#fff",fontFamily:'Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',padding:"24px 16px 56px"}}>
      <section style={{width:"min(900px,100%)",margin:"0 auto"}}>
        <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0 54px"}}>
          <a href="/" style={{color:"#fff",textDecoration:"none",fontSize:22,fontWeight:850}}>Atlas.Moda</a>
          <a href="/api/auth/google" style={{color:"#fff",textDecoration:"none",border:"1px solid rgba(255,255,255,.14)",borderRadius:999,padding:"10px 14px",fontSize:13}}>Connect Google →</a>
        </header>
        <div style={{fontSize:12,letterSpacing:".16em",color:"#a58ae8",marginBottom:14}}>USE CASES</div>
        <h1 style={{fontSize:"clamp(42px,8vw,68px)",lineHeight:1.03,letterSpacing:"-.045em",margin:"0 0 20px"}}>One AI operating layer for the work already in your Google Workspace.</h1>
        <p style={{maxWidth:720,color:"#aeb4c7",fontSize:20,lineHeight:1.6,marginBottom:40}}>Atlas.Moda is designed to reduce coordination overhead while keeping sensitive actions under explicit review.</p>
        <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14}}>
          {seoPages.map((page) => (
            <a key={page.slug} href={`/use-cases/${page.slug}`} style={{display:"block",textDecoration:"none",color:"#fff",padding:22,border:"1px solid rgba(255,255,255,.08)",borderRadius:18,background:"#0b0f18"}}>
              <div style={{fontSize:10,letterSpacing:".14em",color:"#9f88db",marginBottom:9}}>{page.eyebrow}</div>
              <strong style={{display:"block",fontSize:20,lineHeight:1.3,marginBottom:9}}>{page.h1}</strong>
              <span style={{color:"#98a0b3",fontSize:13,lineHeight:1.55}}>{page.description}</span>
            </a>
          ))}
        </section>
        <footer style={{display:"flex",justifyContent:"center",gap:18,flexWrap:"wrap",marginTop:34,fontSize:12}}><a href="/privacy" style={{color:"#aeb6c5"}}>Privacy</a><a href="/security" style={{color:"#aeb6c5"}}>Security</a><a href="/terms" style={{color:"#aeb6c5"}}>Terms</a></footer>
      </section>
    </main>
  );
}
