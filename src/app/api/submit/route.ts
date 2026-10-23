import { NextRequest } from "next/server";
import { PUZZLE_COUNT } from "@/lib/content";
import { gradeRubric } from "@/lib/grade";
import { ANSWER_POINTS, Answers, PUZZLE_KEYS, REASON_POINTS } from "@/lib/keys";
import { getEnv, getEvent, json, phaseOf, teamFromRequest, readJson } from "@/lib/server";

const WRONG = "موش هكّا توّا، عاودوا شوفوا المعطيات مليح.";

export async function POST(req: NextRequest) {
  const env = await getEnv();
  const team = await teamFromRequest(req, env);
  if (!team) return json({ error: "يلزم تدخل لفريقك." }, 401);

  const body = await readJson(req);
  const puzzle = Number(body.puzzle);
  const explanation = String(body.explanation ?? "").slice(0, 600).trim();
  const answers: Answers = {};
  for (const [k, v] of Object.entries((body.answers ?? {}) as Record<string, unknown>)) {
    answers[k.slice(0, 20)] = String(v ?? "").slice(0, 80);
  }

  const now = Date.now();
  const { phase } = phaseOf(await getEvent(env), env, now);
  if (phase === "lobby") return json({ error: "التحقيق ما بداش توّا." }, 409);
  if (phase === "closed") return json({ error: "التحقيق تسكّر." }, 409);

  const solvedRow = await env.DB.prepare("SELECT COUNT(*) AS c FROM solves WHERE team_id = ?").bind(team.id).first<{ c: number }>();
  const solved = solvedRow?.c ?? 0;
  if (!Number.isInteger(puzzle) || puzzle !== solved + 1 || puzzle > PUZZLE_COUNT) {
    return json({ error: "الظرف هذا ما زال ما تحلّش لفريقكم." }, 409);
  }

  const key = PUZZLE_KEYS[puzzle];
  if (puzzle === 2 && explanation.length < 20) {
    return json({ error: "المرحلة هاذي يلزمها زادة تفسير مكتوب فيه عشرين حرف على الأقلّ." }, 400);
  }

  const last = await env.DB.prepare("SELECT MAX(at) AS m FROM attempts WHERE team_id = ?").bind(team.id).first<{ m: number | null }>();
  if (last?.m && now - last.m < 1500) return json({ error: "استنّى لحظة وعاود جرّب." }, 429);

  const correct = key.check(answers);
  const stmts = [
    env.DB.prepare("INSERT INTO attempts (team_id, puzzle, answer, correct, at) VALUES (?, ?, ?, ?, ?)")
      .bind(team.id, puzzle, JSON.stringify({ answers, explanation }), correct ? 1 : 0, now),
  ];
  if (correct) {
    stmts.push(
      env.DB.prepare("INSERT OR IGNORE INTO solves (team_id, puzzle, solved_at, points) VALUES (?, ?, ?, ?)")
        .bind(team.id, puzzle, now, ANSWER_POINTS),
      env.DB.prepare(
        "INSERT OR IGNORE INTO graded (team_id, item, kind, text, max_points, auto_points, at) VALUES (?, ?, 'reason', ?, ?, ?, ?)"
      ).bind(team.id, `p${puzzle}`, explanation, REASON_POINTS, gradeRubric(explanation, key.rubric, REASON_POINTS), now)
    );
  }
  await env.DB.batch(stmts);

  if (!correct) return json({ ok: false, message: WRONG });
  return json({ ok: true, opened: puzzle < PUZZLE_COUNT ? puzzle + 1 : "report" });
}
