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
  if (!(await isAdmin(req, env))) return json({ error: "unauthorized" }, 401);

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const action = String(body?.action ?? "");
  const now = Date.now();
  const db = env.DB;

  switch (action) {
    case "start":
      await db.prepare("UPDATE event SET started_at = ?, locked = 0 WHERE id = 1 AND started_at IS NULL").bind(now).run();
      break;
    case "resetClock":
      await db.prepare("UPDATE event SET started_at = NULL, locked = 0 WHERE id = 1").run();
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
          .bind(`T${String(n).padStart(2, "0")}-${randomCode(4)}`, crypto.randomUUID(), `Team ${n}`, ["A", "B", "C"][(n - 1) % 3], now);
      });
      await db.batch(stmts);
      break;
    }
    case "rename": {
      const { name, error } = validateTeamName(body?.name);
      if (error) return json({ error }, 400);
      const existing = await db.prepare("SELECT id FROM teams WHERE id = ?").bind(Number(body?.teamId)).first();
      if (!existing) return json({ error: "Team not found." }, 404);
      await db.prepare("UPDATE teams SET name = ? WHERE id = ?").bind(name, Number(body?.teamId)).run();
      break;
    }
    case "review": {
      const teamId = Number(body?.teamId);
      const item = String(body?.item ?? "");
      const row = await db.prepare("SELECT max_points AS m FROM graded WHERE team_id = ? AND item = ?").bind(teamId, item).first<{ m: number }>();
      if (!row) return json({ error: "Item not found." }, 404);
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
        db.prepare("UPDATE event SET started_at = NULL, locked = 0, revealed = 0 WHERE id = 1"),
      ];
      if (body?.removeTeams) stmts.push(db.prepare("DELETE FROM teams"));
      await db.batch(stmts);
      break;
    }
    default:
      return json({ error: "Unknown action." }, 400);
  }
  return json({ ok: true });
}
