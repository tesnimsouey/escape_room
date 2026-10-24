import { validateTeamName } from "@/lib/team-name";
import { NextRequest } from "next/server";
import { getEnv, isAdmin, json } from "@/lib/server";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randomCode(len: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join("");
}

export async function POST(req: NextRequest) {
  const env = await getEnv();
  if (!(await isAdmin(req, env))) return json({ error: "يلزم دخول المضيف." }, 401);

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const action = String(body?.action ?? "");
  const now = Date.now();
  const db = env.DB;

  switch (action) {
    case "start":
      await db.prepare("UPDATE event SET started_at = ?, locked = 0 WHERE id = 1 AND started_at IS NULL").bind(now).run();
      break;
    case "addTime": {
      const minutes = body?.minutes;
      if (typeof minutes !== "number" || !Number.isInteger(minutes) || minutes < 1 || minutes > 60)
        return json({ error: "اختار عدد صحيح من 1 إلى 60 دقيقة." }, 400);
      const duration = ((Number(env.INVESTIGATION_MINUTES) || 35) + (Number(env.GRACE_MINUTES) || 5)) * 60_000;
      // Atomic increments preserve simultaneous additions. If time expired, restart from now.
      const result = await db.prepare("UPDATE event SET extra_ms = extra_ms + ? + MAX(0, ? - (started_at + ? + extra_ms)) WHERE id = 1 AND started_at IS NOT NULL AND locked = 0 AND revealed = 0")
        .bind(minutes * 60_000, now, duration).run();
      if (!result.meta.changes) return json({ error: "يلزم النشاط يكون بدا، والإرسال محلول، والحلّ ما تكشفش. كان سكّرت الإرسال، عاود حلّو قبل ما تزيد الوقت." }, 409);
      break;
    }
    case "resetClock":
      await db.prepare("UPDATE event SET started_at = NULL, extra_ms = 0, locked = 0 WHERE id = 1").run();
      break;
    case "lock":
    case "unlock":
      await db.prepare("UPDATE event SET locked = ? WHERE id = 1").bind(action === "lock" ? 1 : 0).run();
      break;
    case "reveal":
    case "unreveal":
      await db.prepare("UPDATE event SET revealed = ? WHERE id = 1").bind(action === "reveal" ? 1 : 0).run();
      break;
    case "createTeams": {
      const count = Math.max(1, Math.min(60, Number(body?.count) || 0));
      const row = await db.prepare("SELECT COUNT(*) AS c FROM teams").first<{ c: number }>();
      const start = row?.c ?? 0;
      const stmts = Array.from({ length: count }, (_, i) => {
        const n = start + i + 1;
        return db
          .prepare("INSERT INTO teams (code, token, name, variant, created_at) VALUES (?, ?, ?, ?, ?)")
          .bind(`T${String(n).padStart(2, "0")}-${randomCode(4)}`, crypto.randomUUID(), `فريق ${n}`, ["A", "B", "C"][(n - 1) % 3], now);
      });
      await db.batch(stmts);
      break;
    }
    case "rename": {
      const { name, error } = validateTeamName(body?.name);
      if (error) return json({ error }, 400);
      const existing = await db.prepare("SELECT id FROM teams WHERE id = ?").bind(Number(body?.teamId)).first();
      if (!existing) return json({ error: "الفريق موش موجود." }, 404);
      await db.prepare("UPDATE teams SET name = ? WHERE id = ?").bind(name, Number(body?.teamId)).run();
      break;
    }
    case "review": {
      const teamId = Number(body?.teamId);
      const item = String(body?.item ?? "");
      const row = await db.prepare("SELECT max_points AS m FROM graded WHERE team_id = ? AND item = ?").bind(teamId, item).first<{ m: number }>();
      if (!row) return json({ error: "الإجابة موش موجودة." }, 404);
      const raw = body?.points;
      const pts = raw === null || raw === "" ? null : Math.max(0, Math.min(row.m, Math.round(Number(raw) || 0)));
      await db.prepare("UPDATE graded SET admin_points = ? WHERE team_id = ? AND item = ?").bind(pts, teamId, item).run();
      break;
    }
    case "resetAll": {
      // Clears all play data (use after a dry run). Optionally removes the teams too.
      const stmts = [
        db.prepare("DELETE FROM solves"),
        db.prepare("DELETE FROM attempts"),
        db.prepare("DELETE FROM hints"),
        db.prepare("DELETE FROM graded"),
        db.prepare("UPDATE teams SET finished_at = NULL"),
        db.prepare("UPDATE event SET started_at = NULL, extra_ms = 0, locked = 0, revealed = 0 WHERE id = 1"),
      ];
      if (body?.removeTeams) stmts.push(db.prepare("DELETE FROM teams"));
      else if (body?.renewAccess === true) {
        const { results } = await db.prepare("SELECT id FROM teams").all<{ id: number }>();
        for (const team of results) {
          stmts.push(db.prepare("UPDATE teams SET code = ?, token = ? WHERE id = ?")
            .bind(`T${String(team.id).padStart(2, "0")}-${randomCode(8)}`, crypto.randomUUID(), team.id));
        }
      }
      await db.batch(stmts);
      break;
    }
    default:
      return json({ error: "الطلب هذا موش معروف." }, 400);
  }
  return json({ ok: true });
}
