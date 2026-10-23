"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { validateTeamName } from "@/lib/team-name";
import { useSearchParams } from "next/navigation";

function JoinForm() {
  const params = useSearchParams();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const c = params.get("code");
    if (c) setCode(c.toUpperCase());
  }, [params]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const validated = validateTeamName(name);
    if (validated.error) { setError(validated.error); return; }
    setBusy(true);
    setError("");
    try {
    const r = await fetch("/api/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, name: validated.name }),
    });
    const d = (await r.json()) as { error?: string };
    if (r.ok) {
      location.href = "/play";
    } else {
      setError(d.error ?? "Something went wrong. Try again.");
    }
    } catch { setError("Could not connect. Please try again."); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="sheet" style={{ marginTop: 28 }}>
      <h2>Join your team</h2>
      <div className="fields" style={{ borderTop: 0, paddingTop: 0, marginTop: 8 }}>
        <div>
          <label htmlFor="code">Team code from your organizer</label>
          <input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="T01-AB3K" autoCapitalize="characters" autoComplete="off" required />
        </div>
        <div>
          <label htmlFor="name">Team name (required)</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} autoComplete="off" required aria-describedby="name-help" />
          <p id="name-help" className="muted" style={{ fontSize: 14, marginTop: 6 }}>Choose your name before the clock starts. To rejoin after it starts, enter your existing team name.</p>
        </div>
        <div className="row">
          <button className="btn" disabled={busy || !code.trim() || !name.trim()}>Join the investigation</button>
        </div>
        {error && <div className="msg" role="alert">{error}</div>}
      </div>
    </form>
  );
}

export default function Home() {
  return (
    <main className="wrap onDesk">
      <p className="muted" style={{ marginTop: 28, marginBottom: 6 }}>Microsoft Club</p>
      <h1>The Case of the Missing Innovation</h1>
      <p style={{ maxWidth: 560 }}>
        The final presentation key has disappeared minutes before the showcase. Work with your team, follow the evidence,
        and find out who took it.
      </p>
      <Suspense fallback={null}>
        <JoinForm />
      </Suspense>
    </main>
  );
}
