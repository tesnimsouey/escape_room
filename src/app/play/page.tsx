"use client";

import { useCallback, useEffect, useState } from "react";
import type { Block, Field, PuzzleDef } from "@/lib/content";

type Phase = "lobby" | "investigation" | "final" | "closed";

interface PuzzleState extends PuzzleDef {
  solved: boolean;
  hintsUsed: number;
  hints: string[];
}

interface GameState {
  now: number;
  intro: string;
  team: { name: string; code: string };
  event: { phase: Phase; startedAt: number | null; investigationEnds: number | null; hardEnd: number | null; revealed: boolean };
  stage: "lobby" | "puzzle" | "report" | "done";
  solved: number;
  puzzles: PuzzleState[];
  report: { fields: Field[]; textFields: Field[] } | null;
  reveal: { note: string; summary: string[] } | null;
  score: { total: number; hints: number; hintPenalty: number; hintCost: number };
}

const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

async function post(url: string, body: unknown) {
  try {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: r.ok, data: d };
  } catch {
    return { ok: false, data: { error: "الاتّصال تقطع. إجاباتك ما زالت موجودة. عاود جرّب." } as Record<string, unknown> };
  }
}

export default function Play() {
  const [s, setS] = useState<GameState | null>(null);
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);
  const [, setTick] = useState(0);
  const [unlock, setUnlock] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
    const r = await fetch("/api/state", { cache: "no-store" });
    if (r.status === 401) {
      location.href = "/";
      return;
    }
    if (!r.ok) throw new Error("حالة اللعبة موش متوفرة");
    const d = (await r.json()) as GameState;
    setOffset(d.now - Date.now());
    setS(d);
    setError("");
    } catch { setError("الاتّصال تقطع. نعاودوا نحاولوا وإجاباتك تبقى موجودة."); }
  }, []);

  useEffect(() => {
    load();
    const poll = setInterval(load, 4000);
    const tick = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [load]);

  function celebrate(label: string) {
    setUnlock(label);
    load();
    setTimeout(() => setUnlock(null), 2600);
  }

  if (!s) return <main className="wrap onDesk"><p role="status">{error || "نحمّلوا ملفّ الحكاية…"}</p></main>;

  const now = Date.now() + offset;
  const { phase, investigationEnds, hardEnd } = s.event;
  let clock = "نستناو";
  let clockNote = "المضيف باش يشغّل الوقت";
  let low = false;
  if (phase === "investigation" && investigationEnds) {
    clock = mmss(investigationEnds - now);
    clockNote = "باقي في وقت البحث";
    low = investigationEnds - now < 5 * 60_000;
  } else if (phase === "final" && hardEnd) {
    clock = mmss(hardEnd - now);
    clockNote = "باقي قبل ما يتسكّر الإرسال";
    low = true;
  } else if (phase === "closed") {
    clock = "تسكّر";
    clockNote = "ما عادش يتقبل الإرسال";
  }

  const open = phase === "investigation" || phase === "final";
  const current = s.stage === "puzzle" ? s.solved + 1 : 0;
  const ordered = [...s.puzzles].reverse(); // newest envelope first

  return (
    <>
      <header className="topbar">
        <div className="in">
          <div className="team">
            {s.team.name}
            <small>النقاط {s.score.total}</small>
          </div>
          <div className={`clock${low ? " low" : ""}`} aria-live="off">
            <bdi dir="ltr" lang="en" className="time-digits">{clock}</bdi>
            <small>{clockNote}</small>
          </div>
        </div>
      </header>

      <main className="wrap onDesk">
        {error && <div className="msg" role="alert">{error}</div>}
        <div className="rail" aria-label="الظروف">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className={`env ${n <= s.solved ? "done" : n === current ? "now" : ""}`} title={`الظرف ${n}`}>
              {n}
            </div>
          ))}
          <div className={`env ${s.stage === "done" ? "done" : s.stage === "report" ? "now" : ""}`}>التقرير</div>
        </div>

        {s.stage === "lobby" && (
          <section className="sheet">
            <h2>ملفّ الحكاية باش يتحلّ على قريب</h2>
            <p>{s.intro}</p>
            <p className="muted">دخلتوا باسم {s.team.name}. الصفحة تتحدّث وحدها كي المضيف يشغّل الوقت.</p>
          </section>
        )}

        {s.stage === "done" && (
          <section className="sheet">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2 style={{ margin: 0 }}>التقرير تبعث</h2>
              <span className="stamp">تبعث</span>
            </div>
            <p style={{ marginTop: 12 }}>فريقكم كمّل. النتائج النهائية تتعلن في آخر النشاط.</p>
            {s.reveal ? (
              <>
                <h3>رسالة السبوعي</h3>
                <ul className="note plain"><li>{s.reveal.note}</li></ul>
                <h3>شنوة ورّاتنا التشنشينات</h3>
                <ul>{s.reveal.summary.map((l) => <li key={l}>{l}</li>)}</ul>
              </>
            ) : (
              <p className="muted">رسالة السبوعي تبقى مخبيّة لين المضيف يكشفها.</p>
            )}
          </section>
        )}

        {s.stage === "report" && s.report && (
          <ReportForm fields={s.report.fields} textFields={s.report.textFields} open={open} onDone={() => celebrate("التقرير تبعث")} />
        )}

        {ordered.map((p) =>
          p.solved ? (
            <details key={p.id} className="sheet">
              <summary>
                <span>{p.envelope}</span>
                <span className="stamp">تحلّوا</span>
              </summary>
              <Story p={p} />
            </details>
          ) : (
            <section key={p.id} className="sheet">
              <h2>{p.envelope}</h2>
              <Story p={p} />
              <PuzzleForm p={p} open={open} hintCost={s.score.hintCost} onSolved={(label) => celebrate(label)} onChange={load} />
            </section>
          )
        )}
      </main>

      {unlock && (
        <div className="unlock" role="status">
          <div>
            <div className="envelope" aria-hidden="true">
              <div className="letter" />
              <div className="flap" />
            </div>
            <h2>{unlock}</h2>
          </div>
        </div>
      )}
    </>
  );
}

function Story({ p }: { p: PuzzleState }) {
  return (
    <>
      <h3>{p.title}</h3>
      <p>{p.story}</p>
      {p.blocks.map((b, i) => (
        <BlockView key={i} b={b} />
      ))}
    </>
  );
}

function BlockView({ b }: { b: Block }) {
  if (b.type === "table") return <>
    {b.title && <div className="blockTitle">{b.title}</div>}
    <div className={b.spatial ? "puzzle-grid-wrap" : "scroll"}>
      <table className={b.spatial ? "puzzle-grid" : "puzzle-table"}>
        <thead><tr>{b.headers.map((header,i)=><th key={i} scope="col">{header}</th>)}</tr></thead>
        <tbody>{b.rows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{/^[٠-٩0-9]+$/.test(cell) ? <bdi dir="ltr">{cell}</bdi> : cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  </>;
  if (b.type === "callout") return <div className="callout">{b.text}</div>;
  if (b.type === "cards")
    return (
      <>
        {b.title && <div className="blockTitle">{b.title}</div>}
        {b.cards.map((c) => (
          <div className="card" key={c.id}>
            <div className="badge">
              {c.badge}
              {c.title && b.cards.some((x) => x.badge && x.badge.length === 1) && <small>{c.title}</small>}
            </div>
            <div>
              {c.title && !(c.badge && c.badge.length === 1) && <div className="badge" style={{ fontSize: 18 }}>{c.title}</div>}
              <div className="tx">{c.text}</div>
              {c.meta && <div className="meta">{c.meta}</div>}
            </div>
          </div>
        ))}
      </>
    );
  if (b.type === "list")
    return (
      <>
        {b.title && <div className="blockTitle">{b.title}</div>}
        <ul className="stmts">{b.items.map((t) => <li key={t}>{t}</li>)}</ul>
      </>
    );
  return (
    <>
      {b.title && <div className="blockTitle">{b.title}</div>}
      <ol className={`note ${b.numbered ? "numbered" : "plain"}`}>{b.lines.map((l, i) => <li key={i}>{l}</li>)}</ol>
      {b.footer && <div className="noteFoot">{b.footer}</div>}
    </>
  );
}

function FieldInput({ f, value, onChange }: { f: Field; value: string; onChange: (v: string) => void }) {
  const id = `f-${f.key}`;
  return (
    <div>
      <label htmlFor={id}>{f.label}</label>
      {f.options ? (
        <select id={id} aria-describedby={f.hint ? `${id}-hint` : undefined} value={value} onChange={(e) => onChange(e.target.value)}>
          {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input id={id} aria-describedby={f.hint ? `${id}-hint` : undefined} dir={f.key === "check" || f.key === "sighting" ? "ltr" : undefined} value={value} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} autoComplete="off" maxLength={80} />
      )}
      {f.hint && <p id={`${id}-hint`} className="muted report-hint">تذكير: {f.hint}</p>}
    </div>
  );
}

function PuzzleForm({
  p, open, hintCost, onSolved, onChange,
}: {
  p: PuzzleState; open: boolean; hintCost: number; onSolved: (label: string) => void; onChange: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [explanation, setExplanation] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function submit() {
    setBusy(true);
    setMsg(null);
    const { ok, data } = await post("/api/submit", { puzzle: p.id, answers, explanation });
    setBusy(false);
    if (ok && data.ok) {
      onSolved(p.id < 5 ? `الظرف ${p.id + 1} تحلّ` : "الظروف الكلّ تحلّوا");
    } else {
      setMsg({ text: String(data.message ?? data.error ?? "صارت مشكلة.") });
    }
  }

  async function hint() {
    setBusy(true);
    const { ok, data } = await post("/api/hint", { puzzle: p.id });
    setBusy(false);
    setConfirming(false);
    if (!ok) setMsg({ text: String(data.error ?? "التلميح موش متاح.") });
    onChange();
  }

  return (
    <>
      <div className="fields">
        {p.fields.map((f) => (
          <FieldInput key={f.key} f={f} value={answers[f.key] ?? ""} onChange={(v) => setAnswers((a) => ({ ...a, [f.key]: v }))} />
        ))}
        <div>
          <label htmlFor="explain">{p.explain.prompt}</label>
          <textarea id="explain" value={explanation} onChange={(e) => setExplanation(e.target.value)} maxLength={600} />
        </div>
        <div className="row">
          <button className="btn" onClick={submit} disabled={busy || !open}>ثبّت الجواب</button>
        </div>
        {msg && <div className={`msg${msg.ok ? " ok" : ""}`} role="alert">{msg.text}</div>}
      </div>

      <div className="hints">
        {p.hints.map((h, i) => (
          <div className="hint" key={i}><strong>التلميح {i + 1}.</strong> {h}</div>
        ))}
        {p.hintsUsed < 3 && !confirming && (
          <button className="btn ghost small" onClick={() => setConfirming(true)} disabled={busy || !open}>
            اطلب التلميح {p.hintsUsed + 1} (ينقص {hintCost} نقطة)
          </button>
        )}
        {confirming && (
          <div className="row">
            <span>ننقصوا {hintCost} نقطة على التلميح هذا؟</span>
            <button className="btn small" onClick={hint} disabled={busy || !open}>إي عطيني التلميح</button>
            <button className="btn ghost small" onClick={() => setConfirming(false)}>نكملوا نلوجوا وحدنا</button>
          </div>
        )}
        {p.hintsUsed >= 3 && <p className="muted">استعملتوا التلميحات الثلاثة متاع هاللغز.</p>}
      </div>
    </>
  );
}

function ReportForm({
  fields, textFields, open, onDone,
}: {
  fields: Field[]; textFields: Field[]; open: boolean; onDone: () => void;
}) {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const set = (k: string) => (v: string) => setVals((x) => ({ ...x, [k]: v }));

  async function send() {
    setBusy(true);
    setMsg("");
    const { ok, data } = await post("/api/report", { fields: vals });
    setBusy(false);
    setConfirm(false);
    if (ok) onDone();
    else setMsg(String(data.error ?? "التقرير ما تبعثش."));
  }

  return (
    <section className="sheet">
      <h2>التقرير الأخير</h2>
      <p>حلّيتوا الألغاز الخمسة. اكتبوا شنوة صار وراجعوا إجاباتكم مليح؛ التقرير يتبعث مرّة وحدة.</p>
      <p className="muted">التذكيرات تحت كل سؤال ظاهرة للفرق الكلّ وما تنقص حتى نقطة. تنجموا زادة تراجعوا الظروف المحلولة لتحت.</p>
      <div className="fields">
        {fields.map((f) => <FieldInput key={f.key} f={f} value={vals[f.key] ?? ""} onChange={set(f.key)} />)}
        {textFields.map((f) => (
          <div key={f.key}>
            <label htmlFor={`r-${f.key}`}>{f.label}</label>
            <textarea id={`r-${f.key}`} aria-describedby={f.hint ? `r-${f.key}-hint` : undefined} value={vals[f.key] ?? ""} onChange={(e) => set(f.key)(e.target.value)} maxLength={700} />
            {f.hint && <p id={`r-${f.key}-hint`} className="muted report-hint">تذكير: {f.hint}</p>}
          </div>
        ))}
        {!confirm ? (
          <div className="row"><button className="btn" onClick={() => setConfirm(true)} disabled={!open}>راجع وابعث</button></div>
        ) : (
          <div className="row">
            <span>نبعثوا التقرير النهائي؟ بعد ما يتبعث ما يتبدّلش.</span>
            <button className="btn small" onClick={send} disabled={busy || !open}>إي ابعث</button>
            <button className="btn ghost small" onClick={() => setConfirm(false)}>نكمّل نراجع</button>
          </div>
        )}
        {msg && <div className="msg" role="alert">{msg}</div>}
      </div>
    </section>
  );
}
