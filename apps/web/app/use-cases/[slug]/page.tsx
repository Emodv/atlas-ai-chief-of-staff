import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { seoPageMap, seoPages } from "../../../lib/seo-pages";

const baseUrl = "https://atlas.moda";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return seoPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = seoPageMap.get(slug);
  if (!page) return {};
  const url = `${baseUrl}/use-cases/${page.slug}`;
  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: url },
    openGraph: { title: page.title, description: page.description, url, siteName: "Atlas.Moda", type: "website" },
    twitter: { card: "summary_large_image", title: page.title, description: page.description },
  };
}

export default async function UseCasePage({ params }: Props) {
  const { slug } = await params;
  const page = seoPageMap.get(slug);
  if (!page) notFound();

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Atlas.Moda",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: baseUrl,
    description: page.description,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD", availability: "https://schema.org/OnlineOnly" },
  };

  return (
    <main style={{minHeight:"100vh",background:"radial-gradient(circle at 50% 12%,rgba(110,79,255,.16),transparent 25%),#050710",color:"#fff",fontFamily:'Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',padding:"22px 16px 56px"}}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(faqSchema)}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(softwareSchema)}} />
      <section style={{width:"min(860px,100%)",margin:"0 auto"}}>
        <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,padding:"8px 0 52px"}}>
          <a href="/" style={{display:"flex",alignItems:"center",gap:10,textDecoration:"none",color:"#fff"}}>
            <span style={{width:40,height:40,borderRadius:13,display:"grid",placeItems:"center",fontWeight:900,fontSize:23,background:"linear-gradient(145deg,#a45cff,#665dff)"}}>A</span>
            <span style={{fontWeight:800,fontSize:21}}>Atlas.Moda</span>
          </a>
          <a href="/api/auth/google" style={{textDecoration:"none",color:"#fff",border:"1px solid rgba(255,255,255,.14)",borderRadius:999,padding:"10px 14px",fontSize:13}}>Connect Google →</a>
        </header>

        <section style={{maxWidth:760}}>
          <div style={{fontSize:12,letterSpacing:".16em",color:"#a58ae8",marginBottom:14}}>{page.eyebrow}</div>
          <h1 style={{fontSize:"clamp(42px,8vw,72px)",lineHeight:1.02,letterSpacing:"-.045em",margin:"0 0 22px"}}>{page.h1}</h1>
          <p style={{color:"#b0b7c9",fontSize:"clamp(18px,3.5vw,22px)",lineHeight:1.6,margin:"0 0 18px"}}>{page.intro}</p>
          <p style={{color:"#838ba0",fontSize:15,lineHeight:1.6,marginBottom:30}}>{page.audience}</p>
          <a href="/api/auth/google" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",textDecoration:"none",color:"#fff",fontWeight:800,background:"linear-gradient(100deg,#b449ff,#685cff)",borderRadius:18,padding:"17px 22px",boxShadow:"0 14px 45px rgba(109,76,255,.22)"}}>Start with Google →</a>
          <div style={{marginTop:12,fontSize:12,color:"#7f879a"}}>Read-only Google access to start. Sensitive actions stay gated.</div>
        </section>

        <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12,marginTop:52}}>
          {page.outcomes.map((item) => <article key={item} style={{padding:20,border:"1px solid rgba(255,255,255,.08)",borderRadius:18,background:"rgba(12,15,29,.92)",color:"#dce0ea",lineHeight:1.5}}>{item}</article>)}
        </section>

        <section style={{marginTop:52}}>
          <div style={{fontSize:12,letterSpacing:".16em",color:"#a58ae8",marginBottom:12}}>HOW IT WORKS</div>
          <h2 style={{fontSize:"clamp(30px,5vw,46px)",margin:"0 0 22px"}}>Useful first. Autonomous later.</h2>
          <div style={{display:"grid",gap:12}}>
            {page.workflow.map((item,index) => <div key={item} style={{display:"grid",gridTemplateColumns:"44px 1fr",gap:14,alignItems:"start",padding:18,border:"1px solid rgba(255,255,255,.07)",borderRadius:16,background:"#090d17"}}><span style={{width:34,height:34,borderRadius:10,display:"grid",placeItems:"center",background:"rgba(132,92,255,.18)",color:"#c8b9ff",fontWeight:800}}>{index+1}</span><span style={{color:"#b7bece",lineHeight:1.6}}>{item}</span></div>)}
          </div>
        </section>

        <section style={{marginTop:52}}>
          <div style={{fontSize:12,letterSpacing:".16em",color:"#a58ae8",marginBottom:12}}>FAQ</div>
          <div style={{display:"grid",gap:12}}>
            {page.faq.map((item) => <details key={item.q} style={{padding:"18px 20px",border:"1px solid rgba(255,255,255,.08)",borderRadius:16,background:"#0a0e18"}}><summary style={{cursor:"pointer",fontWeight:750}}>{item.q}</summary><p style={{color:"#9ea6b8",lineHeight:1.65,marginBottom:0}}>{item.a}</p></details>)}
          </div>
        </section>

        <section style={{textAlign:"center",marginTop:56,padding:"34px 20px",border:"1px solid rgba(255,255,255,.09)",borderRadius:22,background:"linear-gradient(145deg,rgba(121,76,255,.13),rgba(12,15,29,.95))"}}>
          <h2 style={{fontSize:"clamp(28px,5vw,42px)",margin:"0 0 12px"}}>Give your attention back to the work that matters.</h2>
          <p style={{color:"#9ea6b8",margin:"0 auto 22px",maxWidth:620,lineHeight:1.6}}>Connect your Google Workspace, let Atlas.Moda surface the first useful signals, and keep control over consequential actions.</p>
          <a href="/api/auth/google" style={{display:"inline-flex",textDecoration:"none",color:"#fff",fontWeight:800,background:"linear-gradient(100deg,#b449ff,#685cff)",borderRadius:17,padding:"16px 21px"}}>Continue with Google →</a>
        </section>

        <footer style={{display:"flex",justifyContent:"center",gap:18,flexWrap:"wrap",marginTop:34,fontSize:12}}>
          <a href="/use-cases" style={{color:"#aeb6c5"}}>Use cases</a><a href="/privacy" style={{color:"#aeb6c5"}}>Privacy</a><a href="/security" style={{color:"#aeb6c5"}}>Security</a><a href="/terms" style={{color:"#aeb6c5"}}>Terms</a>
        </footer>
      </section>
    </main>
  );
}
