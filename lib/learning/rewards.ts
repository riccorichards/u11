import { Types } from "mongoose";
import Player from "@/lib/models/Player";
import { levelForXp } from "@/lib/xp";

/** Adds XP atomically and raises the level if needed. Levels never go down. */
export async function awardXp(
  playerId: Types.ObjectId,
  amount: number,
): Promise<void> {
  if (!amount || amount <= 0) return;
  const updated = await Player.findByIdAndUpdate(
    playerId,
    { $inc: { currentXp: amount } },
    { new: true, projection: { currentXp: 1 } },
  ).lean<{ currentXp: number }>();
  if (!updated) return;
  await Player.updateOne(
    { _id: playerId },
    { $max: { level: levelForXp(updated.currentXp) } },
  );
}
