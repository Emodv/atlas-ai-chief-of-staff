"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [safeNext, setSafeNext] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("next") ?? "";
    if (requested.startsWith("/") && !requested.startsWith("//")) setSafeNext(requested);
    if (params.get("mode") === "signup") setMode("signup");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(null); setMessage(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: mode, email: form.get("email"), password: form.get("password"), full_name: form.get("full_name") }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok || !data.ok) { setError(data.error ?? "Unable to continue"); return; }
    if (data.confirmEmail) { setMessage("Account created. Check your email to confirm it, then return here and sign in."); setMode("signin"); return; }
    router.push(safeNext ?? "/onboarding");
    router.refresh();
  }

  return (
    <main className="authShell">
      <section className="authCard">
        <div className="commandBrand"><span className="commandMark">A</span><span>Atlas.Moda</span></div>
        <span className="eyebrow">AI CHIEF OF STAFF</span>
        <h1>{mode === "signup" ? "Create your private workspace." : "Welcome back."}</h1>
        <p>{safeNext?.startsWith("/oauth/consent") ? "Sign in to authorize your private Atlas workspace for ChatGPT." : "Google is the recommended path because it connects the Workspace context Atlas is built to understand."}</p>

        <a className="approveAction" style={{display:"flex",justifyContent:"center",textDecoration:"none",marginBottom:18,background:"#fff",color:"#111"}} href="/api/auth/google?workspace=1&return=onboarding">
          Continue with Google →
        </a>

        <div style={{textAlign:"center",fontSize:12,color:"#7f8799",margin:"2px 0 16px"}}>or use email</div>

        <form className="authForm" onSubmit={submit}>
          {mode === "signup" && <label>Name<input name="full_name" autoComplete="name" placeholder="Your name" /></label>}
          <label>Email<input required name="email" type="email" autoComplete="email" placeholder="you@company.com" /></label>
          <label>Password<input required minLength={10} name="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder="10+ characters" /></label>
          {error && <div className="commandError">{error}</div>}
          {message && <div className="authMessage">{message}</div>}
          <button className="approveAction" disabled={busy}>{busy ? "Working…" : mode === "signup" ? "Create account with email →" : "Sign in with email →"}</button>
        </form>

        <button className="authSwitch" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(null); setMessage(null); }}>
          {mode === "signup" ? "Already have an account? Sign in" : "New to Atlas.Moda? Join free"}
        </button>
        <div className="authTrust"><span>Google read-only onboarding</span><span>Workspace isolated</span><span>Sensitive actions gated</span><span>Connections revocable</span></div>
        <div style={{marginTop:16,fontSize:12,textAlign:"center"}}><a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/security">Security</a></div>
      </section>
    </main>
  );
}
