import { validateTeamName } from "@/lib/team-name";
import { NextRequest } from "next/server";
import { TEAM_COOKIE, cookieOptions, getEnv, getEvent, json, TeamRow, readJson } from "@/lib/server";

export async function POST(req: NextRequest) {
  const body = await readJson(req);
  const code = String(body.code ?? "").trim().toUpperCase();
  const { name, error } = validateTeamName(body.name);
  if (!code) return json({ error: "Enter your team code." }, 400);
  if (error) return json({ error }, 400);

  const env = await getEnv();
  const team = await env.DB.prepare("SELECT * FROM teams WHERE code = ?").bind(code).first<TeamRow>();
  if (!team) return json({ error: "That code does not match a team. Check it and try again." }, 404);

  // Teams may choose a display name until the clock starts.
  const ev = await getEvent(env);
  if (ev.started_at && name !== team.name) return json({ error: "The clock has started. Enter your team’s existing name to rejoin." }, 409);
  if (!ev.started_at) {
    await env.DB.prepare("UPDATE teams SET name = ? WHERE id = ?").bind(name, team.id).run();
  }

  const res = json({ ok: true });
  res.cookies.set(TEAM_COOKIE, team.token, cookieOptions);
  return res;
}
