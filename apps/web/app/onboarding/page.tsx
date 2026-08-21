"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/onboarding", { cache: "no-store" }).then(async (r) => {
      if (r.status === 401) { router.replace("/login"); return; }
      const data = await r.json();
      if (!r.ok || !data.ok) setError(data.error ?? "Unable to load workspace");
      else if (data.workspace?.onboarding_completed) router.replace("/decisions");
      setLoading(false);
    }).catch((e) => { setError(String(e)); setLoading(false); });
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null);
    const form = new FormData(event.currentTarget);
    const priorities = String(form.get("priorities") ?? "").split("\n").map((x) => x.trim()).filter(Boolean);
    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        role: form.get("role"),
        north_star: form.get("north_star"),
        priorities,
        protected_time: form.get("protected_time"),
        communication_style: form.get("communication_style"),
        autonomy_level: form.get("autonomy_level"),
      }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok || !data.ok) { setError(data.error ?? "Unable to save onboarding"); return; }
    router.push("/decisions"); router.refresh();
  }

  if (loading) return <main className="authShell"><section className="authCard"><p>Preparing your private Atlas workspace…</p></section></main>;

  return (
    <main className="authShell">
      <section className="authCard onboardingCard">
        <div className="commandBrand"><span className="commandMark">A</span><span>Atlas</span></div>
        <span className="eyebrow">LEARNING MODE</span>
        <h1>Teach Atlas what matters.</h1>
        <p>Five inputs are enough to start. Atlas begins in Safe Mode: it can learn and recommend, but it cannot execute external actions for a new workspace.</p>
        <form className="authForm" onSubmit={submit}>
          <label>Your role<input name="role" placeholder="Founder, executive, consultant…" /></label>
          <label>North Star<textarea name="north_star" rows={3} placeholder="What should Atlas optimize for?" /></label>
          <label>Top priorities <small>One per line</small><textarea name="priorities" rows={4} placeholder={'Revenue growth\nProtect family time\nShip product'} /></label>
          <label>Protected time<input name="protected_time" placeholder="e.g. Family time after 6 PM" /></label>
          <label>Communication style<select name="communication_style" defaultValue="concise"><option value="concise">Concise</option><option value="warm">Warm</option><option value="direct">Direct</option><option value="detailed">Detailed</option></select></label>
          <label>Starting autonomy<select name="autonomy_level" defaultValue="suggest"><option value="suggest">Suggest only</option><option value="approval">Prepare & ask approval</option><option value="autonomous">Autonomous later, after trust is earned</option></select></label>
          {error && <div className="commandError">{error}</div>}
          <button className="approveAction" disabled={busy}>{busy ? "Saving…" : "Start Atlas in Safe Mode →"}</button>
        </form>
        <div className="authTrust"><span>Execution disabled initially</span><span>Workspace isolated</span><span>Kill switch ON</span></div>
      </section>
    </main>
  );
}
