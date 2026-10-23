// Normalizers and keyword grading. Pure functions, no secrets here.

export function normText(s: unknown): string {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** "10:20", "1020", "10.20", "10h20", "10:20 am" -> "10:20" (else ""). */
export function normTime(s: unknown): string {
  const m = String(s ?? "").match(/(\d{1,2})\s*[:.h]?\s*(\d{2})/);
  if (!m) return "";
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

/** Letters only, uppercase: "Supply-Cabinet" -> "SUPPLYCABINET". */
export function normLetters(s: unknown): string {
  return String(s ?? "").toUpperCase().replace(/[^A-Z]/g, "");
}

/** Letters and digits only, uppercase: "orbit 27" -> "ORBIT27". */
export function normKey(s: unknown): string {
  return String(s ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function has(text: string, kw: string): boolean {
  const k = kw.toLowerCase();
  // Short plain words ("no", "not", "saw") must match as whole words.
  if (/^[a-z]{1,3}$/.test(k)) return new RegExp(`\\b${k}\\b`).test(text);
  return text.includes(k);
}

export function hasAny(text: unknown, keywords: string[]): boolean {
  const t = normText(text);
  return keywords.some((k) => has(t, k));
}

/** Points = max * (matched groups / total groups), rounded. Empty text scores 0. */
export function gradeRubric(text: unknown, rubric: string[][], max: number): number {
  const t = normText(text);
  if (t.length < 3) return 0;
  const matched = rubric.filter((group) => group.some((k) => has(t, k))).length;
  return Math.round((max * matched) / rubric.length);
}
