import { NextRequest } from "next/server";
import { PUZZLE_COUNT, REPORT_FIELDS, REPORT_TEXT_FIELDS, STORY_INTRO, getPuzzle } from "@/lib/content";
import { HINT_COST, PUZZLE_KEYS, REVEAL } from "@/lib/keys";
import { getEnv, getEvent, json, phaseOf, summaries, teamFromRequest } from "@/lib/server";

export async function GET(req: NextRequest) {
  const env = await getEnv();
  const team = await teamFromRequest(req, env);
  if (!team) return json({ error: "not_joined" }, 401);

  const now = Date.now();
  const ev = await getEvent(env);
  const { phase, investigationEnds, hardEnd } = phaseOf(ev, env, now);
  const [sum] = await summaries(env, team.id);

  const hintRows = await env.DB.prepare("SELECT puzzle, COUNT(*) AS used FROM hints WHERE team_id = ? GROUP BY puzzle")
    .bind(team.id)
    .all<{ puzzle: number; used: number }>();
  const used = new Map(hintRows.results.map((r) => [r.puzzle, r.used]));

  const solved = sum.solved;
  const stage = phase === "lobby" ? "lobby" : team.finished_at ? "done" : solved >= PUZZLE_COUNT ? "report" : "puzzle";

  // Only envelopes the team has opened are ever sent to the browser.
  const puzzles =
    phase === "lobby"
      ? []
      : Array.from({ length: Math.min(solved + 1, PUZZLE_COUNT) }, (_, i) => i + 1).map((n) => {
          const p = getPuzzle(n, team.variant)!;
          const hintsUsed = used.get(n) ?? 0;
          return { ...p, solved: n <= solved, hintsUsed, hints: PUZZLE_KEYS[n].hints.slice(0, hintsUsed) };
        });

  const showReport = stage === "report" || stage === "done";
  return json({
    now,
    intro: STORY_INTRO,
    team: { name: team.name, code: team.code },
    event: { phase, startedAt: ev.started_at, investigationEnds, hardEnd, revealed: !!ev.revealed },
    stage,
    solved,
    puzzles,
    report: showReport ? { fields: REPORT_FIELDS, textFields: REPORT_TEXT_FIELDS } : null,
    reveal: stage === "done" && ev.revealed ? REVEAL : null,
    score: { total: sum.total, hints: sum.hints, hintPenalty: sum.hint_penalty, hintCost: HINT_COST },
  });
}
