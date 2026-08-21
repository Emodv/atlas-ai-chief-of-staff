import { cookies } from "next/headers";
import { atlasUserRest, getAtlasSession } from "../../../lib/atlas-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROVIDER_COOKIE = "atlas_google_provider_token";

type Finding = {
  external_key: string;
  source: "gmail" | "calendar";
  title: string;
  context: string;
  score: number;
  urgency: number;
  next_action: string;
  deadline?: string | null;
};

function header(headers: any[] | undefined, name: string) {
  return headers?.find((h) => String(h?.name).toLowerCase() === name.toLowerCase())?.value ?? "";
}

function gmailScore(subject: string) {
  const s = subject.toLowerCase();
  const high = ["interview", "proposal", "invoice", "payment", "contract", "renewal", "urgent", "deadline", "offer", "client", "meeting"];
  return high.some((term) => s.includes(term)) ? 84 : 69;
}

function eventScore(start?: string) {
  if (!start) return 66;
  const hours = (new Date(start).getTime() - Date.now()) / 36e5;
  if (hours <= 24) return 82;
  if (hours <= 48) return 76;
  return 67;
}

async function gmailFindings(token: string): Promise<Finding[]> {
  const list = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is%3Aunread%20newer_than%3A7d&maxResults=12", {
    headers: { authorization: `Bearer ${token}` }, cache: "no-store",
  });
  if (!list.ok) return [];
  const data = await list.json();
  const ids = (data.messages ?? []).slice(0, 8).map((m: any) => m.id);
  const rows = await Promise.all(ids.map(async (id: string) => {
    const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, {
      headers: { authorization: `Bearer ${token}` }, cache: "no-store",
    });
    return r.ok ? r.json() : null;
  }));
  return rows.filter(Boolean).map((m: any) => {
    const subject = header(m.payload?.headers, "Subject") || "Unread message";
    const from = header(m.payload?.headers, "From") || "Gmail";
    const score = gmailScore(subject);
    return {
      external_key: `firstscan:gmail:${m.id}`,
      source: "gmail" as const,
      title: subject,
      context: `Unread from ${from}`,
      score,
      urgency: score >= 80 ? 84 : 62,
      next_action: "Review this conversation and decide whether it needs a response.",
    };
  });
}

async function calendarFindings(token: string): Promise<Finding[]> {
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + 7 * 864e5).toISOString();
  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("timeMax", timeMax);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "10");
  const r = await fetch(url, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!r.ok) return [];
  const data = await r.json();
  return (data.items ?? []).filter((e: any) => e.status !== "cancelled").map((e: any) => {
    const start = e.start?.dateTime ?? e.start?.date ?? null;
    const score = eventScore(start);
    return {
      external_key: `firstscan:calendar:${e.id}`,
      source: "calendar" as const,
      title: e.summary || "Upcoming calendar commitment",
      context: start ? `Starts ${new Date(start).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: e.start?.dateTime ? "short" : undefined })}` : "Upcoming",
      score,
      urgency: score >= 80 ? 90 : score >= 75 ? 78 : 60,
      next_action: "Make sure this commitment is protected and prepared for.",
      deadline: e.start?.dateTime ?? null,
    };
  });
}

export async function POST() {
  const session = await getAtlasSession();
  if (!session) return Response.json({ ok: false, error: "authentication-required" }, { status: 401 });
  const jar = await cookies();
  const providerToken = jar.get(PROVIDER_COOKIE)?.value;
  if (!providerToken) return Response.json({ ok: false, error: "google-read-access-required", reconnect: "/api/auth/google" }, { status: 428 });

  const workspaceResult = await atlasUserRest("atlas_workspaces?select=id,user_key&limit=1");
  const workspace = Array.isArray(workspaceResult.data) ? workspaceResult.data[0] : null;
  if (!workspace?.user_key) return Response.json({ ok: false, error: "workspace-missing" }, { status: 404 });

  const [gmail, calendar] = await Promise.all([gmailFindings(providerToken), calendarFindings(providerToken)]);
  const findings = [...gmail, ...calendar].sort((a, b) => b.score - a.score).slice(0, 3);
  const now = new Date().toISOString();

  for (const f of findings) {
    await atlasUserRest("atlas_opportunities?on_conflict=user_key,external_key", {
      method: "POST",
      headers: { prefer: "return=representation,resolution=merge-duplicates" },
      body: JSON.stringify({
        user_key: workspace.user_key,
        external_key: f.external_key,
        person_company: f.context,
        category: f.source === "gmail" ? "communication" : "commitment",
        status: "open",
        opportunity: f.title,
        risk: "low",
        evidence: [{ source: f.source, captured_at: now, context: f.context }],
        value_score: f.score,
        probability_score: 78,
        speed_score: 85,
        urgency_score: f.urgency,
        leverage_score: 70,
        effort_efficiency_score: 90,
        confidence: 0.82,
        action_risk: "low",
        next_action: f.next_action,
        owner: "user",
        atlas_can_execute: false,
        emod_required: false,
        deadline: f.deadline ?? null,
        source_updated_at: now,
        updated_at: now,
        lifecycle_stage: "ranked",
        estimated_human_minutes: 5,
      }),
    });
  }

  const connectedSources = [...(gmail.length ? ["gmail"] : []), ...(calendar.length ? ["calendar"] : [])];
  await Promise.all([
    atlasUserRest(`atlas_workspaces?id=eq.${encodeURIComponent(workspace.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ onboarding_completed: true, autonomy_level: "suggest", execution_enabled: false, kill_switch: true, updated_at: now }),
    }),
    atlasUserRest("atlas_runtime_state?on_conflict=user_key", {
      method: "POST",
      headers: { prefer: "return=representation,resolution=merge-duplicates" },
      body: JSON.stringify({ user_key: workspace.user_key, connected_sources: connectedSources, learning_mode: "learning", shadow_mode: "shadow", autonomy_enabled: false, updated_at: now }),
    }),
    atlasUserRest("atlas_alpha_events", {
      method: "POST",
      body: JSON.stringify({ user_key: workspace.user_key, event_type: "first_scan_completed", metadata: { gmail_seen: gmail.length, calendar_seen: calendar.length, surfaced: findings.length } }),
    }),
  ]);

  return Response.json({ ok: true, filtered: gmail.length + calendar.length, findings, safe_mode: true }, { headers: { "cache-control": "no-store" } });
}
