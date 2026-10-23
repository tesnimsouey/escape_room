// SERVER ONLY helpers shared by the API routes.

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import type { Variant } from "./content";
import { HINT_COST } from "./keys";

export async function getEnv(): Promise<CloudflareEnv> {
  return (await getCloudflareContext({ async: true })).env;
}

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export const TEAM_COOKIE = "er_team";
export const ADMIN_COOKIE = "er_admin";

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 12,
};

export interface EventRow {
  started_at: number | null;
  locked: number;
  revealed: number;
}

export interface TeamRow {
  id: number;
  code: string;
  token: string;
  name: string;
  variant: Variant;
  finished_at: number | null;
  created_at: number;
}

export async function getEvent(env: CloudflareEnv): Promise<EventRow> {
  const row = await env.DB.prepare("SELECT started_at, locked, revealed FROM event WHERE id = 1").first<EventRow>();
  return row ?? { started_at: null, locked: 0, revealed: 0 };
}

export type Phase = "lobby" | "investigation" | "final" | "closed";

export function phaseOf(ev: EventRow, env: CloudflareEnv, now: number) {
  const inv = (Number(env.INVESTIGATION_MINUTES) || 35) * 60_000;
  const grace = (Number(env.GRACE_MINUTES) || 5) * 60_000;
  const start = ev.started_at;
  const investigationEnds = start ? start + inv : null;
  const hardEnd = start ? start + inv + grace : null;
  let phase: Phase;
  if (ev.locked) phase = "closed";
  else if (!start) phase = "lobby";
  else if (now < start + inv) phase = "investigation";
  else if (now < start + inv + grace) phase = "final";
  else phase = "closed";
  return { phase, investigationEnds, hardEnd };
}

export async function teamFromRequest(req: NextRequest, env: CloudflareEnv): Promise<TeamRow | null> {
  const token = req.cookies.get(TEAM_COOKIE)?.value;
  if (!token) return null;
  return env.DB.prepare("SELECT * FROM teams WHERE token = ?").bind(token).first<TeamRow>();
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function adminCookieValue(env: CloudflareEnv): Promise<string> {
  return sha256Hex(`${env.ADMIN_PASSWORD}:er-admin-v1`);
}

export async function passwordMatches(env: CloudflareEnv, given: string): Promise<boolean> {
  if (!env.ADMIN_PASSWORD) return false;
  const [a, b] = await Promise.all([sha256Hex(given), sha256Hex(env.ADMIN_PASSWORD)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function isAdmin(req: NextRequest, env: CloudflareEnv): Promise<boolean> {
  const c = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!c || !env.ADMIN_PASSWORD) return false;
  const expected = await adminCookieValue(env);
  if (c.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < c.length; i++) diff |= c.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export interface Summary {
  id: number;
  code: string;
  name: string;
  variant: Variant;
  finished_at: number | null;
  solved: number;
  solve_pts: number;
  graded_pts: number;
  reason_pts: number;
  hints: number;
  wrong: number;
  hint_penalty: number;
  total: number;
}

/** Score summary for one team (teamId) or all teams. Total = solves + graded - hints x 15. */
export async function summaries(env: CloudflareEnv, teamId?: number): Promise<Summary[]> {
  const sql = `
    SELECT t.id, t.code, t.name, t.variant, t.finished_at,
      (SELECT COUNT(*) FROM solves s WHERE s.team_id = t.id) AS solved,
      (SELECT COALESCE(SUM(points), 0) FROM solves s WHERE s.team_id = t.id) AS solve_pts,
      (SELECT COALESCE(SUM(COALESCE(admin_points, auto_points)), 0) FROM graded g WHERE g.team_id = t.id) AS graded_pts,
      (SELECT COALESCE(SUM(COALESCE(admin_points, auto_points)), 0) FROM graded g WHERE g.team_id = t.id AND g.kind = 'reason') AS reason_pts,
      (SELECT COUNT(*) FROM hints h WHERE h.team_id = t.id) AS hints,
      (SELECT COUNT(*) FROM attempts a WHERE a.team_id = t.id AND a.correct = 0) AS wrong
    FROM teams t ${teamId ? "WHERE t.id = ?" : ""} ORDER BY t.id`;
  const stmt = env.DB.prepare(sql);
  const { results } = await (teamId ? stmt.bind(teamId) : stmt).all<Omit<Summary, "hint_penalty" | "total">>();
  return results.map((r) => ({
    ...r,
    hint_penalty: r.hints * HINT_COST,
    total: r.solve_pts + r.graded_pts - r.hints * HINT_COST,
  }));
}

/** Ranking: score, then earliest final report, then evidence-reasoning subtotal. */
export function rank(list: Summary[]): Summary[] {
  return [...list].sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    const fa = a.finished_at ?? Number.MAX_SAFE_INTEGER;
    const fb = b.finished_at ?? Number.MAX_SAFE_INTEGER;
    if (fa !== fb) return fa - fb;
    return b.reason_pts - a.reason_pts;
  });
}

/** Parse a JSON request body into a loose object (empty object if invalid). */
export async function readJson(req: NextRequest): Promise<Record<string, unknown>> {
  const v = (await req.json().catch(() => null)) as unknown;
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}
