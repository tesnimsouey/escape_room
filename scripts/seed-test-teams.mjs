import { randomUUID } from "node:crypto";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

// Local only. Re-running preserves existing teams and their progress.
const directory = mkdtempSync(join(tmpdir(), "escape-room-seed-"));
const file = join(directory, "teams.sql");
const codes = Array.from({ length: 6 }, (_, i) => `TEST-${String(i + 1).padStart(2, "0")}`);
const sql = codes.map((code, i) =>
  `INSERT INTO teams (code, token, name, variant, created_at) VALUES ('${code}', '${randomUUID()}', 'Test Team ${i + 1}', '${["A", "B", "C"][i % 3]}', ${Date.now()}) ON CONFLICT(code) DO NOTHING;`
).join("\n");
try {
  writeFileSync(file, sql);
  const result = spawnSync(process.execPath, ["node_modules/wrangler/bin/wrangler.js", "d1", "execute", "escape-room-db", "--local", "--file", file], { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exitCode = result.status ?? 1;
  else codes.forEach((code) => console.log(`${code}: http://localhost:3000/?code=${code}`));
} finally {
  rmSync(directory, { recursive: true, force: true });
}
