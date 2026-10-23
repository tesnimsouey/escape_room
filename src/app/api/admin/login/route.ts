import { NextRequest } from "next/server";
import { ADMIN_COOKIE, adminCookieValue, cookieOptions, getEnv, json, passwordMatches, readJson } from "@/lib/server";

export async function POST(req: NextRequest) {
  const env = await getEnv();
  const body = await readJson(req);
  if (!(await passwordMatches(env, String(body.password ?? "")))) {
    return json({ error: "كلمة السرّ غالطة." }, 401);
  }
  const res = json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, await adminCookieValue(env), cookieOptions);
  return res;
}
