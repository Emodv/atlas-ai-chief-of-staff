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

export default function DecisionInbox() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/approvals", { cache: "no-store" });
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data.error ?? `HTTP ${r.status}`);
      setItems(data.items ?? []);
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
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  const sorted = useMemo(() => [...items].sort((a, b) => Number(b.opportunity?.master_score ?? 0) - Number(a.opportunity?.master_score ?? 0)), [items]);

  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "48px 20px 80px" }}>
      <section style={{ marginBottom: 32 }}>
        <span className="eyebrow">ATLAS · DECISION COMPRESSION</span>
        <h1 style={{ marginBottom: 12 }}>Needs you.</h1>
        <p className="lede" style={{ maxWidth: 680 }}>Only decisions Atlas is not allowed to make alone. Approve once and the action moves into the verified execution loop. Reject once and Atlas learns from it.</p>
      </section>

      <section className="panel" style={{ marginBottom: 24 }}>
        <div>
          <span className="label">Human attention required</span>
          <h2 style={{ margin: "6px 0 0" }}>{loading ? "…" : sorted.length}</h2>
        </div>
        <div className="signal">
          <strong>{sorted.length === 0 && !loading ? "Everything handled." : "One decision at a time."}</strong>
          <span>High-consequence actions never auto-approve.</span>
        </div>
      </section>

      {error && <div style={{ padding: 16, border: "1px solid #c88", borderRadius: 14, marginBottom: 18 }}>⚠️ {error}</div>}
      {loading && <p>Loading decisions…</p>}

      {!loading && sorted.length === 0 && (
        <section className="panel">
          <div><span className="label">Status</span><h2>Nothing needs you.</h2><p>Atlas can keep monitoring and handling eligible work.</p></div>
        </section>
      )}

      <div style={{ display: "grid", gap: 16 }}>
        {sorted.map((item) => {
          const opp = item.opportunity;
          const recipient = item.payload?.recipient;
          const score = opp?.master_score ?? null;
          const value = opp?.estimated_value ?? null;
          const blocked = !item.reversible || !["low", "medium"].includes(item.risk_level);
          return (
            <article key={item.id} className="panel" style={{ display: "block" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <span className="label">{opp?.priority ?? "REVIEW"}{score != null ? ` · ${score}/100` : ""}</span>
                  <h2 style={{ margin: "6px 0 6px" }}>{opp?.person_company ?? item.description}</h2>
                  <p style={{ margin: 0 }}>{item.description}</p>
                </div>
                <span className="trustPill yellow">{item.risk_level} risk</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, margin: "16px 0" }}>
                {recipient && <div><span className="label">Recipient</span><div>{recipient}</div></div>}
                {opp?.category && <div><span className="label">Category</span><div>{opp.category}</div></div>}
                {value != null && <div><span className="label">Estimated value</span><div>${Number(value).toLocaleString()}</div></div>}
                <div><span className="label">Confidence</span><div>{Math.round(Number(item.confidence ?? 0) * 100)}%</div></div>
              </div>

              {opp?.opportunity && <p><strong>Opportunity:</strong> {opp.opportunity}</p>}
              {opp?.risk && <p><strong>Risk:</strong> {opp.risk}</p>}

              <div className="actions" style={{ marginTop: 18 }}>
                <button
                  className="primaryAction"
                  disabled={busy === item.id || blocked}
                  onClick={() => decide("approve", item)}
                  style={{ border: 0, cursor: blocked ? "not-allowed" : "pointer", opacity: blocked ? 0.5 : 1 }}
                >{busy === item.id ? "Working…" : blocked ? "Direct action required" : "Approve →"}</button>
                <button
                  disabled={busy === item.id}
                  onClick={() => decide("reject", item)}
                  style={{ border: "1px solid currentColor", background: "transparent", borderRadius: 999, padding: "12px 18px", cursor: "pointer" }}
                >Reject</button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
