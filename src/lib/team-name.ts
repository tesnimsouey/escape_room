export const TEAM_NAME_MAX = 30;

/** Team names must be strings containing visible text, with a maximum of 30 characters. */
export function validateTeamName(value: unknown): { name: string; error?: string } {
  if (typeof value !== "string" || !value.trim()) return { name: "", error: "Enter your team name." };
  const name = value.trim();
  if ([...name].length > TEAM_NAME_MAX) return { name, error: "Team names must be 30 characters or fewer." };
  return { name };
}
