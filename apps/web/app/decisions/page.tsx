"use client";

import { useEffect, useMemo, useState } from "react";

type Item = {
  id: string;
  description: string;
  action_type: string;
  confidence: number;
  risk_level: string;
  reversible: boolean;
  payload?: Record<string, any>;
  opportunity?: {
    person_company?: string;
    category?: string;
    opportunity?: string;
    risk?: string;
    estimated_value?: number;
    master_score?: number;
    priority?: string;
    deadline?: string;
  } | null;
};

type QueueStatus = {
  counts?: Record<string, number>;
  connector_counts?: Record<string, number>;
  human_attention_returned?: {
    human_minutes_saved?: number;
    revenue_influenced?: number;
    money_saved?: number;
    autonomous_actions?: number;
    human_decisions?: number;
  };
  trust?: {
    score?: number;
    stage?: string;
    autonomyAllowed?: boolean;
  };
};

function money(value: number | null | undefined) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(value);
}

function titleCase(value?: string) {
  return (value ?? "").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DecisionInbox() {
  const [items, setItems] = useState<Item[]>([]);
  const [queue, setQueue] = useState<QueueStatus>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [approvalsResponse, actionsResponse] = await Promise.all([
        fetch("/api/approvals", { cache: "no-store" }),
        fetch("/api/actions", { cache: "no-store" }),
      ]);
      const approvals = await approvalsResponse.json();
      const actions = await actionsResponse.json();
      if (!approvalsResponse.ok || !approvals.ok) throw new Error(approvals.error ?? `HTTP ${approvalsResponse.status}`);
      setItems(approvals.items ?? []);
      if (actionsResponse.ok && actions.ok) setQueue(actions);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function decide(action: "approve" | "reject", item: Item) {
    setBusy(item.id);
    setError(null);
    try {
      const r = await fetch("/api/approvals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, action_id: item.id }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data.error ?? `HTTP ${r.status}`);
      setItems((current) => current.filter((x) => x.id !== item.id));
      const status = await fetch("/api/actions", { cache: "no-store" });
      const statusData = await status.json();
      if (status.ok && statusData.ok) setQueue(statusData);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  const sorted = useMemo(() => [...items].sort((a, b) => Number(b.opportunity?.master_score ?? 0) - Number(a.opportunity?.master_score ?? 0)), [items]);
  const totalValue = useMemo(() => sorted.reduce((sum, item) => sum + Number(item.opportunity?.estimated_value ?? 0), 0), [sorted]);
  const counts = queue.counts ?? {};
  const handled = Number(counts.completed ?? 0);
  const queued = Number(counts.queued ?? 0) + Number(counts.executing ?? 0) + Number(counts.verification_pending ?? 0) + Number(counts.verifying ?? 0);
  const attention = queue.human_attention_returned ?? {};

  return (
    <main className="commandDashboard">
      <header className="commandTopbar">
        <div>
          <div className="commandBrand"><span className="commandMark">A</span><span>Atlas</span></div>
          <span className="commandSub">Executive Action Dashboard</span>
        </div>
        <div className="commandLive"><span className="liveDot" /> Live · {queue.trust?.stage ? titleCase(queue.trust.stage) : "Connected"}</div>
      </header>

      <section className="commandHero">
        <div>
          <span className="eyebrow">DECISION COMPRESSION</span>
          <h1>{sorted.length ? `${sorted.length} decisions. Everything else can wait.` : "Everything important is handled."}</h1>
          <p>Atlas compresses your inbox, calendar, CRM, and operating systems into the few actions that actually deserve your attention.</p>
        </div>
        <button className="refreshButton" onClick={refresh} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
      </section>

      <section className="commandMetrics">
        <article className="metricCard metricPrimary">
          <span>Needs you</span>
          <strong>{loading ? "—" : sorted.length}</strong>
          <small>Human judgment required</small>
        </article>
        <article className="metricCard">
          <span>Opportunity value</span>
          <strong>{money(totalValue)}</strong>
          <small>Known value in current queue</small>
        </article>
        <article className="metricCard">
          <span>Atlas working</span>
          <strong>{queued}</strong>
          <small>Queued / executing / verifying</small>
        </article>
        <article className="metricCard">
          <span>Handled</span>
          <strong>{handled}</strong>
          <small>Verified completed actions</small>
        </article>
      </section>

      <section className="attentionStrip">
        <div><span>Human Attention Returned</span><strong>{Math.round(Number(attention.human_minutes_saved ?? 0))} min</strong></div>
        <div><span>Autonomous actions</span><strong>{Number(attention.autonomous_actions ?? 0)}</strong></div>
        <div><span>Revenue influenced</span><strong>{money(Number(attention.revenue_influenced ?? 0))}</strong></div>
        <div><span>Money saved</span><strong>{money(Number(attention.money_saved ?? 0))}</strong></div>
        <div><span>Trust</span><strong>{queue.trust?.score ?? "—"}/100</strong></div>
      </section>

      {error && <div className="commandError">⚠ {error}</div>}

      <section className="commandSectionHeader">
        <div>
          <span className="eyebrow">NOW</span>
          <h2>Needs your decision</h2>
        </div>
        <span className="sectionHint">Highest expected value first</span>
      </section>

      {!loading && sorted.length === 0 && (
        <section className="commandEmpty">
          <div className="emptyCheck">✓</div>
          <div><h2>Nothing needs you.</h2><p>Atlas can keep monitoring and handling eligible work in the background.</p></div>
        </section>
      )}

      <div className="decisionStack">
        {sorted.map((item, index) => {
          const opp = item.opportunity;
          const recipient = item.payload?.recipient;
          const score = Number(opp?.master_score ?? 0);
          const value = opp?.estimated_value ?? null;
          const blocked = !item.reversible || !["low", "medium"].includes(item.risk_level);
          const riskClass = item.risk_level === "low" ? "riskLow" : item.risk_level === "medium" ? "riskMedium" : "riskHigh";
          return (
            <article key={item.id} className={`decisionCard ${index === 0 ? "decisionCardTop" : ""}`}>
              <div className="decisionScore">
                <div className="scoreRing" style={{ "--score": `${Math.max(0, Math.min(100, score)) * 3.6}deg` } as React.CSSProperties}>
                  <span>{score || "—"}</span>
                </div>
                <small>{opp?.priority ?? "REVIEW"}</small>
              </div>

              <div className="decisionBody">
                <div className="decisionTitleRow">
                  <div>
                    <span className="decisionCategory">{titleCase(opp?.category ?? item.action_type)}</span>
                    <h3>{opp?.person_company ?? item.description}</h3>
                    <p>{item.description}</p>
                  </div>
                  <span className={`riskBadge ${riskClass}`}>{titleCase(item.risk_level)} risk</span>
                </div>

                <div className="decisionFacts">
                  {value != null && <div><span>Est. value</span><strong>{money(Number(value))}</strong></div>}
                  {recipient && <div><span>To</span><strong>{recipient}</strong></div>}
                  <div><span>Confidence</span><strong>{Math.round(Number(item.confidence ?? 0) * 100)}%</strong></div>
                  <div><span>Action</span><strong>{titleCase(item.action_type)}</strong></div>
                </div>

                {(opp?.opportunity || opp?.risk) && (
                  <div className="decisionContext">
                    {opp?.opportunity && <div><span>Upside</span><p>{opp.opportunity}</p></div>}
                    {opp?.risk && <div><span>Watch</span><p>{opp.risk}</p></div>}
                  </div>
                )}

                <div className="decisionActions">
                  <button
                    className="approveAction"
                    disabled={busy === item.id || blocked}
                    onClick={() => decide("approve", item)}
                  >
                    {busy === item.id ? "Working…" : blocked ? "Direct action required" : "Approve & queue"}
                    {!blocked && <span>→</span>}
                  </button>
                  <button className="rejectAction" disabled={busy === item.id} onClick={() => decide("reject", item)}>Reject</button>
                  <span className="actionSafety">{item.reversible ? "Reversible" : "Irreversible"} · {blocked ? "Human execution required" : "Atlas verifies completion"}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <footer className="commandFooter">
        <span>Atlas only interrupts you when judgment is genuinely required.</span>
        <strong>Revenue → Systems → Assets → Repeat.</strong>
      </footer>
    </main>
  );
}
