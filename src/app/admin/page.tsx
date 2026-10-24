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
  p1: "تفسير اللغز الأوّل", p2: "تفسير اللغز الثاني", p3: "تفسير اللغز الثالث", p4: "تفسير اللغز الرابع",
  p5: "تفسير اللغز الخامس", r_evidence: "التقرير أقوى القرائن", r_noprove: "التقرير شنوة الورقة ما تثبتش",
  r_verify: "سؤال التثبّت",
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
      if (!r.ok) throw new Error("ما نجّمناش نحمّلوا صفحة التنظيم.");
      setData((await r.json()) as Overview);
      setAuthed(true);
      setError("");
    } catch { setError("الاتّصال تقطع. نعاودوا نحاولوا وحدنا…"); }
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
    } catch { setError("التبديل ما تسجّلش. عاود جرّب."); }
    finally { setBusy(false); }
  }

  if (authed === null) return <main className="wrap onDesk"><p role="status">{error || "نحمّلوا…"}</p></main>;
  if (!authed) return <Login onDone={load} />;
  if (!data) return null;

  const ev = data.event;
  return (
    <main className="wrap onDesk admin-wrap" aria-busy={busy}>
      <h1 style={{ marginTop: 20 }}>صفحة التنظيم</h1>
      <p className="muted">
        الوقت: {({lobby:"ما بداش",investigation:"وقت البحث",final:"المهلة الأخيرة",closed:"تسكّر"} as Record<string,string>)[ev.phase]}
        {ev.locked ? " (المضيف سكّر الإرسال)" : ""} · الفرق: {data.teams.length}.
      </p>

      <EventClock event={ev} serverNow={data.now} />
      {error && <div className="msg" role="alert">{error}</div>}
      <a className="host-home" href="/">صفحة دخول الفرق</a>
      <div className="tabs" role="group" aria-label="صفحات التنظيم">
        {(["live", "review", "teams", "winners"] as const).map((t) => (
          <button key={t} aria-pressed={tab === t} className={`btn small${tab === t ? "" : " ghost"}`} onClick={() => setTab(t)}>
            {{ live: "النقاط توّا", review: `المراجعة (${data.review.length})`, teams: "الفرق", winners: "الرابحين" }[t]}
          </button>
        ))}
      </div>

      {tab === "live" && (
        <>
          <section className="sheet">
            <h2>التحكّم في النشاط</h2>
            <div className="row">
              {ev.phase === "lobby" && <button className="btn" onClick={() => run({ action: "start" }, "نشغّلوا الوقت للفرق الكلّ توّا؟")}>شغّل الوقت</button>}
              {ev.phase !== "lobby" && !ev.locked && <button className="btn ghost" onClick={() => run({ action: "lock" }, "نسكّروا الإرسال على الفرق الكلّ؟")}>سكّر الإرسال</button>}
              {ev.locked && <button className="btn ghost" onClick={() => run({ action: "unlock" })}>عاود حلّ الإرسال</button>}
              <button className="btn ghost" onClick={() => run({ action: ev.revealed ? "unreveal" : "reveal" })}>
                {ev.revealed ? "خبّي رسالة السبوعي" : "اكشف رسالة السبوعي للفرق"}
              </button>
            </div>
            <p className="muted" style={{ marginTop: 12 }}>
              كمّلتوا التجربة؟ <button className="btn ghost small" onClick={() => run({ action: "resetAll" }, "نفسخوا النقاط والمحاولات والتلميحات ونرجّعوا الوقت للبداية؟ الفرق تبقى موجودة.")}>فسّخ معطيات اللعب</button>
            </p>
          </section>
          <section className="sheet">
            <h2>ترتيب الفرق</h2>
            <div className="scroll">
              <table className="tbl">
                <thead><tr><th>#</th><th>الفريق</th><th>تحلّوا</th><th>تلميحات</th><th>غلطات</th><th>النقاط</th><th>التقرير تبعث</th></tr></thead>
                <tbody>
                  {data.teams.map((t, i) => (
                    <tr key={t.id}>
                      <td>{i + 1}</td><td>{t.name}</td><td>{t.solved}/5</td><td>{t.hints}</td><td>{t.wrong}</td>
                      <td><strong>{t.total}</strong></td>
                      <td>{t.finished_at && ev.startedAt ? `${Math.floor((t.finished_at - ev.startedAt) / 60000)} د ${Math.floor(((t.finished_at - ev.startedAt) % 60000) / 1000)} ث` : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted" style={{ marginTop: 10 }}>كان النقاط تتساوى، الأسبق في التقرير يربح؛ وبعدها الأعلى في نقاط التفسير.</p>
          </section>
        </>
      )}

      {tab === "review" && (
        <section className="sheet">
          <h2>الإجابات المكتوبة</h2>
          <p className="muted">النقاط تتحسب حسب المعاني والكلمات. تنجم تصلّح أي عدد. خلّي الخانة فارغة واضغط على زرّ التأكيد في لوحة المفاتيح باش ترجع للنقاط الآلية.</p>
          {data.review.length === 0 && <p>ما فماش إجابات مكتوبة توّا.</p>}
          {[...data.review].sort((a, b) => a.auto / a.max - b.auto / b.max).map((r) => (
            <div className="rev" key={`${r.teamId}-${r.item}`}>
              <strong>{r.team}</strong> · {ITEM_LABELS[r.item] ?? r.item}
              <p>{r.text || "(ما فماش نصّ)"}</p>
              <ReviewScore r={r} onSave={(points) => run({ action: "review", teamId: r.teamId, item: r.item, points })} />
            </div>
          ))}
        </section>
      )}

      {tab === "teams" && (
        <section className="sheet">
          <h2>الفرق والرموز</h2>
          <p className="muted">باش تبدأ نشاط جديد من الصفر، فسّخ الفرق ومعطيات اللعب الكلّ، وبعدها اختار عدد الفرق الجديدة واضغط «كوّن الفرق» باش تتحصّل على رموز وروابط دخول جديدة.</p>
          <div className="row">
            <button className="btn ghost" disabled={busy || data.teams.length === 0} onClick={() => run({ action: "resetAll", removeTeams: true }, "باش نفسخوا الفرق الكلّ وأسماءهم والنقاط والإجابات والمحاولات والتلميحات ونرجّعوا الوقت للبداية. الروابط والجلسات القديمة تتلغى. المسح نهائي وما ينجمش يرجع. متأكد؟")}>فسّخ الفرق ومعطيات اللعب الكلّ</button>
          </div>
          {data.teams.length === 0 && <p role="status">ما فماش فرق. اختار العدد وكوّن فرق جديدة من هنا.</p>}

          <CreateTeams onCreate={(count) => run({ action: "createTeams", count })} />
          <div className="scroll">
            <table className="tbl">
              <thead><tr><th>الفريق</th><th>الرمز</th><th>النسخة</th><th>رابط الدخول</th></tr></thead>
              <tbody>
                {[...data.teams].sort((a, b) => a.id - b.id).map((t) => (
                  <tr key={t.id}>
                    <td><RenameBox t={t} onSave={(name) => run({ action: "rename", teamId: t.id, name })} /></td>
                    <td><strong>{t.code}</strong></td>
                    <td>{{A:"أ",B:"ب",C:"ج"}[t.variant] ?? t.variant}</td>
                    <td><a href={`/?code=${encodeURIComponent(t.code)}`} target="_blank" rel="noopener noreferrer">ادخل <bdi dir="ltr">{t.code}</bdi> ↗</a></td>
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
    else setErr(r.status === 401 ? "كلمة السرّ غالطة." : "الدخول موش متاح توّا. عاود جرّب.");
    } catch { setErr("ما نجّمناش نتّصلوا. عاود جرّب."); }
  }
  return (
    <main className="wrap onDesk">
      <form className="sheet" onSubmit={submit} style={{ marginTop: 40 }}>
        <h2>دخول المضيف</h2>
        <div className="fields" style={{ borderTop: 0, paddingTop: 0 }}>
          <div><label htmlFor="pw">كلمة السرّ</label><input id="pw" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus /></div>
          <div className="row"><button className="btn" disabled={!pw}>ادخل</button></div>
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
      <span>آلي {r.auto}/{r.max}</span>
      <input aria-label={`نقاط المضيف لفريق ${r.team}: ${ITEM_LABELS[r.item] ?? r.item}`} className="num" type="number" min={0} max={r.max} value={v} placeholder={String(r.auto)}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onSave(v === "" ? null : Number(v)); }} />
      <button className="btn small" onClick={() => onSave(v === "" ? null : Number(v))}>سجّل</button>
      {r.admin !== null && <span className="muted">نقاط المضيف {r.admin}</span>}
    </div>
  );
}

function CreateTeams({ onCreate }: { onCreate: (n: number) => void }) {
  const [n, setN] = useState(24);
  return (
    <div className="row" style={{ marginBottom: 14 }}>
      <label htmlFor="n" style={{ margin: 0 }}>زيد فرق</label>
      <input id="n" className="num" type="number" min={1} max={60} value={n} onChange={(e) => setN(Number(e.target.value))} />
      <button className="btn small" onClick={() => onCreate(n)}>كوّن الفرق</button>
    </div>
  );
}

function RenameBox({ t, onSave }: { t: Team; onSave: (name: string) => void }) {
  return <input aria-label={`اسم الفريق ${t.code}`} required defaultValue={t.name} maxLength={30} style={{ minHeight: 34, padding: "4px 8px", fontSize: 15 }}
    onBlur={(e) => { if (!e.target.value.trim()) { e.target.value = t.name; return; } if (e.target.value !== t.name) onSave(e.target.value); }} />;
}

function Winners({ teams }: { teams: Team[] }) {
  const finished = teams.filter((t) => t.finished_at);
  const top = finished.slice(0, 3);
  const [shown, setShown] = useState(0);
  const order = [...top].reverse(); // third, second, first
  const place = (i: number) => ["الأولى", "الثانية", "الثالثة"][top.length - 1 - i];
  return (
    <section className="sheet">
      <h2>الرابحين</h2>
      <p className="muted">كان الفرق اللي بعثت التقرير تدخل في ترتيب الرابحين. اكشف المراتب وحدة بوحدة.</p>
      {top.length === 0 && <p>حتى فريق ما كمّل توّا.</p>}
      {order.slice(0, shown).map((t, i) => (
        <p className="win" key={t.id}>{t.name}<small>المرتبة {place(i)}، {t.total} نقطة</small></p>
      ))}
      <div className="row">
        <button className="btn" disabled={shown >= order.length} onClick={() => setShown((s) => s + 1)}>اكشف المرتبة الجاية</button>
        <button className="btn ghost" onClick={() => setShown(0)}>خبّي الكلّ</button>
      </div>
    </section>
  );
}
