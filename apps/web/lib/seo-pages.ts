export type SeoPage = {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  intro: string;
  audience: string;
  outcomes: string[];
  workflow: string[];
  faq: { q: string; a: string }[];
};

export const seoPages: SeoPage[] = [
  {
    slug: "ai-chief-of-staff",
    title: "AI Chief of Staff for Busy Operators | Atlas.Moda",
    description: "Atlas.Moda is an AI chief of staff that connects to your work context, prioritizes what matters, and keeps sensitive actions gated.",
    eyebrow: "AI CHIEF OF STAFF",
    h1: "An AI chief of staff that learns how you work.",
    intro: "Atlas.Moda helps founders, executives, and operators reduce coordination overhead by turning scattered work signals into a focused queue of priorities and next actions.",
    audience: "Best for leaders managing email, meetings, relationships, projects, and follow-ups across a busy Google Workspace.",
    outcomes: ["Surface the few items that deserve attention", "Remember context across recurring relationships", "Prepare next actions without silently taking high-risk steps"],
    workflow: ["Connect Google Workspace with read-only access to start", "Atlas learns patterns and context from authorized sources", "Low-risk work is suggested first while consequential actions stay gated"],
    faq: [
      { q: "What does an AI chief of staff do?", a: "It helps organize context, prioritize competing demands, prepare follow-ups, and reduce the amount of manual coordination required to run your work." },
      { q: "Does Atlas.Moda send messages automatically?", a: "Not by default. Atlas.Moda starts with read-only Google access and keeps sensitive or consequential actions behind review controls." },
      { q: "Who is Atlas.Moda for?", a: "It is designed for founders, executives, consultants, agency owners, and operators who manage a high volume of relationships and commitments." },
    ],
  },
  {
    slug: "google-workspace-ai-assistant",
    title: "Google Workspace AI Assistant | Atlas.Moda",
    description: "Connect Gmail, Calendar, Contacts, Drive, Docs, and Sheets to one privacy-forward AI assistant for work context and prioritization.",
    eyebrow: "GOOGLE WORKSPACE AI",
    h1: "Turn Google Workspace into one intelligent operating layer.",
    intro: "Atlas.Moda connects the work already living in Gmail, Calendar, Contacts, Drive, Docs, and Sheets so you can see priorities without manually stitching context together.",
    audience: "Best for people whose day already runs through Google Workspace but whose context is fragmented across tabs and apps.",
    outcomes: ["Connect read-only Workspace data in one flow", "Bring email, meetings, contacts, and files into shared context", "Reduce repeated searching and manual status checks"],
    workflow: ["Authorize the Google scopes you approve", "Atlas identifies relevant work signals", "You review prioritized findings before higher-risk actions are considered"],
    faq: [
      { q: "Which Google apps can Atlas.Moda connect to?", a: "The current onboarding supports read-only access for Gmail, Calendar, Contacts, Drive, Docs, and Sheets." },
      { q: "Does Atlas.Moda need my Google password?", a: "No. Atlas.Moda uses Google OAuth so you authorize access through Google rather than sharing your password." },
      { q: "Can I revoke access?", a: "Yes. Google access can be revoked through your Google Account permissions." },
    ],
  },
  {
    slug: "gmail-ai-assistant",
    title: "Gmail AI Assistant for Priority and Follow-up | Atlas.Moda",
    description: "Use Atlas.Moda as a Gmail AI assistant to identify important conversations, prepare follow-ups, and reduce inbox noise without giving up control.",
    eyebrow: "GMAIL AI ASSISTANT",
    h1: "Find the emails that actually deserve your attention.",
    intro: "Atlas.Moda helps separate important conversations from inbox noise, preserves relationship context, and prepares the next step so follow-ups are easier to handle.",
    audience: "Best for executives, founders, sales leaders, consultants, and client-facing teams with high inbox volume.",
    outcomes: ["Prioritize high-value conversations", "Spot follow-ups and open loops", "Keep read-only access during initial onboarding"],
    workflow: ["Connect Gmail read-only", "Atlas scores recent signals for relevance and urgency", "You decide what should be answered, delegated, or ignored"],
    faq: [
      { q: "Can Atlas.Moda read my Gmail?", a: "Only after you explicitly authorize Gmail access. The current onboarding requests a read-only Gmail scope." },
      { q: "Will it send emails without me?", a: "The public onboarding does not start with send permission. Consequential actions are designed to remain gated." },
      { q: "What kinds of emails can it help surface?", a: "Examples include client conversations, interviews, proposals, deadlines, payments, renewals, contracts, and other high-value open loops." },
    ],
  },
  {
    slug: "calendar-ai-assistant",
    title: "AI Calendar Assistant for Meeting Priorities | Atlas.Moda",
    description: "Atlas.Moda connects to Google Calendar to surface important commitments, prepare context, and protect upcoming meetings.",
    eyebrow: "CALENDAR AI ASSISTANT",
    h1: "Know what needs preparation before the meeting starts.",
    intro: "Atlas.Moda turns upcoming calendar commitments into a clearer preparation queue so important meetings are less likely to arrive without context or next-step planning.",
    audience: "Best for people with dense calendars, recurring client meetings, interviews, sales calls, and executive commitments.",
    outcomes: ["Surface near-term meetings that need preparation", "Connect calendar events to related context", "Reduce last-minute meeting preparation"],
    workflow: ["Connect Google Calendar read-only", "Atlas reviews upcoming commitments", "Important meetings are surfaced with preparation-oriented next actions"],
    faq: [
      { q: "Does Atlas.Moda change my calendar?", a: "Not during the read-only onboarding flow. Initial Calendar access is read-only." },
      { q: "How far ahead can it help me prepare?", a: "The product can use upcoming calendar context to surface near-term commitments and preparation needs." },
      { q: "Can it help after meetings too?", a: "Atlas.Moda is designed around preserving context and next actions, which can support post-meeting follow-up workflows as the product expands." },
    ],
  },
  {
    slug: "executive-ai-assistant",
    title: "Executive AI Assistant for Focus and Follow-up | Atlas.Moda",
    description: "An executive AI assistant for prioritization, relationship context, meeting preparation, and follow-up across Google Workspace.",
    eyebrow: "EXECUTIVE AI ASSISTANT",
    h1: "An executive assistant for the work between the meetings.",
    intro: "Atlas.Moda helps executives keep track of the conversations, commitments, and relationships that usually require a human assistant or hours of manual review.",
    audience: "Best for executives and senior leaders who need leverage without handing an AI unrestricted control of their accounts.",
    outcomes: ["Create a single view of important work", "Protect commitments and follow-ups", "Keep sensitive decisions under explicit review"],
    workflow: ["Connect the sources you already use", "Atlas builds context around your priorities", "Suggestions graduate toward more assistance only after trust is earned"],
    faq: [
      { q: "How is Atlas.Moda different from a chatbot?", a: "Atlas.Moda is designed around persistent work context, relationships, prioritization, and trust controls rather than isolated one-off prompts." },
      { q: "Is it meant to replace an executive assistant?", a: "It can automate parts of coordination and preparation, but consequential decisions and nuanced human judgment should remain with the user." },
      { q: "Does it work for teams?", a: "The current public beta is focused on isolated user workspaces, with the architecture designed to keep each workspace separated." },
    ],
  },
  {
    slug: "personal-crm-ai",
    title: "Personal CRM AI for Relationship Memory | Atlas.Moda",
    description: "Atlas.Moda acts as a personal CRM layer that helps remember relationship context, open loops, and important follow-ups.",
    eyebrow: "PERSONAL CRM AI",
    h1: "Remember the relationship, not just the contact record.",
    intro: "Atlas.Moda is designed to preserve useful relationship context across authorized work sources so important people and open loops do not disappear into your inbox.",
    audience: "Best for founders, consultants, recruiters, sales leaders, investors, and relationship-driven operators.",
    outcomes: ["Keep useful context attached to important relationships", "Spot stale conversations and unfinished follow-ups", "Avoid rebuilding context every time someone reappears"],
    workflow: ["Connect authorized email, contact, calendar, and file context", "Atlas derives compact relationship signals", "You use those signals to prepare better follow-ups and decisions"],
    faq: [
      { q: "Is Atlas.Moda a traditional CRM?", a: "No. It is a context and relationship-memory layer rather than a pipeline-first CRM database." },
      { q: "Does it copy all of my email into a CRM?", a: "The product is designed to minimize unnecessary raw-data duplication and favor compact derived context where practical." },
      { q: "Can it help me remember when I last spoke with someone?", a: "Relationship timing and open-loop context are core use cases for the Atlas.Moda relationship layer." },
    ],
  },
  {
    slug: "follow-up-ai-assistant",
    title: "AI Follow-up Assistant for Email and Relationships | Atlas.Moda",
    description: "Use Atlas.Moda to identify missed follow-ups, preserve context, and prepare the next step across email, calendar, and relationships.",
    eyebrow: "FOLLOW-UP AI",
    h1: "Stop losing valuable follow-ups in the noise.",
    intro: "Atlas.Moda helps detect unfinished conversations and commitments so the right follow-up can be prepared before an opportunity goes cold.",
    audience: "Best for client service, sales, partnerships, recruiting, consulting, and any work where response timing matters.",
    outcomes: ["Surface open loops", "Prioritize follow-ups by value and urgency", "Preserve enough context to make the next message relevant"],
    workflow: ["Connect authorized work sources", "Atlas finds conversations and commitments that still need attention", "You review the next action before anything consequential is sent"],
    faq: [
      { q: "Can Atlas.Moda remind me about unanswered conversations?", a: "Yes, identifying important open loops and stale follow-ups is a core product direction." },
      { q: "Can it write the reply?", a: "Atlas.Moda can help prepare the next step and context. Public onboarding keeps higher-risk actions gated rather than silently executing them." },
      { q: "Does it work only for sales?", a: "No. Follow-up workflows apply to clients, candidates, partners, vendors, personal networks, and executive commitments." },
    ],
  },
  {
    slug: "meeting-prep-ai",
    title: "AI Meeting Preparation Assistant | Atlas.Moda",
    description: "Prepare for important meetings with context from Calendar, Gmail, Contacts, Drive, Docs, and Sheets using Atlas.Moda.",
    eyebrow: "AI MEETING PREP",
    h1: "Walk into important meetings with the context already assembled.",
    intro: "Atlas.Moda is designed to connect the person, the calendar event, the recent conversation, and the relevant files so meeting preparation takes less manual searching.",
    audience: "Best for client meetings, interviews, partner calls, sales conversations, and executive reviews.",
    outcomes: ["Reduce pre-meeting search time", "Bring recent relationship context into one place", "Identify unresolved issues before the call"],
    workflow: ["Authorize relevant read-only sources", "Atlas links upcoming commitments with supporting context", "You review the concise preparation packet before the meeting"],
    faq: [
      { q: "What sources can support meeting preparation?", a: "Google Calendar, Gmail, Contacts, Drive, Docs, and Sheets can all contribute useful context after authorization." },
      { q: "Does Atlas.Moda record meetings?", a: "The current Google onboarding is focused on existing Workspace context and does not require recording meetings." },
      { q: "Can it prepare client-specific context?", a: "Yes. Relationship-aware context is one of the main reasons Atlas.Moda connects multiple work sources rather than treating each app in isolation." },
    ],
  },
  {
    slug: "inbox-prioritization-ai",
    title: "AI Inbox Prioritization for Gmail | Atlas.Moda",
    description: "Atlas.Moda helps prioritize Gmail by business value, urgency, relationship context, and open loops instead of simple unread counts.",
    eyebrow: "INBOX PRIORITIZATION AI",
    h1: "Prioritize your inbox by consequence, not unread count.",
    intro: "Atlas.Moda is built to help answer a better question than 'what is new?' — it helps identify what matters enough to deserve attention now.",
    audience: "Best for high-volume inboxes where important messages compete with routine notifications and low-value requests.",
    outcomes: ["Reduce inbox scanning time", "Separate high-value conversations from noise", "Turn priority messages into explicit next actions"],
    workflow: ["Connect Gmail read-only", "Atlas evaluates recent messages using context and urgency signals", "The highest-value items are surfaced first for review"],
    faq: [
      { q: "Is this just another email filter?", a: "No. Atlas.Moda is designed to combine message signals with work context and relationship importance rather than relying only on sender rules or labels." },
      { q: "Will it archive or delete my email?", a: "Not during the read-only onboarding experience." },
      { q: "Can I still use normal Gmail?", a: "Yes. Atlas.Moda is intended to sit alongside the tools you already use rather than force a replacement inbox." },
    ],
  },
  {
    slug: "founder-ai-assistant",
    title: "AI Assistant for Founders and Startup Operators | Atlas.Moda",
    description: "Atlas.Moda helps founders manage email, meetings, relationships, priorities, and follow-ups without adding more operational overhead.",
    eyebrow: "AI FOR FOUNDERS",
    h1: "Give founders back the attention lost to coordination.",
    intro: "Founders spend too much time switching between messages, meetings, documents, relationships, and unfinished tasks. Atlas.Moda turns those signals into a smaller set of actions worth thinking about.",
    audience: "Best for founders and lean startup teams where the same person handles sales, recruiting, partnerships, customers, and operations.",
    outcomes: ["Protect high-value opportunities", "Reduce context switching", "Keep relationship and follow-up memory without another heavy system"],
    workflow: ["Connect the Google Workspace you already run on", "Atlas surfaces high-value work and open loops", "You keep control over sensitive decisions while routine preparation becomes lighter"],
    faq: [
      { q: "Why would a founder use Atlas.Moda?", a: "Because founder attention is scarce. Atlas.Moda is designed to reduce the manual work of finding, remembering, and preparing the next important action." },
      { q: "Do I need to migrate to a new suite?", a: "No. The product connects to existing work sources, beginning with Google Workspace." },
      { q: "Is Atlas.Moda autonomous?", a: "The product uses staged trust controls. Public onboarding begins conservatively, and sensitive actions remain gated." },
    ],
  },
];

export const seoPageMap = new Map(seoPages.map((page) => [page.slug, page]));
