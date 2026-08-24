import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "What Is an AI Chief of Staff? Practical Guide",
  description: "A practical guide to AI chiefs of staff: what they do, how they differ from chatbots and assistants, useful workflows, and the trust controls they need.",
  alternates: { canonical: "https://atlas.moda/guides/what-is-an-ai-chief-of-staff" },
};

const sections = [
  ["What is an AI chief of staff?", "An AI chief of staff is a context-aware productivity layer that helps a person identify priorities, preserve commitments, prepare decisions, and coordinate follow-up across the systems where work already happens. The useful version is not simply a chatbot with a new label. It needs persistent context, relationship awareness, access controls, and a clear boundary between suggestions and actions."],
  ["The problem it solves", "Modern knowledge work is fragmented. Important context lives across email, calendars, contacts, documents, spreadsheets, CRM systems, and notes. The expensive part is often not doing the final task; it is repeatedly finding the right context, deciding what deserves attention, and remembering what is still open."],
  ["AI chief of staff vs. AI assistant", "A general AI assistant usually responds to a prompt. A chief-of-staff layer should continuously organize authorized context around a user's priorities. It should know which relationships matter, what commitments are open, what is urgent, and which decisions are too consequential to automate."],
  ["Useful workflows", "High-value workflows include inbox prioritization, meeting preparation, relationship memory, stale follow-up detection, commitment tracking, context packets, and preparation of low-risk next actions. These workflows become more useful when email, calendar, contacts, and files are considered together instead of as isolated apps."],
  ["Why trust controls matter", "Giving an AI broad account access without staged trust creates unnecessary risk. A safer pattern is read-only first, evidence collection, shadow behavior, review, and only then tightly scoped execution for reversible low-consequence actions. Financial, legal, security, account-changing, or otherwise sensitive actions should remain behind stronger review controls."],
  ["What Atlas.Moda does differently", "Atlas.Moda is being built around a Digital Twin, Relationship Graph, durable context, and a trust engine. The public beta begins with read-only Google Workspace access and focuses on surfacing useful signals while keeping consequential actions gated."],
];

export default function GuidePage() {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "What Is an AI Chief of Staff? A Practical Guide",
    description: "A practical guide to AI chief-of-staff systems and safe work automation.",
    author: { "@type": "Organization", name: "Atlas.Moda" },
    publisher: { "@type": "Organization", name: "Atlas.Moda" },
    mainEntityOfPage: "https://atlas.moda/guides/what-is-an-ai-chief-of-staff",
  };
  return (
    <main style={{minHeight:"100vh",background:"#050710",color:"#fff",fontFamily:'Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',padding:"24px 16px 60px"}}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(articleSchema)}} />
      <article style={{width:"min(780px,100%)",margin:"0 auto"}}>
        <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0 54px"}}><a href="/" style={{color:"#fff",textDecoration:"none",fontSize:22,fontWeight:850}}>Atlas.Moda</a><a href="/api/auth/google" style={{color:"#fff",textDecoration:"none",border:"1px solid rgba(255,255,255,.14)",borderRadius:999,padding:"10px 14px",fontSize:13}}>Try Atlas →</a></header>
        <div style={{fontSize:12,letterSpacing:".16em",color:"#a58ae8",marginBottom:14}}>GUIDE</div>
        <h1 style={{fontSize:"clamp(42px,8vw,68px)",lineHeight:1.03,letterSpacing:"-.045em",margin:"0 0 20px"}}>What is an AI chief of staff?</h1>
        <p style={{color:"#aeb4c7",fontSize:21,lineHeight:1.65,marginBottom:42}}>The useful answer is not “a chatbot for executives.” It is a system that reduces the coordination cost between information, judgment, relationships, and action.</p>
        {sections.map(([title,body]) => <section key={title} style={{padding:"25px 0",borderTop:"1px solid rgba(255,255,255,.08)"}}><h2 style={{fontSize:28,margin:"0 0 12px"}}>{title}</h2><p style={{color:"#a4acbd",fontSize:16,lineHeight:1.75,margin:0}}>{body}</p></section>)}
        <section style={{marginTop:28,padding:26,border:"1px solid rgba(255,255,255,.08)",borderRadius:20,background:"#0b0f18"}}><h2 style={{marginTop:0}}>A practical starting point</h2><p style={{color:"#a4acbd",lineHeight:1.7}}>Start with sources that already contain useful context, ask for the minimum permissions required, prove value through read-only prioritization, and expand automation only when the behavior is predictable and reversible.</p><a href="/use-cases/ai-chief-of-staff" style={{color:"#c2b1ff"}}>See the Atlas.Moda AI chief of staff use case →</a></section>
        <footer style={{display:"flex",gap:18,flexWrap:"wrap",marginTop:34,fontSize:12}}><a href="/use-cases" style={{color:"#aeb6c5"}}>Use cases</a><a href="/privacy" style={{color:"#aeb6c5"}}>Privacy</a><a href="/security" style={{color:"#aeb6c5"}}>Security</a></footer>
      </article>
    </main>
  );
}
