export const CURRENT_SEASON = "2026/27";

const SEASON_START = new Date("2026-09-01");
const SEASON_END = new Date("2027-05-31");

export function getSeasonWeeks(): { total: number; elapsed: number } {
  const now = new Date();
  const totalMs = SEASON_END.getTime() - SEASON_START.getTime();
  const elapsedMs = Math.max(0, now.getTime() - SEASON_START.getTime());
  const total = Math.round(totalMs / (7 * 24 * 60 * 60 * 1000));
  const elapsed = Math.min(
    total,
    Math.round(elapsedMs / (7 * 24 * 60 * 60 * 1000)),
  );
  return { total, elapsed };
}
