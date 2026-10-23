import { NextRequest } from "next/server";
import { PUZZLE_COUNT } from "@/lib/content";
import { gradeRubric } from "@/lib/grade";
import { FIELD_POINTS, REPORT_FIELD_CHECKS, REPORT_TEXT_RUBRICS } from "@/lib/keys";
import { getEnv, getEvent, json, phaseOf, teamFromRequest, readJson } from "@/lib/server";

export async function POST(req: NextRequest) {
  const env = await getEnv();
  const team = await teamFromRequest(req, env);
  if (!team) return json({ error: "not_joined" }, 401);

  const now = Date.now();
  const { phase } = phaseOf(await getEvent(env), env, now);
  if (phase !== "investigation" && phase !== "final") return json({ error: "Report submissions are closed." }, 409);
  if (team.finished_at) return json({ error: "Your report is already submitted." }, 409);

  const solvedRow = await env.DB.prepare("SELECT COUNT(*) AS c FROM solves WHERE team_id = ?").bind(team.id).first<{ c: number }>();
  if ((solvedRow?.c ?? 0) < PUZZLE_COUNT) return json({ error: "Solve all five puzzles first." }, 409);

  const body = await readJson(req);
  const fields = (body.fields ?? {}) as Record<string, unknown>;
  const val = (k: string) => String(fields[k] ?? "").slice(0, 700).trim();

  const fieldKeys = Object.keys(REPORT_FIELD_CHECKS);
  const textKeys = Object.keys(REPORT_TEXT_RUBRICS);
  if ([...fieldKeys, ...textKeys].some((k) => !val(k))) {
    return json({ error: "Answer every question before submitting the report." }, 400);
  }

  const ins = "INSERT OR IGNORE INTO graded (team_id, item, kind, text, max_points, auto_points, at) VALUES (?, ?, ?, ?, ?, ?, ?)";
  const stmts = [
    ...fieldKeys.map((k) =>
      env.DB.prepare(ins).bind(team.id, `f_${k}`, "field", val(k), FIELD_POINTS, REPORT_FIELD_CHECKS[k](val(k)) ? FIELD_POINTS : 0, now)
    ),
    ...textKeys.map((k) => {
      const { max, rubric } = REPORT_TEXT_RUBRICS[k];
      return env.DB.prepare(ins).bind(team.id, `r_${k}`, "reason", val(k), max, gradeRubric(val(k), rubric, max), now);
    }),
    env.DB.prepare("UPDATE teams SET finished_at = ? WHERE id = ? AND finished_at IS NULL").bind(now, team.id),
  ];
  await env.DB.batch(stmts);
  return json({ ok: true });
}
