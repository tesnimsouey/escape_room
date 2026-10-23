import { NextRequest } from "next/server";
import { PUZZLE_COUNT } from "@/lib/content";
import { HINT_COST, PUZZLE_KEYS } from "@/lib/keys";
import { getEnv, getEvent, json, phaseOf, teamFromRequest, readJson } from "@/lib/server";

export async function POST(req: NextRequest) {
  const env = await getEnv();
  const team = await teamFromRequest(req, env);
  if (!team) return json({ error: "يلزم تدخل لفريقك." }, 401);

  const body = await readJson(req);
  const puzzle = Number(body.puzzle);
  const now = Date.now();
  const { phase } = phaseOf(await getEvent(env), env, now);
  if (phase !== "investigation" && phase !== "final") return json({ error: "التلميحات موش متاحة توّا." }, 409);

  const solvedRow = await env.DB.prepare("SELECT COUNT(*) AS c FROM solves WHERE team_id = ?").bind(team.id).first<{ c: number }>();
  if (!Number.isInteger(puzzle) || puzzle !== (solvedRow?.c ?? 0) + 1 || puzzle > PUZZLE_COUNT) {
    return json({ error: "تنجم تطلب تلميح كان للغز اللي وصلتلو." }, 409);
  }

  const usedRow = await env.DB.prepare("SELECT COUNT(*) AS c FROM hints WHERE team_id = ? AND puzzle = ?").bind(team.id, puzzle).first<{ c: number }>();
  const used = usedRow?.c ?? 0;
  if (used >= 3) return json({ error: "التلميحات الثلاثة متاع هاللغز استعملتوهم الكلّ." }, 409);

  // The (team, puzzle, level) primary key makes a double tap charge only once.
  const level = used + 1;
  await env.DB.prepare("INSERT OR IGNORE INTO hints (team_id, puzzle, level, used_at) VALUES (?, ?, ?, ?)")
    .bind(team.id, puzzle, level, now)
    .run();
  return json({ ok: true, level, text: PUZZLE_KEYS[puzzle].hints[level - 1], cost: HINT_COST });
}
