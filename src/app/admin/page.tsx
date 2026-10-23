"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { EventClock } from "@/components/event-clock";

interface Team {
  id: number; code: string; name: string; variant: string; finished_at: number | null;
  solved: number; hints: number; wrong: number; total: number; reason_pts: number;
}
interface ReviewItem { teamId: number; team: string; item: string; text: string; max: number; auto: number; admin: number | null }
interface Overview {
  now: number;
  event: { phase: string; startedAt: number | null; investigationEnds: number | null; hardEnd: number | null; locked: boolean; revealed: boolean };
  teams: Team[];
  review: ReviewItem[];
}

const ITEM_LABELS: Record<string, string> = {
  p1: "Puzzle 1 explanation", p2: "Puzzle 2 explanation", p3: "Puzzle 3 explanation", p4: "Puzzle 4 explanation",
  p5: "Puzzle 5 explanation", r_evidence: "Report: strongest evidence", r_noprove: "Report: what the sheet does not prove",
  r_verify: "Verification question",
};

async function act(body: Record<string, unknown>) {
  const r = await fetch("/api/admin/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return r.ok;
}

export default function Admin() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<"live" | "review" | "teams" | "winners">("live");

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/overview", { cache: "no-store" });
      if (r.status === 401) { setAuthed(false); return; }
      if (!r.ok) throw new Error("Could not load the host console.");
      setData((await r.json()) as Overview);
      setAuthed(true);
      setError("");
    } catch { setError("Connection lost. Retrying automatically…"); }
  }, []);

  useEffect(() => {
    load();
    const i = setInterval(load, 5000);
    return () => clearInterval(i);
  }, [load]);

  async function run(body: Record<string, unknown>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    try {
      if (!(await act(body))) throw new Error("Action failed");
      await load();
    } catch { setError("Could not save your change. Please try again."); }
    finally { setBusy(false); }
  }

  if (authed === null) return <main className="wrap onDesk"><p role="status">{error || "Loading…"}</p></main>;
  if (!authed) return <Login onDone={load} />;
  if (!data) return null;

  const ev = data.event;
  return (
    <main className="wrap onDesk admin-wrap" aria-busy={busy}>
      <h1 style={{ marginTop: 20 }}>Host console</h1>
      <p className="muted">
        Clock: {ev.phase === "lobby" ? "not started" : ev.phase}
        {ev.locked ? " (locked by host)" : ""}. Teams: {data.teams.length}.
      </p>

      <EventClock event={ev} serverNow={data.now} />
      {error && <div className="msg" role="alert">{error}</div>}
      <a className="host-home" href="/">Team join page</a>
      <div className="tabs" role="group" aria-label="Host views">
        {(["live", "review", "teams", "winners"] as const).map((t) => (
          <button key={t} aria-pressed={tab === t} className={`btn small${tab === t ? "" : " ghost"}`} onClick={() => setTab(t)}>
            {{ live: "Live scores", review: `Review (${data.review.length})`, teams: "Teams", winners: "Winners" }[t]}
          </button>
        ))}
      </div>

      {tab === "live" && (
        <>
          <section className="sheet">
            <h2>Event controls</h2>
            <div className="row">
              {ev.phase === "lobby" && <button className="btn" onClick={() => run({ action: "start" }, "Start the clock for every team now?")}>Start the clock</button>}
              {ev.phase !== "lobby" && !ev.locked && <button className="btn ghost" onClick={() => run({ action: "lock" }, "Close submissions for everyone?")}>Close submissions</button>}
              {ev.locked && <button className="btn ghost" onClick={() => run({ action: "unlock" })}>Reopen submissions</button>}
              <button className="btn ghost" onClick={() => run({ action: ev.revealed ? "unreveal" : "reveal" })}>
                {ev.revealed ? "Hide Maya’s note" : "Reveal Maya’s note to teams"}
              </button>
            </div>
            <p className="muted" style={{ marginTop: 12 }}>
              Dry run finished? <button className="btn ghost small" onClick={() => run({ action: "resetAll" }, "Delete all scores, attempts and hints, and reset the clock? Teams are kept.")}>Reset all play data</button>
            </p>
          </section>
          <section className="sheet">
            <h2>Leaderboard</h2>
            <div className="scroll">
              <table className="tbl">
                <thead><tr><th>#</th><th>Team</th><th>Solved</th><th>Hints</th><th>Wrong</th><th>Score</th><th>Report filed</th></tr></thead>
                <tbody>
                  {data.teams.map((t, i) => (
                    <tr key={t.id}>
                      <td>{i + 1}</td><td>{t.name}</td><td>{t.solved}/5</td><td>{t.hints}</td><td>{t.wrong}</td>
                      <td><strong>{t.total}</strong></td>
                      <td>{t.finished_at && ev.startedAt ? `${Math.floor((t.finished_at - ev.startedAt) / 60000)}m ${Math.floor(((t.finished_at - ev.startedAt) % 60000) / 1000)}s` : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted" style={{ marginTop: 10 }}>Ties go to the earliest report, then the higher reasoning score.</p>
          </section>
        </>
      )}

      {tab === "review" && (
        <section className="sheet">
          <h2>Written answers</h2>
          <p className="muted">Points are filled in by keyword matching. Change any score; leave the box empty and press Enter to go back to the automatic score.</p>
          {data.review.length === 0 && <p>No written answers yet.</p>}
          {[...data.review].sort((a, b) => a.auto / a.max - b.auto / b.max).map((r) => (
            <div className="rev" key={`${r.teamId}-${r.item}`}>
              <strong>{r.team}</strong> · {ITEM_LABELS[r.item] ?? r.item}
              <p>{r.text || "(no text)"}</p>
              <ReviewScore r={r} onSave={(points) => run({ action: "review", teamId: r.teamId, item: r.item, points })} />
            </div>
          ))}
        </section>
      )}

      {tab === "teams" && (
        <section className="sheet">
          <h2>Teams and codes</h2>
          <CreateTeams onCreate={(count) => run({ action: "createTeams", count })} />
          <div className="scroll">
            <table className="tbl">
              <thead><tr><th>Team</th><th>Code</th><th>Variant</th><th>Join link</th></tr></thead>
              <tbody>
                {[...data.teams].sort((a, b) => a.id - b.id).map((t) => (
                  <tr key={t.id}>
                    <td><RenameBox t={t} onSave={(name) => run({ action: "rename", teamId: t.id, name })} /></td>
                    <td><strong>{t.code}</strong></td>
                    <td>{t.variant}</td>
                    <td><a href={`/?code=${encodeURIComponent(t.code)}`} target="_blank" rel="noopener noreferrer">Join {t.code} ↗</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "winners" && <Winners teams={data.teams} />}
    </main>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    try {
    const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    if (r.ok) onDone();
    else setErr(r.status === 401 ? "Wrong password." : "Sign-in is unavailable. Please try again.");
    } catch { setErr("Could not connect. Please try again."); }
  }
  return (
    <main className="wrap onDesk">
      <form className="sheet" onSubmit={submit} style={{ marginTop: 40 }}>
        <h2>Host sign-in</h2>
        <div className="fields" style={{ borderTop: 0, paddingTop: 0 }}>
          <div><label htmlFor="pw">Password</label><input id="pw" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus /></div>
          <div className="row"><button className="btn" disabled={!pw}>Sign in</button></div>
          {err && <div className="msg" role="alert">{err}</div>}
        </div>
      </form>
    </main>
  );
}

function ReviewScore({ r, onSave }: { r: ReviewItem; onSave: (points: number | null) => void }) {
  const [v, setV] = useState(r.admin === null ? "" : String(r.admin));
  return (
    <div className="row">
      <span>Auto {r.auto}/{r.max}</span>
      <input aria-label={`Host score for ${r.team}: ${ITEM_LABELS[r.item] ?? r.item}`} className="num" type="number" min={0} max={r.max} value={v} placeholder={String(r.auto)}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onSave(v === "" ? null : Number(v)); }} />
      <button className="btn small" onClick={() => onSave(v === "" ? null : Number(v))}>Save</button>
      {r.admin !== null && <span className="muted">Host score {r.admin}</span>}
    </div>
  );
}

function CreateTeams({ onCreate }: { onCreate: (n: number) => void }) {
  const [n, setN] = useState(24);
  return (
    <div className="row" style={{ marginBottom: 14 }}>
      <label htmlFor="n" style={{ margin: 0 }}>Add teams</label>
      <input id="n" className="num" type="number" min={1} max={60} value={n} onChange={(e) => setN(Number(e.target.value))} />
      <button className="btn small" onClick={() => onCreate(n)}>Create</button>
    </div>
  );
}

function RenameBox({ t, onSave }: { t: Team; onSave: (name: string) => void }) {
  return <input aria-label={`Name for ${t.code}`} required defaultValue={t.name} maxLength={30} style={{ minHeight: 34, padding: "4px 8px", fontSize: 15 }}
    onBlur={(e) => { if (!e.target.value.trim()) { e.target.value = t.name; return; } if (e.target.value !== t.name) onSave(e.target.value); }} />;
}

function Winners({ teams }: { teams: Team[] }) {
  const finished = teams.filter((t) => t.finished_at);
  const top = finished.slice(0, 3);
  const [shown, setShown] = useState(0);
  const order = [...top].reverse(); // third, second, first
  const place = (i: number) => ["First", "Second", "Third"][top.length - 1 - i];
  return (
    <section className="sheet">
      <h2>Winners</h2>
      <p className="muted">Only teams that filed a report are ranked. Show the places one at a time on the big screen.</p>
      {top.length === 0 && <p>No finished teams yet.</p>}
      {order.slice(0, shown).map((t, i) => (
        <p className="win" key={t.id}>{t.name}<small>{place(i)} place, {t.total} points</small></p>
      ))}
      <div className="row">
        <button className="btn" disabled={shown >= order.length} onClick={() => setShown((s) => s + 1)}>Show next place</button>
        <button className="btn ghost" onClick={() => setShown(0)}>Hide all</button>
      </div>
    </section>
  );
}
