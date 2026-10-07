export const PLAYER_POSITIONS = ["GK", "DEF", "MID", "FWD"] as const;
export type PlayerPosition = (typeof PLAYER_POSITIONS)[number];

export function isPlayerPosition(value: unknown): value is PlayerPosition {
  return (
    typeof value === "string" &&
    (PLAYER_POSITIONS as readonly string[]).includes(value)
  );
}

/**
 * Whether a topic belongs in a player's view. Topics with no positions stored yet
 * (created before the migration) count as ALL.
 */
export function nodeAppliesToPosition(
  positions: readonly string[] | null | undefined,
  playerPosition: string | null | undefined,
): boolean {
  if (!playerPosition) return true;
  if (!positions || positions.length === 0 || positions.includes("ALL"))
    return true;
  return positions.includes(playerPosition);
}
