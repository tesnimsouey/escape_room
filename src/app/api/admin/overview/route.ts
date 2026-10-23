import { NextRequest } from "next/server";
import { getEnv, getEvent, isAdmin, json, phaseOf, rank, summaries } from "@/lib/server";

export async function GET(req: NextRequest) {
  const env = await getEnv();
  if (!(await isAdmin(req, env))) return json({ error: "يلزم دخول المضيف." }, 401);

  const now = Date.now();
  const ev = await getEvent(env);
  const { phase, investigationEnds, hardEnd } = phaseOf(ev, env, now);
  const ranked = rank(await summaries(env));

  const review = await env.DB.prepare(
    `SELECT g.team_id AS teamId, t.name AS team, g.item, g.text, g.max_points AS max, g.auto_points AS auto, g.admin_points AS admin
     FROM graded g JOIN teams t ON t.id = g.team_id WHERE g.kind = 'reason' ORDER BY g.at DESC LIMIT 400`
  ).all();

  return json({
    now,
    event: { phase, startedAt: ev.started_at, investigationEnds, hardEnd, locked: !!ev.locked, revealed: !!ev.revealed },
    teams: ranked,
    review: review.results,
  });
}
