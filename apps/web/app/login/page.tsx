"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(null); setMessage(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: mode,
        email: form.get("email"),
        password: form.get("password"),
        full_name: form.get("full_name"),
        invite_code: form.get("invite_code"),
      }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok || !data.ok) { setError(data.error ?? "Unable to continue"); return; }
    if (data.confirmEmail) { setMessage("Check your email to confirm your account, then sign in."); setMode("signin"); return; }
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <main className="authShell">
      <section className="authCard">
        <div className="commandBrand"><span className="commandMark">A</span><span>Atlas</span></div>
        <span className="eyebrow">PRIVATE ALPHA · INVITE ONLY</span>
        <h1>{mode === "signup" ? "Your time, returned." : "Welcome back."}</h1>
        <p>{mode === "signup" ? "Atlas is currently onboarding one trusted tester at a time. Every new workspace starts isolated, in Safe Mode, with external execution disabled." : "Return to your private Atlas workspace."}</p>

        <form className="authForm" onSubmit={submit}>
          {mode === "signup" && <label>Name<input name="full_name" autoComplete="name" placeholder="Your name" /></label>}
          {mode === "signup" && <label>Private alpha invite<input required name="invite_code" autoComplete="off" placeholder="ATLAS-XXXXXXXXXX" /></label>}
          <label>Email<input required name="email" type="email" autoComplete="email" placeholder="you@company.com" /></label>
          <label>Password<input required minLength={10} name="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder="10+ characters" /></label>
          {error && <div className="commandError">{error}</div>}
          {message && <div className="authMessage">{message}</div>}
          <button className="approveAction" disabled={busy}>{busy ? "Working…" : mode === "signup" ? "Enter private alpha →" : "Sign in →"}</button>
        </form>

        <button className="authSwitch" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(null); setMessage(null); }}>
          {mode === "signup" ? "Already have an account? Sign in" : "Have an invitation? Create account"}
        </button>
        <div className="authTrust"><span>Invite only</span><span>Workspace isolated</span><span>Execution OFF</span><span>Kill switch ON</span></div>
      </section>
    </main>
  );
}
